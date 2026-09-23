import { NextRequest, NextResponse } from "next/server";

type PaymentRequest = { email: string; amount: number; reference?: string; provider?: "paystack" | "flutterwave" };

export async function POST(request: NextRequest) {
  let body: PaymentRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (!body.email || !Number.isFinite(body.amount) || body.amount <= 0) {
    return NextResponse.json({ error: "A valid email and amount are required." }, { status: 400 });
  }

  const provider = body.provider ?? "paystack";
  const reference = body.reference ?? `KIVO-${crypto.randomUUID()}`;

  if (provider === "flutterwave") {
    const key = process.env.FLUTTERWAVE_SECRET_KEY;
    if (!key) return NextResponse.json({ error: "FLUTTERWAVE_SECRET_KEY is not configured." }, { status: 500 });
    const response = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ tx_ref: reference, amount: body.amount / 100, currency: "NGN", customer: { email: body.email }, redirect_url: process.env.NEXT_PUBLIC_SITE_URL }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return NextResponse.json({ error: "Flutterwave rejected the request.", detail: data }, { status: 502 });
    return NextResponse.json({ provider, reference, authorization_url: data?.data?.link });
  }

  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) return NextResponse.json({ error: "PAYSTACK_SECRET_KEY is not configured." }, { status: 500 });
  const response = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email: body.email, amount: Math.round(body.amount), reference, callback_url: process.env.NEXT_PUBLIC_SITE_URL }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.status) return NextResponse.json({ error: "Paystack rejected the request.", detail: data }, { status: 502 });
  return NextResponse.json({ provider, reference, authorization_url: data.data?.authorization_url, access_code: data.data?.access_code });
}
