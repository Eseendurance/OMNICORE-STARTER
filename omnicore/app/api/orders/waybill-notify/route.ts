// app/api/orders/waybill-notify/route.ts
//
// Called when a vendor marks an order "Shipped via Park" and enters the
// motor-park waybill details. Sends the buyer an SMS with the tracking
// info, mirroring the "Buyer Notification" step in the logistics blueprint.
//
// Backend: Termii (https://termii.com) — Nigeria-focused SMS, free trial
// credit on signup. Swap the fetch call below for any other SMS provider
// (Africa's Talking, Twilio) without changing the request/response shape.
//
// Request body (JSON):
// {
//   "customerPhone": "+2348012345678",
//   "customerName": "Ada",
//   "transportCompany": "Example Motor Park Transport Co",
//   "departureTerminal": "Jibowu Motor Park, Lagos",
//   "driverName": "Musa",
//   "driverPhone": "+2348099999999",
//   "waybillCode": "PMT-2291-LG",
//   "orderId": "ORD-8823"
// }

import { NextRequest, NextResponse } from "next/server";

type WaybillPayload = {
  customerPhone: string;
  customerName: string;
  transportCompany: string;
  departureTerminal: string;
  driverName: string;
  driverPhone: string;
  waybillCode: string;
  orderId: string;
};

const REQUIRED_FIELDS: (keyof WaybillPayload)[] = [
  "customerPhone",
  "customerName",
  "transportCompany",
  "departureTerminal",
  "driverName",
  "driverPhone",
  "waybillCode",
  "orderId",
];

function buildMessage(p: WaybillPayload) {
  return (
    `Hi ${p.customerName}, your order ${p.orderId} is on the way via ${p.transportCompany} ` +
    `from ${p.departureTerminal}. Driver: ${p.driverName} (${p.driverPhone}). ` +
    `Waybill/parcel code: ${p.waybillCode}. Please present ID at pickup. — OmniCore`
  );
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.TERMII_API_KEY;
  const senderId = process.env.TERMII_SENDER_ID || "OmniCore";
  if (!apiKey) {
    return NextResponse.json(
      { error: "TERMII_API_KEY is not configured on the server." },
      { status: 500 }
    );
  }

  let body: Partial<WaybillPayload>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const missing = REQUIRED_FIELDS.filter((f) => !body[f] || typeof body[f] !== "string");
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Missing required field(s): ${missing.join(", ")}` },
      { status: 400 }
    );
  }

  const payload = body as WaybillPayload;
  const phoneDigits = payload.customerPhone.replace(/[^\d]/g, "");
  if (phoneDigits.length < 10) {
    return NextResponse.json({ error: "customerPhone looks invalid." }, { status: 400 });
  }

  const message = buildMessage(payload);

  let upstreamRes: Response;
  try {
    upstreamRes = await fetch("https://api.ng.termii.com/api/sms/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        to: phoneDigits,
        from: senderId,
        sms: message,
        type: "plain",
        channel: "generic",
      }),
    });
  } catch (err) {
    console.error("Termii request failed:", err);
    return NextResponse.json({ error: "Could not reach the SMS service." }, { status: 502 });
  }

  const data = await upstreamRes.json().catch(() => ({}));

  if (!upstreamRes.ok) {
    console.error("Termii error:", upstreamRes.status, data);
    return NextResponse.json(
      { error: "SMS provider rejected the request.", detail: data },
      { status: 502 }
    );
  }

  return NextResponse.json({
    status: "sent",
    orderId: payload.orderId,
    provider: "termii",
    providerResponse: data,
  });
}
