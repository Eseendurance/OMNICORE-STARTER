import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentVendor } from "@/lib/vendor";
import SpaceForm from "./SpaceForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Vendor spaces — Kivo" };

export default async function VendorSpacesPage() {
  const vendor = await getCurrentVendor();
  if (!vendor) return null;
  const supabase = await createClient();
  const { data: spaces, error } = await supabase.from("vendor_spaces")
    .select("id, name, category, privacy, is_live, created_at")
    .eq("owner_id", vendor.id)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Vendor spaces query failed:", error);
    throw new Error("Could not load your spaces.");
  }
  return (
    <main>
      <p className="font-mono text-xs font-bold uppercase tracking-widest text-blue-700">Trade circles</p>
      <h1 className="mt-2 font-display text-3xl font-bold text-blue-950">Your vendor spaces</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-800">Public spaces are open to everyone. Membership-required spaces are visible to active 30- or 90-day supporters.</p>
      <SpaceForm />
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {spaces?.map((space) => (
          <article key={space.id} className="rounded-2xl border border-blue-100 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div><h2 className="font-semibold text-blue-950">{space.name}</h2><p className="mt-1 text-sm text-blue-700">{space.category}</p></div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{space.privacy === "public" ? "Public" : "Members"}</span>
            </div>
            <Link href={`/community/spaces/${space.id}`} className="mt-4 inline-flex rounded-lg bg-blue-700 px-3 py-2 text-sm font-bold text-white">Open space</Link>
          </article>
        ))}
        {!spaces?.length && <p className="rounded-xl border border-dashed border-blue-200 p-5 text-sm text-blue-700">No spaces yet. Create one for your category or region.</p>}
      </div>
    </main>
  );
}
