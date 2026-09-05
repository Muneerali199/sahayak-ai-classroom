#!/usr/bin/env python3
"""
Agora voice bridge — publishes Sahayak's Piper voice into Agora RTC channels.

This script runs inside the Piper venv (Python 3.11) because the Agora Python
Server SDK ships 3.11 wheels while the main backend runs system Python 3.14.

Protocol: one JSON command per line on stdin, one JSON response per line on
stdout. The backend spawns us with the AGORA_* env vars already populated.

Commands
--------
{"cmd":"speak","id":"...","channel":"...","token":"...","text":"..."}
    Synthesize `text` with Piper and publish it into `channel`.
{"cmd":"ping","id":"..."}
{"cmd":"shutdown"}
"""

import io
import json
import logging
import os
import struct
import sys
import threading
import time
import wave

BACKEND_DIR = os.path.normpath(
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "backend", "classroom")
)
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from agora.rtc.agora_base import (  # noqa: E402
    AudioPublishType,
    AudioProfileType,
    AudioScenarioType,
    AudioSubscriptionOptions,
    ClientRoleType,
    ChannelProfileType,
    RTCConnConfig,
    RtcConnectionPublishConfig,
    VideoPublishType,
)
from agora.rtc.agora_service import AgoraService, AgoraServiceConfig  # noqa: E402
from tts import synthesize  # noqa: E402  (Piper lives in the same venv)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [bridge] %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

PUSH_RATE = int(os.environ.get("AGORA_PUSH_RATE", "16000"))  # Agora's standard custom-PCM pipeline rate
PUSH_CHANNELS = 1
FRAME_MS = 50
AI_UID = int(os.environ.get("AGORA_AI_UID", "1396787265"))
# Piper/edge outputs are near full-scale; scale down before pushing so
# listeners never get blasted. 0.35 ≈ −9 dB of headroom.
AI_VOLUME = float(os.environ.get("AGORA_AI_VOLUME", "0.35"))
# Silence appended after each broadcast so the stream ends cleanly (ms).
TAIL_SILENCE_MS = 250
# AI_SERVER uses the "direct" custom track (muted/extra from a web RTC client's
# perspective). DEFAULT uses a regular custom track that web clients see as a
# normal published (unmuted) audio track.
SCENARIO = os.environ.get("BRIDGE_SCENARIO", "AI_SERVER").upper()
_IDLE_TIMEOUT_S = 120.0
_REAP_INTERVAL_S = 20.0


# ─── WAV decode + resample ───────────────────────────────────────────

