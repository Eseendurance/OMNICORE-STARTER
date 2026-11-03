import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email) return NextResponse.json({ error: "Sign in with an email to support this vendor." }, { status: 401 });
  if (!user.email_confirmed_at) return NextResponse.json({ error: "Confirm your account email before paying." }, { status: 403 });

  let payload: { vendorId?: unknown; purpose?: unknown; amount?: unknown; membershipDays?: unknown; note?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Send valid payment details." }, { status: 400 });
  }
  const amount = Number(payload.amount);
  const purpose = payload.purpose;
  const membershipDays = payload.membershipDays;
  const note = typeof payload.note === "string" ? payload.note.trim() : null;
  if (typeof payload.vendorId !== "string" || !/^[0-9a-f-]{36}$/i.test(payload.vendorId) ||
      (purpose !== "tip" && purpose !== "membership") ||
      !Number.isSafeInteger(amount) || amount < 100 || amount > 1000000 ||
      (purpose === "membership" && membershipDays !== 30 && membershipDays !== 90) ||
      (purpose === "tip" && membershipDays !== undefined) ||
      (note && note.length > 240)) {
    return NextResponse.json({ error: "Check the amount and support option, then try again." }, { status: 400 });
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!secretKey || !siteUrl) {
    console.error("Paystack support is not configured.");
    return NextResponse.json({ error: "Payments are not configured yet. Contact the store owner." }, { status: 503 });
  }

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch (error) {
    console.error("Payment data access is not configured:", error);
    return NextResponse.json({ error: "Payments are not ready yet. Contact the store owner." }, { status: 503 });
  }
  const { data: withinLimit, error: limitError } = await admin.rpc("consume_support_start_limit", {
    user_id_input: user.id,
  });
  if (limitError) {
    console.error("Support checkout rate limit failed:", limitError);
    return NextResponse.json({ error: "Payments are temporarily unavailable." }, { status: 503 });
  }
  if (!withinLimit) return NextResponse.json({ error: "Too many payment attempts. Try again in an hour." }, { status: 429 });
  const { data: vendor, error: vendorError } = await admin.from("vendors")
    .select("id, name").eq("id", payload.vendorId).maybeSingle();
  if (vendorError) {
    console.error("Support vendor lookup failed:", vendorError);
    return NextResponse.json({ error: "Could not verify this store." }, { status: 500 });
  }
  if (!vendor) return NextResponse.json({ error: "Store not found." }, { status: 404 });

  const reference = `KIVO-${randomUUID()}`;
  const { data: payment, error: insertError } = await admin.from("support_payments").insert({
    reference,
    supporter_id: user.id,
    vendor_id: vendor.id,
    purpose,
    amount,
    note,
    membership_days: purpose === "membership" ? membershipDays : null,
  }).select("id").single();
  if (insertError) {
    console.error("Support payment record creation failed:", insertError);
    return NextResponse.json({ error: "Could not start this payment." }, { status: 500 });
  }

  let providerResponse: Response;
  try {
    providerResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email: user.email,
        amount: amount * 100,
        currency: "NGN",
        reference,
        callback_url: `${siteUrl.replace(/\/$/, "")}/payments/complete`,
        metadata: {
          payment_id: payment.id,
          vendor_id: vendor.id,
          purpose,
        },
      }),
      cache: "no-store",
    });
  } catch (error) {
    console.error("Paystack initialization request failed:", error);
    const { error: updateError } = await admin.from("support_payments").update({ status: "failed" }).eq("id", payment.id);
    if (updateError) console.error("Could not mark uninitialized support payment as failed:", updateError);
    return NextResponse.json({ error: "Paystack could not be reached. Please try again." }, { status: 502 });
  }
  let providerResult: {
    status?: boolean;
    message?: string;
    data?: { authorization_url?: string; reference?: string };
  };
  try {
    providerResult = await providerResponse.json();
  } catch (error) {
    console.error("Paystack returned an unreadable initialization response:", error);
    const { error: updateError } = await admin.from("support_payments").update({ status: "failed" }).eq("id", payment.id);
    if (updateError) console.error("Could not mark invalid provider response as failed:", updateError);
    return NextResponse.json({ error: "Paystack returned an invalid response. Try again shortly." }, { status: 502 });
  }
  if (!providerResponse.ok || !providerResult.status || !providerResult.data?.authorization_url) {
    console.error("Paystack declined initialization:", providerResult.message ?? providerResponse.status);
    const { error: updateError } = await admin.from("support_payments").update({ status: "failed" }).eq("id", payment.id);
    if (updateError) console.error("Could not mark declined support payment as failed:", updateError);
    return NextResponse.json({ error: "Paystack could not start this payment. Try again shortly." }, { status: 502 });
  }
  return NextResponse.json(
    { authorizationUrl: providerResult.data.authorization_url },
    { headers: { "Cache-Control": "no-store" } }
  );
}
