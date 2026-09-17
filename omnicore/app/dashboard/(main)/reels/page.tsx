import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentVendor } from "@/lib/vendor";
import { deleteReel } from "@/app/dashboard/(main)/reels/actions";
import FadeInStagger, { FadeInItem } from "@/components/motion/FadeInStagger";

export default async function DashboardReelsPage() {
  const vendor = await getCurrentVendor();
  if (!vendor) return null;

  const supabase = await createClient();
  const { data: reels } = await supabase
    .from("reels")
    .select("*")
    .eq("vendor_id", vendor.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold">Your reels</h2>
        <div className="flex gap-2">
          <Link
            href="/dashboard/reels/new"
            className="rounded-md border-2 border-ink bg-white px-4 py-2 text-sm font-bold shadow-[3px_3px_0_0_#1E3A8A] transition hover:-translate-y-0.5"
          >
            + Upload video
          </Link>
          <Link
            href="/dashboard/live"
            className="rounded-md border-2 border-ink bg-coral px-4 py-2 text-sm font-bold text-paper shadow-[3px_3px_0_0_#1E3A8A] transition hover:-translate-y-0.5"
          >
            ● Go live
          </Link>
        </div>
      </div>

      {!reels || reels.length === 0 ? (
        <p className="mt-6 rounded-lg border-2 border-dashed border-ink/30 p-8 text-center text-sm text-ink/50">
          No reels yet — upload a short product video or go live to appear on /reels.
        </p>
      ) : (
        <FadeInStagger className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reels.map((r) => (
            <FadeInItem
              key={r.id}
              className="overflow-hidden rounded-xl border-2 border-ink bg-white shadow-[3px_3px_0_0_#1E3A8A]"
            >
              <div className="relative aspect-[9/16] max-h-64 w-full overflow-hidden bg-ink/5">
                {r.is_live ? (
                  <div className="flex h-full w-full items-center justify-center bg-coral-tint">
                    <span className="rounded-full border-2 border-ink bg-coral px-3 py-1 font-mono text-xs font-bold text-paper">
                      ● LIVE NOW
                    </span>
                  </div>
                ) : (
                  <video
                    src={r.video_url ?? undefined}
                    poster={r.poster_url}
                    controls
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="p-3">
                <p className="line-clamp-2 text-sm">{r.caption || "(no caption)"}</p>
                <form action={deleteReel.bind(null, r.id)} className="mt-2">
                  <button className="font-mono text-xs font-semibold text-coral hover:underline">
                    Delete
                  </button>
                </form>
              </div>
            </FadeInItem>
          ))}
        </FadeInStagger>
      )}
    </div>
  );
}
