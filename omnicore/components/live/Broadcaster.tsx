"use client";

import { useEffect, useRef, useState } from "react";
import type { IAgoraRTCClient, ICameraVideoTrack, IMicrophoneAudioTrack } from "agora-rtc-sdk-ng";

type Status = "idle" | "starting" | "live" | "error" | "ended";

export default function Broadcaster({
  channelName,
  onStart,
  onEnd,
}: {
  channelName: string;
  /** Called once we're actually publishing — create the DB `reels` row here. */
  onStart: () => Promise<void> | void;
  /** Called when the vendor ends the stream — mark the DB row not-live here. */
  onEnd: () => Promise<void> | void;
}) {
  const videoRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const tracksRef = useRef<{ mic: IMicrophoneAudioTrack; cam: ICameraVideoTrack } | null>(null);

  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function goLive() {
    setStatus("starting");
    setError(null);
    try {
      const res = await fetch("/api/live/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelName, role: "host" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not get a live-streaming token.");
        setStatus("error");
        return;
      }

      const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
      const client = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
      await client.setClientRole("host");
      clientRef.current = client;

      await client.join(data.appId, data.channelName, data.token, data.uid);

      const [mic, cam] = await AgoraRTC.createMicrophoneAndCameraTracks();
      tracksRef.current = { mic, cam };
      if (videoRef.current) cam.play(videoRef.current);

      await client.publish([mic, cam]);

      setStatus("live");
      await onStart();
    } catch (err) {
      console.error("Failed to go live:", err);
      setError(err instanceof Error ? err.message : "Could not start the camera/mic.");
      setStatus("error");
    }
  }

  async function endLive() {
    try {
      tracksRef.current?.mic.close();
      tracksRef.current?.cam.close();
      await clientRef.current?.leave();
    } catch (err) {
      console.error("Error ending stream:", err);
    }
    setStatus("ended");
    await onEnd();
  }

  useEffect(() => {
    return () => {
      tracksRef.current?.mic.close();
      tracksRef.current?.cam.close();
      clientRef.current?.leave().catch(() => {});
    };
  }, []);

  return (
    <div>
      <div
        ref={videoRef}
        className="relative aspect-[9/16] max-h-[480px] w-full overflow-hidden rounded-xl border-2 border-ink bg-ink"
      >
        {status === "idle" && (
          <div className="flex h-full items-center justify-center text-sm text-paper/70">
            Camera preview will appear here
          </div>
        )}
        {status === "live" && (
          <span className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full border-2 border-paper bg-coral px-3 py-1 font-mono text-xs font-bold text-paper">
            <span className="h-1.5 w-1.5 rounded-full bg-paper" />
            LIVE
          </span>
        )}
      </div>

      {error && (
        <p className="mt-3 rounded-md border-2 border-coral bg-coral-tint px-3 py-2 text-sm text-coral">
          {error}
        </p>
      )}

      <div className="mt-4">
        {status === "idle" || status === "error" ? (
          <button
            onClick={goLive}
            className="w-full rounded-md border-2 border-ink bg-coral px-4 py-3 font-bold text-paper shadow-[3px_3px_0_0_#1E3A8A] transition hover:-translate-y-0.5"
          >
            ● Go live
          </button>
        ) : status === "starting" ? (
          <button
            disabled
            className="w-full rounded-md border-2 border-ink bg-ink/10 px-4 py-3 font-bold text-ink/50"
          >
            Connecting…
          </button>
        ) : status === "live" ? (
          <button
            onClick={endLive}
            className="w-full rounded-md border-2 border-ink bg-white px-4 py-3 font-bold text-coral"
          >
            End stream
          </button>
        ) : (
          <p className="rounded-md border-2 border-ink bg-jade-tint px-3 py-2 text-center text-sm font-semibold text-jade">
            Stream ended.
          </p>
        )}
      </div>
    </div>
  );
}
