import Link from "next/link";
import { getReels } from "@/lib/catalog";
import ReelCard from "@/components/ReelCard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Reels — OmniCore AI",
};

export default async function ReelsPage() {
  const reels = await getReels();

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Reels & Live</h1>
        <button className="rounded-md border-2 border-ink bg-coral px-3 py-1.5 font-mono text-xs font-bold text-paper shadow-[3px_3px_0_0_#14171F]">
          + Go live
        </button>
      </div>
      <p className="mb-6 text-sm text-ink/60">
        Short vendor videos and live drops, swipe up for the next one.
      </p>

      {reels.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-ink/30 p-10 text-center">
          <p className="font-mono text-sm text-ink/50">
            No reels yet — vendors haven&apos;t posted any videos.
          </p>
          <Link
            href="/signup"
            className="mt-4 inline-block rounded-md border-2 border-ink bg-marigold px-4 py-2 text-sm font-bold shadow-[3px_3px_0_0_#14171F] transition hover:-translate-y-0.5"
          >
            Start selling
          </Link>
        </div>
      ) : (
        <div className="flex snap-y snap-mandatory flex-col gap-5 overflow-y-auto">
          {reels.map((r) => (
            <ReelCard key={r.id} reel={r} />
          ))}
        </div>
      )}
    </div>
  );
}
