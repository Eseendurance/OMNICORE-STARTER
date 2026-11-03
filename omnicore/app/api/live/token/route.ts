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
import { createClient } from "@/lib/supabase/server";

const TOKEN_TTL_SECONDS = 60 * 60; // 1 hour
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function unauthorized() {
  return NextResponse.json({ error: "You are not allowed to join this live channel." }, { status: 403 });
}

export async function POST(req: NextRequest) {
  let body: { channelName?: unknown; spaceId?: unknown; role?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { channelName, role } = body;
  if (role !== "host" && role !== "audience") {
    return NextResponse.json({ error: "role must be 'host' or 'audience'." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let authorizedChannel: string | null = null;

  if (typeof body.spaceId === "string") {
    if (!UUID_PATTERN.test(body.spaceId)) {
      return NextResponse.json({ error: "A valid spaceId is required." }, { status: 400 });
    }

    const { data: space, error } = await supabase
      .from("vendor_spaces")
      .select("id, owner_id, privacy, is_live")
      .eq("id", body.spaceId)
      .maybeSingle();

    if (error) {
      console.error("Could not verify live space:", error);
      return NextResponse.json({ error: "Could not verify this space." }, { status: 500 });
    }
    if (!space) return NextResponse.json({ error: "Space not found." }, { status: 404 });

    const isOwner = user?.id === space.owner_id;
    if (role === "host" && !isOwner) return unauthorized();
    if (role === "audience" && (!space.is_live || (space.privacy !== "public" && !isOwner))) {
      return unauthorized();
    }
    authorizedChannel = `space-${space.id}`;
  } else {
    if (typeof channelName !== "string" || !/^live-[0-9a-f-]{36}$/i.test(channelName)) {
      return NextResponse.json({ error: "A valid live channel is required." }, { status: 400 });
    }

    const vendorId = channelName.slice("live-".length);
    if (!UUID_PATTERN.test(vendorId)) {
      return NextResponse.json({ error: "A valid live channel is required." }, { status: 400 });
    }

    if (role === "host") {
      if (!user || user.id !== vendorId) return unauthorized();
      const { data: vendor, error } = await supabase
        .from("vendors")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();
      if (error) {
        console.error("Could not verify live host:", error);
        return NextResponse.json({ error: "Could not verify the live host." }, { status: 500 });
      }
      if (!vendor) return unauthorized();
    } else {
      const { data: reel, error } = await supabase
        .from("reels")
        .select("id")
        .eq("vendor_id", vendorId)
        .eq("is_live", true)
        .limit(1)
        .maybeSingle();
      if (error) {
        console.error("Could not verify live broadcast:", error);
        return NextResponse.json({ error: "Could not verify this broadcast." }, { status: 500 });
      }
      if (!reel) return NextResponse.json({ error: "This broadcast is not live." }, { status: 404 });
    }
    authorizedChannel = channelName;
  }

  if (!authorizedChannel) return unauthorized();

  const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;
  if (!appId || !appCertificate) {
    return NextResponse.json(
      { error: "Live streaming is not configured. Add the Agora app ID and server-side certificate." },
      { status: 500 }
    );
  }

  const uid = Math.floor(Math.random() * 1_000_000_000);
  const agoraRole = role === "host" ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

  const token = RtcTokenBuilder.buildTokenWithUid(
    appId,
    appCertificate,
    authorizedChannel,
    uid,
    agoraRole,
    TOKEN_TTL_SECONDS,
    TOKEN_TTL_SECONDS
  );

  return NextResponse.json(
    { appId, channelName: authorizedChannel, uid, token },
    { headers: { "Cache-Control": "no-store" } }
  );
}
