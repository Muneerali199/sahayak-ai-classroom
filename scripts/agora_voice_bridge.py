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
import re
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
# Audio kept queued in the sender ahead of playback (ms). The speech
# publisher and the keep-alive feeder both hold this much lead so the sender
# never starves on scheduler hiccups (starvation = receiver-side loss
# concealment = the "background voice" artifact).
LEAD_MS = 250
# Between broadcasts, feed a very low-level noise floor instead of digital
# silence. Agora's server-side level monitor flags pure silence as
# AUDIO_OUTPUT_LEVEL_TOO_LOW and its recovery transition corrupts the first
# moments of the next speech (audible bursts). A -50 dB dither keeps the
# stream "live" for the monitor while staying inaudible to listeners
# (further attenuated by AI_VOLUME and the browser's track volume).
DITHER_AMP = int(os.environ.get("AGORA_KEEPALIVE_LEVEL", "600"))  # int16 amplitude
KEEPER_CUSHION_MS = 150
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
        self._keepers: dict[str, threading.Event] = {}  # channel -> stop event for the dither feeder
        # Shared per-channel stream clock: t0 = when audio first flowed,
        # pos_ms = total ms of audio written so far (speech + dither). Both
        # the speech publisher and the dither feeder write against this clock
        # so the sender buffer always holds a healthy cushion — never zero,
        # never an unbounded burst.
        self._stream_t0: dict[str, float] = {}
        self._stream_pos_ms: dict[str, float] = {}
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
        """Feed a low-level dither between broadcasts.

        Two jobs: (1) keep the custom PCM track published (the native SDK
        unpublishes it seconds after its data stops — every re-publish churns
        audio elements on all clients) and (2) keep the stream's level above
        the server's AUDIO_OUTPUT_LEVEL_TOO_LOW threshold, whose recovery
        transition corrupts the onset of the next speech. The dither is
        ~-50 dB before AI_VOLUME/browser attenuation — inaudible.

        Paced against the shared stream clock with a small cushion so the
        sender never starves (starvation = receiver concealment garbage).
        """
        import random
        conn = self._conns.get(channel, (None,))[0]
        if conn is None:
            return
        unit_ms = 100
        samples_per_unit = PUSH_RATE * PUSH_CHANNELS * unit_ms // 1000
        rng = random.Random(0x5A4A594B)  # deterministic per-run
        while not stop_evt.is_set() and not self._stop:
            stop_evt.wait(0.05)
            if stop_evt.is_set() or self._stop:
                break
            with self._lock:
                entry = self._conns.get(channel)
                if not entry or entry[0] is not conn:
                    break  # connection was released
                self._conns[channel] = (conn, time.time())  # keeper = alive
                t0 = self._stream_t0.get(channel)
                pos = self._stream_pos_ms.get(channel, 0.0)
            if t0 is None:
                continue  # stream not started — first speech starts the clock
            pub_lock = self._publish_locks.get(channel)
            if pub_lock is None:
                continue
            if not pub_lock.acquire(blocking=False):
                continue  # a speech broadcast is in flight
            try:
                with self._lock:
                    t0 = self._stream_t0.get(channel)
                    pos = self._stream_pos_ms.get(channel, 0.0)
                if t0 is None:
                    continue
                target = (time.time() - t0) * 1000 + KEEPER_CUSHION_MS
                pushed = False
                while pos + unit_ms <= target:
                    chunk = struct.pack(
                        f"<{samples_per_unit}h",
                        *(rng.randint(-DITHER_AMP, DITHER_AMP)
                          for _ in range(samples_per_unit // PUSH_CHANNELS))
                    )
                    conn.push_audio_pcm_data(
                        bytearray(chunk), PUSH_RATE, PUSH_CHANNELS, 0
                    )
                    pos += unit_ms
                    pushed = True
                if pushed:
                    with self._lock:
                        self._stream_pos_ms[channel] = pos
            except Exception:  # noqa: BLE001
                pass
            finally:
                pub_lock.release()
        logger.info("dither keeper stopped for %s", channel)

    def _release(self, channel: str):
        with self._lock:
            entry = self._conns.pop(channel, None)
            evt = self._keepers.pop(channel, None)
            # Reset the stream clock: a future rejoin starts a fresh stream.
            self._stream_t0.pop(channel, None)
            self._stream_pos_ms.pop(channel, None)
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
            # Pace against the shared stream clock (the same one the dither
            # feeder advances), holding LEAD_MS of audio queued ahead of
            # playback. If the clock has badly lagged wall time (feeder died
            # or the channel sat idle past the dither's coverage), reset it
            # so this broadcast streams paced instead of bursting.
            bytes_per_ms = rate * channels * 2 / 1000
            total_ms = len(pcm) / bytes_per_ms
            with self._lock:
                t0 = self._stream_t0.get(channel)
                pos = self._stream_pos_ms.get(channel, 0.0)
                if t0 is None or (time.time() - t0) * 1000 - pos > 1000:
                    t0 = time.time()
                    pos = 0.0
                    self._stream_t0[channel] = t0
                    self._stream_pos_ms[channel] = 0.0
            pos_start = pos
            end_ms = pos_start + total_ms
            _emit({"event": "speech", "channel": channel, "state": "start"})
            try:
                while pos < end_ms and not self._stop:
                    elapsed_ms = (time.time() - t0) * 1000
                    target = min(end_ms, elapsed_ms + LEAD_MS)
                    while pos < target:
                        n_ms = min(10, end_ms - pos)
                        i0 = int(round((pos - pos_start) * bytes_per_ms))
                        i1 = int(round((pos - pos_start + n_ms) * bytes_per_ms))
                        conn.push_audio_pcm_data(
                            bytearray(pcm[i0:i1]), rate, channels, 0
                        )
                        pos += n_ms
                    with self._lock:
                        self._stream_pos_ms[channel] = pos
                    time.sleep(0.004)
                # Hold the stream open briefly after the last frame so the
                # SDK's sender drains cleanly (no abrupt cut artifact).
                time.sleep(0.25)
                _emit({"event": "speech", "channel": channel, "state": "stop"})
            except Exception as e:  # noqa: BLE001
                # Dead/unusable connection (server timeout etc.) — drop it so
                # the next broadcast reconnects fresh instead of failing too.
                logger.error("publish to %s failed (%s); releasing connection", channel, e)
                self._release(channel)
                raise
            finally:
                with self._lock:
                    self._stream_pos_ms[channel] = max(
                        self._stream_pos_ms.get(channel, 0.0), pos
                    )
            return total_ms / 1000.0

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

def _tts_clean(text: str) -> str:
    """Strip markdown so the voice reads sentences, not symbols.

    Piped-in replies often contain bullet dashes, asterisks, numbering and
    em-dashes that TTS voices pronounce harshly or as garbage ("dash dash").
    """
    t = re.sub(r"```.*?```", " ", text, flags=re.S)          # code blocks
    t = re.sub(r"`([^`]*)`", r"\1", t)                       # inline code
    t = re.sub(r"[*_#>|]+", " ", t)                          # md emphasis/headers
    t = re.sub(r"^\s*[-–—•·]+\s*", " ", t, flags=re.M)       # bullet markers
    t = re.sub(r"\s+[-–—]\s+", ", ", t)                      # mid-sentence dashes → pause
    t = re.sub(r"^\s*\d+[\.\)]\s*", " ", t, flags=re.M)      # list numbering
    t = re.sub(r"[èé]{2,}", "", t)                           # stray symbol runs
    t = re.sub(r"\s{2,}", " ", t).strip()
    return t


def handle_speak(cmd: dict) -> dict:
    text = cmd.get("text", "")
    if not text:
        return {"ok": False, "error": "empty text"}
    rate_push = int(cmd.get("rate", PUSH_RATE))
    text = _tts_clean(text)
    if not text:
        return {"ok": False, "error": "empty after cleanup"}
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