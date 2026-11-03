import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to link your orders." }, { status: 401 });
  const { data, error } = await supabase.rpc("claim_verified_email_orders");
  if (error) {
    if (error.message.includes("Confirm your account email")) {
      return NextResponse.json({ error: "Confirm your sign-in email first, then link orders again." }, { status: 403 });
    }
    console.error("Order claim failed:", error);
    return NextResponse.json({ error: "Could not link orders to this account." }, { status: 500 });
  }
  return NextResponse.json({ claimed: data ?? 0 });
}
