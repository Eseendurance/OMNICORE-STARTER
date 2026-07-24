"use client";

import { useState } from "react";
import Broadcaster from "@/components/live/Broadcaster";
import { startLiveReel, endLiveReel } from "@/app/dashboard/(main)/live/actions";

export default function LiveDashboard({
  vendorId,
  vendorName,
}: {
  vendorId: string;
  vendorName: string;
}) {
  const [caption, setCaption] = useState("");
  const [reelId, setReelId] = useState<string | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);

  // Deterministic per-vendor channel name so the public /reels page can
  // derive the same channel from the reels row without a schema change.
  const channelName = `live-${vendorId}`;

  async function handleStart() {
    const result = await startLiveReel(caption);
    if ("error" in result) {
      setDbError(result.error);
      return;
    }
    setReelId(result.id);
  }

  async function handleEnd() {
    if (reelId) await endLiveReel(reelId);
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="font-display text-2xl font-bold">Go live</h1>
      <p className="mt-1 text-sm text-ink/60">
        Broadcasts to everyone browsing /reels in real time, as {vendorName}.
      </p>

      {!reelId && (
        <label className="mt-4 flex flex-col gap-1">
          <span className="font-mono text-xs font-semibold uppercase text-ink/60">
            Caption (shown to viewers)
          </span>
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Restock drop happening now"
            className="rounded-md border-2 border-ink bg-white px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-marigold/40"
          />
        </label>
      )}

      {dbError && (
        <p className="mt-3 rounded-md border-2 border-coral bg-coral-tint px-3 py-2 text-sm text-coral">
          {dbError}
        </p>
      )}

      <div className="mt-4">
        <Broadcaster channelName={channelName} onStart={handleStart} onEnd={handleEnd} />
      </div>
    </div>
  );
}
