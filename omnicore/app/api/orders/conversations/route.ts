import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to view order messages." }, { status: 401 });
  const { error: claimError } = await supabase.rpc("claim_verified_email_orders");
  if (claimError && !claimError.message.includes("Confirm your account email")) {
    console.error("Order claim lookup failed:", claimError);
    return NextResponse.json({ error: "Could not load your order conversations." }, { status: 500 });
  }
  const { data, error } = await supabase
    .from("order_conversations")
    .select("id, order_id, vendor_id, buyer_id, created_at, order:orders(order_ref, customer_name, status), vendor:vendors(name, slug)")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) {
    console.error("Order conversations query failed:", error);
    return NextResponse.json({ error: "Could not load your order conversations." }, { status: 500 });
  }
  return NextResponse.json({ data: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
}
