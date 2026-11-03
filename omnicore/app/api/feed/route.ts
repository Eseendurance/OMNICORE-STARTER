import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const postKinds = ["product_drop", "restock"] as const;

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const mode = request.nextUrl.searchParams.get("mode") === "chronological"
    ? "chronological"
    : "signal";
  const requestedLimit = Number.parseInt(request.nextUrl.searchParams.get("limit") ?? "12", 10);
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 30) : 12;

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

  let payload: { body?: unknown; kind?: unknown; productId?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Send a valid JSON post." }, { status: 400 });
  }

  const content = typeof payload.body === "string" ? payload.body.trim() : "";
  const kind = typeof payload.kind === "string" ? payload.kind : "product_drop";
  if (!content || content.length > 1200 || !postKinds.includes(kind as typeof postKinds[number])) {
    return NextResponse.json({ error: "Add a short update and choose a valid post type." }, { status: 400 });
  }
  if (/(https?:\/\/|www\.|bit\.ly|free money)/i.test(content)) {
    return NextResponse.json({ error: "This update looks like spam or contains a link." }, { status: 400 });
  }
  if (typeof payload.productId !== "string" || !payload.productId) {
    return NextResponse.json({ error: "Choose a product to attach to this update." }, { status: 400 });
  }

  const { data: vendor, error: vendorError } = await supabase
    .from("vendors")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (vendorError) {
    console.error("Vendor lookup failed:", vendorError);
    return NextResponse.json({ error: "Could not verify your vendor account." }, { status: 500 });
  }
  if (!vendor) return NextResponse.json({ error: "Complete your vendor profile before posting." }, { status: 403 });

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id")
    .eq("id", payload.productId)
    .eq("vendor_id", vendor.id)
    .maybeSingle();
  if (productError) {
    console.error("Product lookup failed:", productError);
    return NextResponse.json({ error: "Could not verify the selected product." }, { status: 500 });
  }
  if (!product) return NextResponse.json({ error: "Choose a product from your own store." }, { status: 400 });

  const { data, error } = await supabase.from("social_posts").insert({
    vendor_id: vendor.id,
    product_id: product.id,
    kind,
    body: content,
  }).select(`
    id, vendor_id, product_id, order_id, kind, body, media_url, route_label, depth_score, created_at,
    vendor:vendors(id, slug, name, location, is_verified),
    product:products(id, title, price, image_url)
  `).single();

  if (error) {
    if (error.message.includes("Rate limit exceeded")) {
      return NextResponse.json(
        { error: "You are posting too quickly. Wait a minute, then try again." },
        { status: 429 }
      );
    }
    console.error("Feed post failed:", error);
    return NextResponse.json({ error: "Could not publish that update." }, { status: 500 });
  }
  return NextResponse.json({ data }, { status: 201 });
}
