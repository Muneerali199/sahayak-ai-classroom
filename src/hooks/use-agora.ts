"use client";

// Live classroom audio via Agora RTC. Each participant joins the room's
// channel so everyone (teacher + students) shares the same audio, and the AI
// co-teacher's voice can be broadcast into it by the backend.

import { useCallback, useEffect, useRef, useState } from "react";
import type { IAgoraRTCClient, ILocalAudioTrack } from "agora-rtc-sdk-ng";

const BACKEND = "http://127.0.0.1:8001";

// The backend's AI voice uid. Remote audio from this uid is played softly in
// the browser to avoid ear-blasting; classroom echo-cancellation (AEC) is set
// on the local mic track so the AI voice doesn't loop back into the channel.
const AI_UID = Number(process.env.NEXT_PUBLIC_AGORA_AI_UID) || 1396787265;
const AI_TRACK_VOLUME = Number(process.env.NEXT_PUBLIC_AGORA_AI_VOLUME) || 40; // 0-100

type AgoraStatus = "idle" | "joining" | "joined" | "error";

interface UseAgoraOptions {
  channel: string;
  uid: string;
  role: "teacher" | "student";
  enabled: boolean;
}

// Agora RTC touches `window` at import time, so load it lazily in the browser
// only (keeps the room page SSR-safe).
async function loadAgora() {
  if (typeof window === "undefined") return null;
  const mod = await import("agora-rtc-sdk-ng");
  return mod.default as typeof import("agora-rtc-sdk-ng")["default"];
}

