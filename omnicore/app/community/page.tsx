import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentVendor } from "@/lib/vendor";
import Feed from "@/components/Feed";
import SpaceLounge from "@/components/SpaceLounge";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Community — Kivo",
  description: "Commerce-first conversations, dispatch proof, and vendor spaces.",
};

export default async function CommunityPage() {
  const [vendor, supabase] = await Promise.all([getCurrentVendor(), createClient()]);
  const [{ data: spaces }, { data: products, error: productsError }] = await Promise.all([
    supabase
      .from("vendor_spaces")
      .select("id, name, description, category, is_live")
      .eq("privacy", "public")
      .order("is_live", { ascending: false })
      .limit(4),
    vendor
      ? supabase.from("products").select("id, title").eq("vendor_id", vendor.id).order("created_at", { ascending: false }).limit(50)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (productsError) console.error("Community vendor products query failed:", productsError);

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-10">
      <div className="max-w-2xl">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Community, with receipts</p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-blue-950 sm:text-5xl">People you can buy from, learn from, and ship with.</h1>
        <p className="mt-4 text-base leading-7 text-blue-800">A vendor-first feed for product drops, restocks, real dispatch updates, and useful conversations. No empty follower theatre.</p>
      </div>
      {!vendor && <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl bg-blue-50 p-4 text-sm text-blue-950"><span>Have a store? Share what is moving.</span><Link href="/signup" className="font-bold underline">Start selling</Link></div>}
      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Feed canPost={Boolean(vendor)} products={products ?? []} vendorName={vendor?.name ?? "Your store"} />
        <aside className="space-y-5"><SpaceLounge spaces={spaces ?? []} /><div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 text-sm text-blue-800"><p className="font-semibold text-blue-950">Why this feed is different</p><p className="mt-2 leading-6">Signal grows from replies, useful reactions, verified orders, and dispatch proof — not bots clicking a heart.</p></div></aside>
      </div>
    </div>
  );
}
