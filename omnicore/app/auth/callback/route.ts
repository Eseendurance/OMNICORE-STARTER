// app/auth/callback/route.ts
//
// Supabase sends users here after they click the "Confirm your email" link
// (or a magic link, or an OAuth redirect, if you add those later). Exchanges
// the one-time code for a real session, then sends them into the app.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeInternalPath } from "@/lib/safe-internal-path";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeInternalPath(searchParams.get("next"), "/dashboard/onboarding");

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=confirmation_failed", origin));
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
    console.error("Supabase confirmation callback failed:", error.message);
  } catch (error) {
    console.error("Could not complete Supabase confirmation callback:", error);
  }

  return NextResponse.redirect(new URL("/login?error=confirmation_failed", origin));
}
