"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function FollowVendorButton({ vendorId }: { vendorId: string }) {
  const router = useRouter();
  const [following, setFollowing] = useState(false);
  const [followers, setFollowers] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch(`/api/vendors/${vendorId}/follow`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Could not load follow details.");
        if (active) {
          setFollowing(data.following);
          setFollowers(data.followers);
        }
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load follow details.");
      });
    return () => { active = false; };
  }, [vendorId]);

  async function toggleFollow() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/vendors/${vendorId}/follow`, { method: following ? "DELETE" : "POST" });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 401) router.push("/login");
        throw new Error(data.error ?? "Could not update follow status.");
      }
      setFollowing(data.following);
      setFollowers(data.followers);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update follow status.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={toggleFollow} disabled={busy} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-800 disabled:opacity-60">
        {busy ? "Saving..." : following ? "Following" : "Follow store"}
      </button>
      {followers !== null && <span className="ml-2 text-xs text-blue-800">{followers.toLocaleString()} followers</span>}
      {error && <p className="mt-1 text-xs text-blue-800" role="status">{error}</p>}
    </div>
  );
}
