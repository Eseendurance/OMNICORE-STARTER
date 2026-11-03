"use client";

import { useEffect, useRef, useState } from "react";
import type { IAgoraRTCClient, IAgoraRTCRemoteUser, ICameraVideoTrack, IMicrophoneAudioTrack } from "agora-rtc-sdk-ng";
import { setSpaceLive } from "@/app/community/spaces/actions";

export default function SpaceLiveRoom({
  spaceId,
  isLive,
  isOwner,
}: {
  spaceId: string;
  isLive: boolean;
  isOwner: boolean;
}) {
  const videoRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const tracksRef = useRef<{ mic: IMicrophoneAudioTrack; cam: ICameraVideoTrack } | null>(null);
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function leaveRoom() {
    tracksRef.current?.mic.close();
    tracksRef.current?.cam.close();
    tracksRef.current = null;
    await clientRef.current?.leave();
    clientRef.current = null;
    setConnected(false);
  }

  async function joinRoom(role: "host" | "audience") {
    const response = await fetch("/api/live/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spaceId, role }),
    });
    const tokenData = await response.json();
    if (!response.ok) throw new Error(tokenData.error || "Could not join this lounge.");

    const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
    const client = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
    clientRef.current = client;
    await client.setClientRole(role);
    client.on("user-published", async (user: IAgoraRTCRemoteUser, mediaType) => {
      await client.subscribe(user, mediaType);
      if (mediaType === "video" && videoRef.current) user.videoTrack?.play(videoRef.current);
      if (mediaType === "audio") user.audioTrack?.play();
    });
    await client.join(tokenData.appId, tokenData.channelName, tokenData.token, tokenData.uid);

    if (role === "host") {
      const [mic, cam] = await AgoraRTC.createMicrophoneAndCameraTracks();
      tracksRef.current = { mic, cam };
      if (videoRef.current) cam.play(videoRef.current);
      await client.publish([mic, cam]);
    }
    setConnected(true);
  }

  async function handleJoin() {
    setBusy(true);
    setError(null);
    try {
      await joinRoom("audience");
    } catch (joinError) {
      console.error("Could not join vendor lounge:", joinError);
      setError(joinError instanceof Error ? joinError.message : "Could not join this lounge.");
      await leaveRoom();
    } finally {
      setBusy(false);
    }
  }

  async function handleStart() {
    setBusy(true);
    setError(null);
    try {
      await joinRoom("host");
      const result = await setSpaceLive(spaceId, true);
      if (result.error) throw new Error(result.error);
    } catch (startError) {
      console.error("Could not start vendor lounge:", startError);
      setError(startError instanceof Error ? startError.message : "Could not start this lounge.");
      await leaveRoom();
    } finally {
      setBusy(false);
    }
  }

  async function handleStop() {
    setBusy(true);
    setError(null);
    try {
      await leaveRoom();
      const result = await setSpaceLive(spaceId, false);
      if (result.error) throw new Error(result.error);
    } catch (stopError) {
      console.error("Could not stop vendor lounge:", stopError);
      setError(stopError instanceof Error ? stopError.message : "Could not stop this lounge.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => () => {
    tracksRef.current?.mic.close();
    tracksRef.current?.cam.close();
    clientRef.current?.leave().catch((leaveError) => {
      console.error("Could not leave vendor lounge:", leaveError);
    });
  }, []);

  return (
    <section className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold text-blue-950">{isLive ? "Live vendor lounge" : "Audio and video lounge"}</h2>
          <p className="mt-1 text-sm text-blue-800">
            {connected ? "You are connected. Keep your conversation about this trade." : isLive ? "Join the live conversation." : "The owner can open this room for a live conversation."}
          </p>
        </div>
        {isOwner ? (
          isLive ? (
            <button type="button" onClick={handleStop} disabled={busy} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
              {busy ? "Closing…" : connected ? "End lounge" : "Close lounge"}
            </button>
          ) : (
            <button type="button" onClick={handleStart} disabled={busy} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
              {busy ? "Opening…" : "Start lounge"}
            </button>
          )
        ) : isLive && !connected ? (
          <button type="button" onClick={handleJoin} disabled={busy} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
            {busy ? "Joining…" : "Join lounge"}
          </button>
        ) : connected ? (
          <button type="button" onClick={leaveRoom} className="rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-bold text-blue-800">
            Leave lounge
          </button>
        ) : null}
      </div>
      {(connected || isOwner) && <div ref={videoRef} className="mt-4 aspect-video w-full overflow-hidden rounded-lg bg-blue-100" />}
      {error && <p role="alert" className="mt-3 text-sm font-medium text-red-700">{error}</p>}
    </section>
  );
}
