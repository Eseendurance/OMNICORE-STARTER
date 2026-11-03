import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId)) {
    return NextResponse.json({ error: "Invalid order." }, { status: 400 });
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to confirm delivery." }, { status: 401 });
  const { data, error } = await supabase.rpc("confirm_my_order_delivered", { order_id_input: orderId });
  if (error) {
    console.error("Buyer delivery confirmation failed:", error);
    return NextResponse.json({ error: "Could not confirm delivery." }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "Only the buyer can confirm a shipped order." }, { status: 403 });
  return NextResponse.json({ delivered: true });
}
