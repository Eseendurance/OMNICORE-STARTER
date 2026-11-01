import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileCard from "@/components/ProfileCard";

export const dynamic = "force-dynamic";

export default async function CommunitySpacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: space, error } = await supabase
    .from("vendor_spaces")
    .select("id, owner_id, name, description, category, privacy, is_live")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("Community space query failed:", error);
    throw new Error("Could not load this vendor space.");
  }
  if (!space) notFound();

  const { data: owner, error: ownerError } = await supabase
    .from("vendors")
    .select("id, name, slug, location, is_verified")
    .eq("id", space.owner_id)
    .maybeSingle();
  if (ownerError) {
    console.error("Community space owner query failed:", ownerError);
    throw new Error("Could not load the space owner.");
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-10">
      <Link href="/community" className="text-sm font-bold text-blue-700 hover:underline">Back to community</Link>
      <section className="mt-5 rounded-2xl border border-blue-100 bg-white p-6 shadow-sm sm:p-8">
        <p className="font-mono text-xs font-bold uppercase tracking-widest text-blue-700">{space.category} vendor space</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-blue-950">{space.name}</h1>
        <p className="mt-3 text-sm leading-6 text-blue-800">{space.description || "A place for vendors and buyers to talk about this trade."}</p>
        {owner && <div className="mt-5"><ProfileCard vendor={owner} /></div>}
        <div className="mt-6 rounded-xl bg-blue-50 p-4 text-sm text-blue-900">
          {space.is_live ? "This vendor has marked the lounge live. Audio/video joining is not available in this version." : "This is a public vendor space. Posts remain attached to products, dispatches, or storefronts."}
        </div>
        <Link href="/community" className="mt-5 inline-flex rounded-lg bg-blue-700 px-4 py-2 text-sm font-bold text-white hover:bg-blue-800">Browse community updates</Link>
      </section>
    </main>
  );
}
