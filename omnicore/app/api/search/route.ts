import { NextRequest, NextResponse } from "next/server";
import { searchCatalog } from "@/lib/data";

// This route currently searches the in-memory mock catalog in lib/data.ts.
// To go to production, swap the body of this handler for a call to a real
// search index (Typesense / Meilisearch / Algolia). See README.md > Search.
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const results = searchCatalog(q);
  return NextResponse.json({ query: q, count: results.length, results });
}