def _decode_wav(data: bytes):
    """Return (pcm_16bit_mono_bytes, sample_rate)."""
    with io.BytesIO(data) as buf, wave.open(buf, "rb") as w:
        nch = w.getnchannels()
        sw = w.getsampwidth()
        rate = w.getframerate()
        if sw != 2:
            raise ValueError(f"expected 16-bit PCM WAV, got {sw * 8}-bit")
        raw = w.readframes(w.getnframes())
    if nch == 1:
        return raw, rate
    # Down-mix to mono
    samples = struct.unpack(f"<{len(raw) // 2}h", raw)
    mono = struct.pack(f"<{len(samples) // nch}h",
                       *(sum(samples[i:i + nch]) // nch for i in range(0, len(samples), nch)))
    return mono, rate


def _resample(pcm: bytes, src_rate: int, dst_rate: int) -> bytes:
    """Linear-interpolation resample of 16-bit mono PCM."""
    if src_rate == dst_rate or not pcm:
        return pcm
    src = struct.unpack(f"<{len(pcm) // 2}h", pcm)
    out_len = max(1, int(len(src) * dst_rate / src_rate))
    ratio = src_rate / dst_rate
    out = []
    pos = 0.0
    while len(out) < out_len:
        i = int(pos)
        if i >= len(src) - 1:
            out.append(src[-1])
            break
        frac = pos - i
        out.append(int(src[i] + (src[i + 1] - src[i]) * frac))
        pos += ratio
    return struct.pack(f"<{len(out)}h", *out)


def _fade_edges(pcm: bytes, rate: int, ms: int = 12) -> bytes:
    """Apply a short fade-in/out so broadcast boundaries don't click/pop."""
    if not pcm:
        return pcm
    n_fade = min(int(rate * ms // 1000), len(pcm) // 4)
    if n_fade < 2:
        return pcm
    samples = list(struct.unpack(f"<{len(pcm) // 2}h", pcm))
    for i in range(n_fade):
        gain = i / n_fade
        samples[i] = int(samples[i] * gain)
        j = len(samples) - 1 - i
        samples[j] = int(samples[j] * gain)
    return struct.pack(f"<{len(samples)}h", *samples)


def _scale(pcm: bytes, gain: float) -> bytes:
    """Scale PCM amplitude (gain <= 1 => quieter), clipping at int16 range."""
    if gain >= 1.0 or not pcm:
        return pcm
    samples = struct.unpack(f"<{len(pcm) // 2}h", pcm)
    scaled = [max(-32768, min(32767, int(s * gain))) for s in samples]
    return struct.pack(f"<{len(scaled)}h", *scaled)


def _append_silence(pcm: bytes, rate: int, ms: int) -> bytes:
    if ms <= 0:
        return pcm
    n = int(rate * ms // 1000) * 2
    return pcm + b"\x00" * n


def _pad_to_10ms(pcm: bytes, rate: int, channels: int) -> bytes:
    """Pad to a whole number of 10ms frames.

    push_audio_pcm_data rejects (error -1002) any chunk whose length is not a
    multiple of 1ms of audio; a short final chunk would be silently dropped,
    clipping/garbling the last word of every broadcast.
    """
    unit = int(rate * channels * 2 / 1000 * 10)
    pad = (-len(pcm)) % unit
    if pad:
        return pcm + b"\x00" * pad
    return pcm


# ─── Broadcaster ─────────────────────────────────────────────────────

class Broadcaster:
    def __init__(self):
        self._lock = threading.Lock()
        self._service: AgoraService | None = None
        self._conns: dict[str, tuple] = {}  # channel -> (connection, last_used_ts)
        self._publish_locks: dict[str, threading.Lock] = {}  # one broadcast at a time per channel
        self._keepers: dict[str, threading.Event] = {}  # channel -> stop event for silence keeper
        self._stop = False
        threading.Thread(target=self._reaper, daemon=True).start()

    # service init ----------------------------------------------------
    def _ensure_service(self) -> AgoraService:
        if self._service:
            return self._service
        appid = os.environ.get("AGORA_APP_ID", "")
        if not appid:
            raise RuntimeError("AGORA_APP_ID is not set")
        cfg = AgoraServiceConfig()
        cfg.appid = appid
        cfg.log_file_size_kb = 1024
        svc = AgoraService()
        svc.initialize(cfg)
        self._service = svc
        logger.info("AgoraService initialized (appid=%s...)", appid[:8])
        return svc

    # connection handling --------------------------------------------
    def _get_connection(self, channel: str, token: str):
        with self._lock:
            entry = self._conns.get(channel)
            if entry:
                conn = entry[0]
                self._conns[channel] = (conn, time.time())
                return conn
            conn_conf = RTCConnConfig(
                client_role_type=ClientRoleType.CLIENT_ROLE_BROADCASTER,
                channel_profile=(
                    ChannelProfileType.CHANNEL_PROFILE_LIVE_BROADCASTING
                    if SCENARIO == "AI_SERVER"
                    else ChannelProfileType.CHANNEL_PROFILE_COMMUNICATION
                ),
                # The AI only publishes; never self-subscribes (prevents any
                # loop where its own audio re-enters the channel as "music").
                auto_subscribe_audio=0,
                audio_subs_options=AudioSubscriptionOptions(
                    packet_only=0,
                    pcm_data_only=0,
                    bytes_per_sample=2,
                    number_of_channels=1,
                    sample_rate_hz=PUSH_RATE,
                ),
            )
            pub_conf = RtcConnectionPublishConfig(
                audio_profile=AudioProfileType.AUDIO_PROFILE_DEFAULT,
                audio_scenario=(
                    AudioScenarioType.AUDIO_SCENARIO_AI_SERVER
                    if SCENARIO == "AI_SERVER"
                    else AudioScenarioType.AUDIO_SCENARIO_DEFAULT
                ),
                is_publish_audio=True,
                is_publish_video=False,
                audio_publish_type=AudioPublishType.AUDIO_PUBLISH_TYPE_PCM,
                video_publish_type=VideoPublishType.VIDEO_PUBLISH_TYPE_NONE,
            )
            conn = self._ensure_service().create_rtc_connection(conn_conf, pub_conf)
            rc = conn.connect(token, channel, str(AI_UID))
            if rc != 0:
                conn = None
                raise RuntimeError(f"connect to {channel} failed rc={rc}")
            # announce the audio track so RTC (web) peers see it as published
            try:
                conn.publish_audio()
            except Exception:  # noqa: BLE001
                pass
            # (still holding the outer self._lock from _get_connection)
            self._conns[channel] = (conn, time.time())
            self._publish_locks.setdefault(channel, threading.Lock())
            stop_evt = threading.Event()
            self._keepers[channel] = stop_evt
            threading.Thread(
                target=self._keeper_loop, args=(channel, stop_evt),
                daemon=True, name=f"keeper-{channel}",
            ).start()
            logger.info("joined channel %s (uid %s)", channel, AI_UID)
            return conn

    def _keeper_loop(self, channel: str, stop_evt: threading.Event):
        """Keep the AI's audio track published between broadcasts.

        The native SDK unpublishes a custom PCM track a few seconds after its
        data stops ("stream removed"). Every re-publish cycle tears down and
        recreates the audio element on every client — those transitions are
        audible glitches (the mid-speech "background bad voice"). Pushing a
        trickle of silence keeps the track alive, exactly like a real mic.
        """
        conn = self._conns.get(channel, (None,))[0]
        if conn is None:
            return
        silence = b"\x00" * int(PUSH_RATE * PUSH_CHANNELS * 2 * 0.1)  # 100ms
        while not stop_evt.is_set() and not self._stop:
            stop_evt.wait(0.1)
            if stop_evt.is_set() or self._stop:
                break
            with self._lock:
                entry = self._conns.get(channel)
                if not entry or entry[0] is not conn:
                    break  # connection was released
                self._conns[channel] = (conn, time.time())  # keeper = alive
            with self._lock:
                pub_lock = self._publish_locks.get(channel)
            if pub_lock is None:
                continue
            if pub_lock.acquire(blocking=False):
                # Speech broadcast not in flight — top the track up with
                # silence so the SDK never sees an empty sender buffer.
                try:
                    conn.push_audio_pcm_data(bytearray(silence), PUSH_RATE, PUSH_CHANNELS, 0)
                except Exception:  # noqa: BLE001
                    pass
                pub_lock.release()
        logger.info("silence keeper stopped for %s", channel)

    def _release(self, channel: str):
        with self._lock:
            entry = self._conns.pop(channel, None)
            evt = self._keepers.pop(channel, None)
        if evt:
            evt.set()
        if not entry:
            return
        conn = entry[0]
        try:
            conn.disconnect()
        except Exception:  # noqa: BLE001
            pass
        try:
            conn.release()
        except Exception:  # noqa: BLE001
            pass
        logger.info("released channel %s", channel)

    def _reaper(self):
        while not self._stop:
            time.sleep(_REAP_INTERVAL_S)
            stale = [c for c, (_, ts) in self._conns.items() if time.time() - ts > _IDLE_TIMEOUT_S]
            for c in stale:
                self._release(c)

    # publish ----------------------------------------------------------
    def publish(self, channel: str, token: str, pcm: bytes, rate: int, channels: int):
        with self._lock:
            pub_lock = self._publish_locks.setdefault(channel, threading.Lock())
        # Serialize broadcasts on the same channel: two overlapping pushes
        # into one connection mix PCM and produce audible glitches/noise.
        with pub_lock:
            pcm = _scale(pcm, AI_VOLUME)
            pcm = _fade_edges(pcm, rate)
            pcm = _append_silence(pcm, rate, TAIL_SILENCE_MS)
            pcm = _pad_to_10ms(pcm, rate, channels)
            conn = self._get_connection(channel, token)
            # Mirrors the SDK's own AudioConsumer pacing (10ms frame units,
            # ~200ms pushed ahead of the playback clock): without this lead
            # any scheduler hiccup starves the encoder and listeners hear
            # glitches mid-speech.
            bytes_per_ms = rate * channels * 2 / 1000
            unit_ms = 10
            lead_ms = 200
            total_ms = len(pcm) / bytes_per_ms
            start = time.time()
            pushed_ms = 0.0
            _emit({"event": "speech", "channel": channel, "state": "start"})
            try:
                while pushed_ms < total_ms and not self._stop:
                    elapsed_ms = (time.time() - start) * 1000
                    target_ms = min(elapsed_ms + lead_ms, total_ms)
                    while pushed_ms < target_ms:
                        n_ms = min(unit_ms, total_ms - pushed_ms)
                        i0 = int(round(pushed_ms * bytes_per_ms))
                        i1 = int(round((pushed_ms + n_ms) * bytes_per_ms))
                        conn.push_audio_pcm_data(
                            bytearray(pcm[i0:i1]), rate, channels, 0
                        )
                        pushed_ms += n_ms
                    time.sleep(0.004)
            finally:
                # Hold the stream open briefly after the last frame so the
                # SDK's sender drains cleanly (no abrupt cut artifact).
                time.sleep(0.25)
                _emit({"event": "speech", "channel": channel, "state": "stop"})
            return pushed_ms / 1000.0

    def shutdown(self):
        self._stop = True
        for c in list(self._conns.keys()):
            self._release(c)
        if self._service:
            try:
                self._service.release()
            except Exception:  # noqa: BLE001
                pass
            self._service = None


BROADCASTER = Broadcaster()

# stdout is shared by response lines (main loop) and event lines (publish
# threads) — serialize writes so they never interleave into broken JSON.
_stdout_lock = threading.Lock()


def _emit(event: dict):
    """Notify the backend of a lifecycle event (e.g. speech start/stop)."""
    with _stdout_lock:
        print(json.dumps(event), flush=True)


# ─── Command handlers ────────────────────────────────────────────────

def handle_speak(cmd: dict) -> dict:
    text = cmd.get("text", "")
    if not text:
        return {"ok": False, "error": "empty text"}
    rate_push = int(cmd.get("rate", PUSH_RATE))
    wav, _ = synthesize(text, cmd.get("lang"))
    pcm, rate = _decode_wav(wav)
    pcm = _resample(pcm, rate, rate_push)
    try:
        seconds = BROADCASTER.publish(
            cmd["channel"], cmd["token"], pcm, rate_push, PUSH_CHANNELS
        )
        return {"ok": True, "seconds": round(seconds, 2), "pcm_bytes": len(pcm), "text_len": len(text), "rate": rate_push}
    except Exception as e:  # noqa: BLE001
        logger.error("publish failed: %s", e, exc_info=True)
        return {"ok": False, "error": str(e)}


def handle_leave(cmd: dict) -> dict:
    channel = cmd.get("channel", "")
    if not channel:
        return {"ok": False, "error": "no channel"}
    BROADCASTER._release(channel)
    return {"ok": True, "channel": channel}


def main():
    logger.info("bridge started (python %s)", sys.version.split()[0])
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            cmd = json.loads(line)
        except json.JSONDecodeError:
            print(json.dumps({"ok": False, "error": "bad json"}), flush=True)
            continue

        ctype = cmd.get("cmd")
        cid = cmd.get("id", "")
        try:
            if ctype == "speak":
                resp = handle_speak(cmd)
            elif ctype == "leave":
                resp = handle_leave(cmd)
            elif ctype == "ping":
                resp = {"ok": True, "pong": time.time()}
            elif ctype == "shutdown":
                resp = {"ok": True}
                with _stdout_lock:
                    print(json.dumps({"id": cid, **resp}), flush=True)
                break
            else:
                resp = {"ok": False, "error": f"unknown cmd {ctype!r}"}
        except Exception as e:  # noqa: BLE001
            logger.error("handler crashed: %s", e, exc_info=True)
            resp = {"ok": False, "error": str(e)}
        with _stdout_lock:
            print(json.dumps({"id": cid, **resp}), flush=True)

    BROADCASTER.shutdown()
    logger.info("bridge exited")
    sys.exit(0)


if __name__ == "__main__":
    main()