export function useAgora({ channel, uid, role, enabled }: UseAgoraOptions) {
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const micTrackRef = useRef<ILocalAudioTrack | null>(null);
  const duckRef = useRef(false);
  const leaderRef = useRef(true);
  const [status, setStatus] = useState<AgoraStatus>("idle");
  const [peers, setPeers] = useState<number[]>([]);
  const [error, setError] = useState("");
  const [aiOnline, setAiOnline] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [micBusy, setMicBusy] = useState(false);

  // ─── Same-browser multi-tab guard ───────────────────────────────
  // When two tabs of the SAME browser join the same channel (local testing),
  // both play the AI's voice a few hundred ms apart → metallic phasing that
  // sounds like noise under the AI speech. Elect one "audio leader" tab via
  // BroadcastChannel: only it plays remote audio. The teacher tab always
  // wins (they need to hear the room); otherwise oldest tab leads. Tabs in
  // other browsers (real classrooms, separate devices) are unaffected.
  const bcRef = useRef<BroadcastChannel | null>(null);
  const peersRef = useRef<Map<string, { ts: number; seen: number; teacher: boolean }>>(new Map());
  const selfId = useRef(`t-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
  const selfTs = useRef(Date.now());

  const applyRemoteVolumes = useCallback(() => {
    const client = clientRef.current;
    if (!client) return;
    const leader = leaderRef.current;
    client.remoteUsers.forEach((u) => {
      const t = u.audioTrack;
      if (!t) return;
      try {
        t.setVolume(Number(u.uid) === AI_UID && leader ? AI_TRACK_VOLUME : leader ? 100 : 0);
      } catch {
        /* track may be mid-unpublish */
      }
    });
  }, []);

  const electLeader = useCallback(() => {
    const isTeacherTab = role === "teacher";
    let best = { id: selfId.current, ts: selfTs.current, teacher: isTeacherTab };
    peersRef.current.forEach((v, k) => {
      const better =
        v.teacher && !best.teacher ||
        (v.teacher === best.teacher && (v.ts < best.ts || (v.ts === best.ts && k < best.id)));
      if (better) best = { id: k, ts: v.ts, teacher: v.teacher };
    });
    const amLeader = best.id === selfId.current;
    if (amLeader !== leaderRef.current) {
      leaderRef.current = amLeader;
      applyRemoteVolumes();
    }
  }, [role, applyRemoteVolumes]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return;
    const bcName = `sahayak-audio-${channel}`;
    const bc = new BroadcastChannel(bcName);
    bcRef.current = bc;
    const announce = () =>
      bc.postMessage({ id: selfId.current, ts: selfTs.current, teacher: role === "teacher" });
    bc.onmessage = (ev) => {
      const d = ev.data;
      if (!d || d.id === selfId.current) return;
      peersRef.current.set(d.id, { ts: d.ts, seen: Date.now(), teacher: Boolean(d.teacher) });
      electLeader();
    };
    announce();
    const hello = setInterval(announce, 1500);
    const election = setInterval(() => {
      const now = Date.now();
      let changed = false;
      peersRef.current.forEach((v, k) => {
        if (now - v.seen > 5000) { peersRef.current.delete(k); changed = true; }
      });
      electLeader();
      if (changed) applyRemoteVolumes();
    }, 2000);
    return () => {
      clearInterval(hello);
      clearInterval(election);
      bc.close();
      bcRef.current = null;
    };
  }, [channel, role, electLeader, applyRemoteVolumes]);

  // Mute/unmute the local mic (used to duck the mic while the AI's voice
  // plays, so the AI can never hear itself through speakers -> mic -> channel).
  const duckMic = useCallback((duck: boolean) => {
    duckRef.current = duck;
    const track = micTrackRef.current;
    if (!track) return;
    try {
      const r = track.setMuted(duck) as unknown as Promise<void> | undefined;
      if (r && typeof r.catch === "function") r.catch(() => {});
    } catch {
      /* older SDKs return synchronously */
    }
  }, []);

  const leave = useCallback(async () => {
    const client = clientRef.current;
    clientRef.current = null;
    micTrackRef.current?.close();
    micTrackRef.current = null;
    if (!client) {
      setStatus("idle");
      setPeers([]);
      return;
    }
    try {
      await client.leave();
    } catch {
      /* ignore */
    }
    client.remoteUsers.forEach((u) => u.audioTrack?.stop());
    client.removeAllListeners();
    setStatus("idle");
    setPeers([]);
  }, []);

  const join = useCallback(async () => {
    if (clientRef.current) return;
    const AgoraRTC = await loadAgora();
    if (!AgoraRTC) return;

    const safeChannel = channel.replace(/[^a-zA-Z0-9_\-\.]/g, "-").slice(0, 50);
    const numericUid = Array.from(uid).reduce((acc, c) => acc + c.charCodeAt(0), 0) % 1e9 || 1;

    try {
      setStatus("joining");
      setError("");

      const res = await fetch(`${BACKEND}/api/agora/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: safeChannel, uid: numericUid, role: "publisher" }),
      });
      const data = await res.json();
      if (!res.ok || !data.token) throw new Error(data.error || "Failed to get Agora token");

      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      clientRef.current = client;

      client.on("user-joined", (user) => {
        setPeers((prev) => (prev.includes(user.uid as number) ? prev : [...prev, user.uid as number]));
        if (Number(user.uid) === AI_UID) setAiOnline(true);
      });
      client.on("user-left", (user) => {
        setPeers((prev) => prev.filter((u) => u !== user.uid));
        user.audioTrack?.stop();
        // The AI's bridge died (server timeout / backend restart) — surface
        // it so the room can release the mic duck instead of waiting for an
        // AI_VOICE stop event that will never arrive.
        if (Number(user.uid) === AI_UID) setAiOnline(false);
      });
      client.on("user-published", async (user, mediaType) => {
        if (mediaType !== "audio") return;
        await client.subscribe(user, mediaType);
        user.audioTrack?.play();
        // The AI speaks softly; humans at full volume — but only the
        // leader tab outputs anything (same-browser tab guard).
        try {
          if (Number(user.uid) === AI_UID) {
            user.audioTrack?.setVolume(leaderRef.current ? AI_TRACK_VOLUME : 0);
          } else {
            user.audioTrack?.setVolume(leaderRef.current ? 100 : 0);
          }
        } catch {
          /* ignore */
        }
      });
      client.on("user-unpublished", (user, mediaType) => {
        if (mediaType === "audio") user.audioTrack?.stop();
      });

      await client.join(data.app_id, safeChannel, data.token, numericUid);

      setStatus("joined");
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : String(e));
      if (clientRef.current) clientRef.current.removeAllListeners();
      clientRef.current = null;
    }
  }, [channel, uid, role]);

  // Explicit mic control (default OFF). An always-open teacher mic next to
  // loud speakers re-broadcasts the AI's voice and room noise back into the
  // channel — the delayed, noise-suppressed copy is the "old TV static"
  // everyone hears under the AI's speech. The teacher now opens the mic only
  // when they actually want to talk to the class.
  const toggleMic = useCallback(async () => {
    if (micBusy) return;
    const client = clientRef.current;
    if (!client) return;
    setMicBusy(true);
    try {
      if (micTrackRef.current) {
        const track = micTrackRef.current;
        micTrackRef.current = null;
        try { await client.unpublish([track]); } catch { /* ignore */ }
        track.close();
        setMicOn(false);
        return;
      }
      const AgoraRTC = await loadAgora();
      if (!AgoraRTC) return;
      const track = await Promise.race([
        AgoraRTC.createMicrophoneAudioTrack({
          encoderConfig: "speech_standard",
          AEC: true, // echo cancellation kills the speaker->mic feedback loop
          ANS: true, // noise suppression
          AGC: true, // automatic gain control
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Microphone timed out")), 8000)
        ),
      ]);
      const published = await client.publish([track]).then(() => true, () => false);
      if (published) {
        micTrackRef.current = track;
        if (duckRef.current) {
          try { await track.setMuted(true); } catch { /* ignore */ }
        }
        setMicOn(true);
      } else {
        track.close();
        throw new Error("Could not publish microphone");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setMicBusy(false);
    }
  }, [micBusy]);

  useEffect(() => {
    if (!enabled) {
      if (clientRef.current) leave();
      return;
    }
    if (status === "idle" || status === "error") join();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, channel]);

  useEffect(() => {
    return () => {
      micTrackRef.current?.close();
      micTrackRef.current = null;
      if (clientRef.current) {
        clientRef.current.leave().catch(() => {});
      }
    };
  }, []);

  return { status, peers, error, join, leave, duckMic, aiOnline, micOn, micBusy, toggleMic };
}