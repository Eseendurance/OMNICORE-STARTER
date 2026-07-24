// app/api/live/token/route.ts
//
// Generates a short-lived Agora RTC token so the browser can join a video
// channel — either as the vendor broadcasting ("host") or a buyer watching
// ("audience"). Requires a free Agora project: https://console.agora.io
// (RTC Free package: 10,000 minutes/month, auto-enabled on new projects).
//
// Request body: { channelName: string, role: "host" | "audience" }
// Response: { appId, channelName, uid, token }

import { NextRequest, NextResponse } from "next/server";
import { RtcTokenBuilder, RtcRole } from "agora-token";

const TOKEN_TTL_SECONDS = 60 * 60; // 1 hour

export async function POST(req: NextRequest) {
  const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;

  if (!appId || !appCertificate) {
    return NextResponse.json(
      {
        error:
          "Live streaming isn't configured yet. Add NEXT_PUBLIC_AGORA_APP_ID and AGORA_APP_CERTIFICATE (free at console.agora.io) to enable Go Live.",
      },
      { status: 500 }
    );
  }

  let body: { channelName?: string; role?: "host" | "audience" };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { channelName, role } = body;
  if (!channelName || typeof channelName !== "string") {
    return NextResponse.json({ error: "channelName is required." }, { status: 400 });
  }
  if (role !== "host" && role !== "audience") {
    return NextResponse.json({ error: "role must be 'host' or 'audience'." }, { status: 400 });
  }

  // Random uid per session — the client tells us who it is via app-level
  // data (vendor slug / caption), not the Agora uid.
  const uid = Math.floor(Math.random() * 1_000_000_000);
  const agoraRole = role === "host" ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

  const token = RtcTokenBuilder.buildTokenWithUid(
    appId,
    appCertificate,
    channelName,
    uid,
    agoraRole,
    TOKEN_TTL_SECONDS,
    TOKEN_TTL_SECONDS
  );

  return NextResponse.json({ appId, channelName, uid, token });
}
