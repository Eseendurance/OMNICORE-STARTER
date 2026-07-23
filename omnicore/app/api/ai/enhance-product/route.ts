// app/api/ai/enhance-product/route.ts
//
// Vendor dashboard photo tool: strips the background from a product photo so
// it can be composited onto a clean/studio backdrop client-side.
//
// Backend: remove.bg (https://www.remove.bg/api). Free tier is ~50 calls a
// month at preview resolution (0.25MP) — fine for testing, upgrade the plan
// for full-resolution HD output in production. Swap REMOVE_BG_API_KEY for a
// different provider (Photoroom, Poof.bg, Clipdrop) by changing the fetch
// call below; the request/response shape here stays the same.
//
// Request:  multipart/form-data with a single field "image" (the photo file)
// Response: { image: string } — a base64 data URL of the cutout PNG

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  const apiKey = process.env.REMOVE_BG_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "REMOVE_BG_API_KEY is not configured on the server." },
      { status: 500 }
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected multipart/form-data with an 'image' field." },
      { status: 400 }
    );
  }

  const file = formData.get("image");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing 'image' file in form data." }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "Image too large (max 10MB)." }, { status: 413 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "File must be an image." }, { status: 400 });
  }

  const upstreamForm = new FormData();
  upstreamForm.append("image_file", file, file.name);
  upstreamForm.append("size", "preview"); // change to "auto" once on a paid plan

  let upstreamRes: Response;
  try {
    upstreamRes = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: { "X-Api-Key": apiKey },
      body: upstreamForm,
    });
  } catch (err) {
    console.error("remove.bg request failed:", err);
    return NextResponse.json({ error: "Could not reach the enhancement service." }, { status: 502 });
  }

  if (!upstreamRes.ok) {
    const detail = await upstreamRes.text().catch(() => "");
    console.error("remove.bg error:", upstreamRes.status, detail);
    return NextResponse.json(
      { error: `Enhancement service returned ${upstreamRes.status}.` },
      { status: 502 }
    );
  }

  const buffer = Buffer.from(await upstreamRes.arrayBuffer());
  const base64 = buffer.toString("base64");

  return NextResponse.json({
    image: `data:image/png;base64,${base64}`,
  });
}
