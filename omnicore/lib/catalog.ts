// lib/catalog.ts
//
// Real data layer for the public-facing site (home, /explore, /store/[vendor],
// /reels). Replaces the old lib/data.ts mock arrays. Every function here
// hits the actual Postgres database via Supabase — if a vendor hasn't
// signed up and added products yet, these correctly return empty results
// rather than falling back to fake filler data.

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type VendorRow = Database["public"]["Tables"]["vendors"]["Row"];
export type ProductRow = Database["public"]["Tables"]["products"]["Row"];
export type ReelRow = Database["public"]["Tables"]["reels"]["Row"];
export type PostRow = Database["public"]["Tables"]["posts"]["Row"];
export type PostCommentRow = Database["public"]["Tables"]["post_comments"]["Row"];

export type VendorSummary = Pick<VendorRow, "slug" | "name" | "whatsapp" | "color">;

export type CatalogProduct = ProductRow & { vendor: VendorSummary };
export type CatalogReel = ReelRow & {
  vendor: VendorSummary;
  product: Pick<ProductRow, "id" | "title" | "price"> | null;
};
export type FeedPost = PostRow & {
  vendor: VendorSummary;
  comments: PostCommentRow[];
  reactions: Database["public"]["Tables"]["post_reactions"]["Row"][];
};

const VENDOR_SUMMARY_COLS = "slug, name, whatsapp, color";

export async function getVendors(): Promise<VendorRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("vendors").select("*").order("created_at", { ascending: false });
  return (data as VendorRow[]) ?? [];
}

export async function getVendorBySlug(slug: string): Promise<VendorRow | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("vendors").select("*").eq("slug", slug).maybeSingle();
  return (data as VendorRow | null) ?? null;
}

export async function getProductsForVendor(vendorId: string): Promise<ProductRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false });
  return (data as ProductRow[]) ?? [];
}

/** Products for the homepage's "Selling right now" strip, newest first. */
export async function getFeaturedProducts(limit = 4): Promise<CatalogProduct[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select(`*, vendor:vendors(${VENDOR_SUMMARY_COLS})`)
    .order("created_at", { ascending: false })
    .limit(limit);
  return ((data as unknown as CatalogProduct[]) ?? []).filter((p) => p.vendor);
}

/** Full-text-ish search across products + vendor name for /explore and /api/search. */
export async function searchCatalog(query: string): Promise<CatalogProduct[]> {
  const supabase = await createClient();
  const q = query.trim();

  let builder = supabase
    .from("products")
    .select(`*, vendor:vendors(${VENDOR_SUMMARY_COLS})`)
    .order("created_at", { ascending: false });

  if (q) {
    // Match on product title/category directly; vendor-name matches are
    // handled by fetching matching vendor ids first (postgrest can't do an
    // OR across a joined table's columns in one call).
    const supabaseVendors = await supabase.from("vendors").select("id").ilike("name", `%${q}%`);
    const vendorIds = (supabaseVendors.data ?? []).map((v: { id: string }) => v.id);

    const orParts = [`title.ilike.%${q}%`, `category.ilike.%${q}%`];
    if (vendorIds.length > 0) {
      orParts.push(`vendor_id.in.(${vendorIds.join(",")})`);
    }
    builder = builder.or(orParts.join(","));
  }

  const { data } = await builder;
  return ((data as unknown as CatalogProduct[]) ?? []).filter((p) => p.vendor);
}

export async function getReels(): Promise<CatalogReel[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reels")
    .select(`*, vendor:vendors(${VENDOR_SUMMARY_COLS}), product:products(id, title, price)`)
    .order("created_at", { ascending: false });
  return ((data as unknown as CatalogReel[]) ?? []).filter((r) => r.vendor);
}

export async function getPostById(id: string): Promise<FeedPost | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select(`*, vendor:vendors(${VENDOR_SUMMARY_COLS}), comments:post_comments(*), reactions:post_reactions(*)`)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Unable to load feed post: ${error.message}`);
  return (data as unknown as FeedPost | null) ?? null;
}
