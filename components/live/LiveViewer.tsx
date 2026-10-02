"use client";

import { useEffect, useRef, useState } from "react";
import type { IAgoraRTCClient, IAgoraRTCRemoteUser } from "agora-rtc-sdk-ng";

type Status = "connecting" | "watching" | "ended" | "error";

export default function LiveViewer({ channelName }: { channelName: string }) {
  const videoRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const [status, setStatus] = useState<Status>("connecting");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function join() {
      try {
        const res = await fetch("/api/live/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ channelName, role: "audience" }),
        });
        const data = await res.json();
        if (!res.ok) {
          if (!cancelled) {
            setError(data.error || "Live streaming isn't available right now.");
            setStatus("error");
          }
          return;
        }

        const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
        const client = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
        await client.setClientRole("audience");
        clientRef.current = client;

        client.on("user-published", async (user: IAgoraRTCRemoteUser, mediaType) => {
          await client.subscribe(user, mediaType);
          if (mediaType === "video" && videoRef.current) {
            user.videoTrack?.play(videoRef.current);
          }
          if (mediaType === "audio") {
            user.audioTrack?.play();
          }
          if (!cancelled) setStatus("watching");
        });

        client.on("user-unpublished", () => {
          if (!cancelled) setStatus("ended");
        });

        await client.join(data.appId, data.channelName, data.token, data.uid);
      } catch (err) {
        console.error("Failed to join live stream:", err);
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not connect to the stream.");
          setStatus("error");
        }
      }
    }

    join();

    return () => {
      cancelled = true;
      clientRef.current?.leave().catch(() => {});
    };
  }, [channelName]);

  return (
    <div ref={videoRef} className="absolute inset-0 h-full w-full bg-ink">
      {status === "connecting" && (
        <div className="flex h-full items-center justify-center font-mono text-sm text-paper/70">
          Connecting to live stream…
        </div>
      )}
      {status === "ended" && (
        <div className="flex h-full items-center justify-center font-mono text-sm text-paper/70">
          This stream has ended.
        </div>
      )}
      {status === "error" && (
        <div className="flex h-full items-center justify-center px-6 text-center font-mono text-sm text-coral">
          {error}
        </div>
      )}
    </div>
  );
}
