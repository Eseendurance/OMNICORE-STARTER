import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const postKinds = ["product_drop", "shipped", "restock", "reel"] as const;

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const mode = request.nextUrl.searchParams.get("mode") === "chronological"
    ? "chronological"
    : "signal";
  const limit = Math.min(Math.max(Number(request.nextUrl.searchParams.get("limit") ?? 12), 1), 30);

  const query = supabase
    .from("social_posts")
    .select(`
      id, vendor_id, product_id, order_id, kind, body, media_url, route_label,
      depth_score, created_at,
      vendor:vendors(id, slug, name, location, is_verified),
      product:products(id, title, price, image_url)
    `)
    .order(mode === "signal" ? "depth_score" : "created_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  const { data, error } = await query;
  if (error) {
    console.error("Feed query failed:", error);
    return NextResponse.json({ error: "Could not load the community feed." }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [], mode });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to post." }, { status: 401 });

  const body = await request.json() as {
    body?: unknown;
    kind?: unknown;
    productId?: unknown;
  };
  const content = typeof body.body === "string" ? body.body.trim() : "";
  const kind = typeof body.kind === "string" ? body.kind : "product_drop";

  // Basic server-side spam checks
  const blocked = ["http://", "https://", "bit.ly", "contact me", "call me", "free money"];
  const lowered = content.toLowerCase();
  for (const b of blocked) {
    if (lowered.includes(b)) {
      return NextResponse.json({ error: "Message looks like spam or contains disallowed links." }, { status: 400 });
    }
  }

  if (!content || content.length > 1200 || !postKinds.includes(kind as typeof postKinds[number])) {
    return NextResponse.json({ error: "Add a short update and choose a valid post type." }, { status: 400 });
  }

  const { data: vendor } = await supabase.from("vendors").select("id").eq("id", user.id).maybeSingle();
  if (!vendor) return NextResponse.json({ error: "Complete your vendor profile before posting." }, { status: 403 });

  // Rate-limit: max 3 posts per minute per vendor to reduce spam
  const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
  const { count } = await supabase
    .from('social_posts')
    .select('*', { count: 'exact', head: true })
    .eq('vendor_id', vendor.id)
    .gte('created_at', oneMinuteAgo as any);

  if ((count ?? 0) >= 3) {
    return NextResponse.json({ error: 'You are posting too quickly. Slow down a bit.' }, { status: 429 });
  }

  const { data, error } = await supabase.from("social_posts").insert({
    vendor_id: vendor.id,
    product_id: typeof body.productId === "string" ? body.productId : null,
    kind,
    body: content,
  }).select("id, vendor_id, product_id, order_id, kind, body, media_url, route_label, depth_score, created_at").single();

  if (error) {
    console.error("Feed post failed:", error);
    return NextResponse.json({ error: "Could not publish that update." }, { status: 500 });
  }
  return NextResponse.json({ data }, { status: 201 });
}
