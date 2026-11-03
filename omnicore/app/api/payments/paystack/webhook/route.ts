import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    console.error("Paystack webhook received without payment configuration.");
    return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });
  }
  const rawBody = await request.text();
  const receivedSignature = request.headers.get("x-paystack-signature") ?? "";
  const expectedSignature = createHmac("sha512", secretKey).update(rawBody).digest("hex");
  const received = Buffer.from(receivedSignature, "hex");
  const expected = Buffer.from(expectedSignature, "hex");
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  let event: {
    event?: unknown;
    data?: { reference?: unknown; amount?: unknown; currency?: unknown };
  };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid webhook body." }, { status: 400 });
  }
  if (event.event !== "charge.success" && event.event !== "charge.failed") {
    return NextResponse.json({ received: true });
  }
  const reference = event.data?.reference;
  if (typeof reference !== "string" || !/^[A-Za-z0-9-]{8,100}$/.test(reference)) {
    return NextResponse.json({ error: "Invalid payment reference." }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const { data: payment, error } = await admin.from("support_payments")
      .select("id, amount, status").eq("reference", reference).maybeSingle();
    if (error) throw error;
    if (!payment) return NextResponse.json({ error: "Payment reference not found." }, { status: 404 });
    if (payment.status === "paid") return NextResponse.json({ received: true });

    const verifyResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${secretKey}` }, cache: "no-store" }
    );
    const verification = await verifyResponse.json() as {
      status?: boolean;
      data?: { status?: string; reference?: string; amount?: number; currency?: string; id?: number };
    };
    const verified = verification.data;
    if (!verifyResponse.ok || !verification.status || !verified ||
        verified.reference !== reference || verified.amount !== payment.amount * 100 ||
        verified.currency !== "NGN" || event.data?.amount !== verified.amount ||
        event.data.currency !== verified.currency) {
      console.error("Paystack payment verification mismatch:", reference);
      return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });
    }

    if (event.event === "charge.failed") {
      if (verified.status !== "failed") {
        return NextResponse.json({ error: "Paystack failure status did not verify." }, { status: 400 });
      }
      const { error: updateError } = await admin.from("support_payments")
        .update({ status: "failed", provider_reference: String(verified.id ?? reference) })
        .eq("id", payment.id).eq("status", "pending");
      if (updateError) throw updateError;
      return NextResponse.json({ received: true });
    }

    if (verified.status !== "success") {
      return NextResponse.json({ error: "Paystack success status did not verify." }, { status: 400 });
    }
    const { error: finalizeError } = await admin.rpc("finalize_support_payment", {
      reference_input: reference,
      provider_reference_input: String(verified.id ?? reference),
    });
    if (finalizeError) throw finalizeError;
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Paystack webhook processing failed:", error);
    return NextResponse.json({ error: "Could not process payment event." }, { status: 500 });
  }
}
