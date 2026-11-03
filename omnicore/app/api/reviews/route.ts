import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  const orderId = request.nextUrl.searchParams.get("orderId");
  if (orderId) {
    if (!uuidPattern.test(orderId)) return NextResponse.json({ error: "Invalid order." }, { status: 400 });
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Sign in to check your review." }, { status: 401 });
    const { data, error } = await supabase.from("purchase_reviews").select("id")
      .eq("order_id", orderId).eq("buyer_id", user.id).maybeSingle();
    if (error) {
      console.error("Buyer review lookup failed:", error);
      return NextResponse.json({ error: "Could not check the review status." }, { status: 500 });
    }
    return NextResponse.json({ data: data ? [data] : [] }, { headers: { "Cache-Control": "no-store" } });
  }
  const vendorId = request.nextUrl.searchParams.get("vendorId");
  if (!vendorId || !uuidPattern.test(vendorId)) {
    return NextResponse.json({ error: "A valid store is required." }, { status: 400 });
  }
  const supabase = await createClient();
  const { data, error } = await supabase.from("purchase_reviews")
    .select("id, product_id, rating, body, created_at")
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) {
    console.error("Verified purchase reviews query failed:", error);
    return NextResponse.json({ error: "Could not load store reviews." }, { status: 500 });
  }
  return NextResponse.json({ data: data ?? [] }, { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to review an order." }, { status: 401 });
  if (!user.email_confirmed_at) return NextResponse.json({ error: "Confirm your account email before reviewing." }, { status: 403 });

  let payload: { orderId?: unknown; rating?: unknown; body?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Send a valid review." }, { status: 400 });
  }
  const body = typeof payload.body === "string" ? payload.body.trim() : "";
  if (typeof payload.orderId !== "string" || !uuidPattern.test(payload.orderId) ||
      !Number.isInteger(payload.rating) || Number(payload.rating) < 1 || Number(payload.rating) > 5 ||
      body.length < 5 || body.length > 1200) {
    return NextResponse.json({ error: "Add an order, a 1–5 star rating, and a short review." }, { status: 400 });
  }
  const { data: order, error: orderError } = await supabase.from("orders")
    .select("id, vendor_id, product_id, buyer_id, status")
    .eq("id", payload.orderId)
    .eq("buyer_id", user.id)
    .maybeSingle();
  if (orderError) {
    console.error("Review order verification failed:", orderError);
    return NextResponse.json({ error: "Could not verify this order." }, { status: 500 });
  }
  if (!order || order.status !== "delivered") {
    return NextResponse.json({ error: "Reviews open after your order is marked delivered." }, { status: 403 });
  }
  const { data, error } = await supabase.from("purchase_reviews").insert({
    order_id: order.id,
    buyer_id: user.id,
    vendor_id: order.vendor_id,
    product_id: order.product_id,
    rating: Number(payload.rating),
    body,
  }).select("id, rating, body, created_at").single();
  if (error?.code === "23505") return NextResponse.json({ error: "This order already has a review." }, { status: 409 });
  if (error) {
    console.error("Verified purchase review insert failed:", error);
    return NextResponse.json({ error: "Could not publish this review." }, { status: 500 });
  }
  return NextResponse.json({ data }, { status: 201 });
}
