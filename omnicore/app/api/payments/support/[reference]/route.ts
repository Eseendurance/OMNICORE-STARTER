import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  const { reference } = await params;
  if (!/^[A-Za-z0-9-]{8,100}$/.test(reference)) {
    return NextResponse.json({ error: "Invalid payment reference." }, { status: 400 });
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to check your payment." }, { status: 401 });
  const { data, error } = await supabase.from("support_payments")
    .select("purpose, status, amount").eq("reference", reference).maybeSingle();
  if (error) {
    console.error("Support payment status query failed:", error);
    return NextResponse.json({ error: "Could not check the payment status." }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "Payment not found." }, { status: 404 });
  return NextResponse.json({ data }, { headers: { "Cache-Control": "no-store" } });
}
