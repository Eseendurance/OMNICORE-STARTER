import { NextRequest, NextResponse } from "next/server";
import { searchCatalog } from "@/lib/catalog";

// Searches the real products table (joined to vendors) in Postgres via
// Supabase. For higher-scale full-text search, swap the query inside
// lib/catalog.ts's searchCatalog() for a dedicated index (Meilisearch /
// Typesense) — see README.md > Search. The route contract stays the same.
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const results = await searchCatalog(q);
  return NextResponse.json({ query: q, count: results.length, results });
}
