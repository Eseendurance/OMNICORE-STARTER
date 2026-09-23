"use client";

import { useState } from "react";

export default function FollowButton({ vendorId }: { vendorId: string }) {
  const [following, setFollowing] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/vendors/${vendorId}/follow`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update follow status.");
      setFollowing(data.following);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update follow status.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={toggle} disabled={pending} className="rounded-full border-2 border-sky bg-white px-4 py-2 text-sm font-bold text-sky transition hover:bg-sky hover:text-white disabled:opacity-60">
        {pending ? "Updating…" : following ? "Following" : "Follow"}
      </button>
      {error && <p className="mt-1 text-xs text-coral">{error}</p>}
    </div>
  );
}
