import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function isModerator(user: { app_metadata?: Record<string, unknown> }) {
  const role = user.app_metadata?.role;
  return role === "moderator" || role === "admin";
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isModerator(user)) {
    return NextResponse.json({ error: "Moderator access is required." }, { status: 403 });
  }
  const { data, error } = await supabase
    .from("social_reports")
    .select("id, post_id, comment_id, reason, details, status, moderator_note, created_at, post:social_posts(body), comment:social_comments(body)")
    .order("created_at", { ascending: true })
    .limit(100);
  if (error) {
    console.error("Moderation queue query failed:", error);
    return NextResponse.json({ error: "Could not load reports." }, { status: 500 });
  }
  return NextResponse.json({ data: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isModerator(user)) {
    return NextResponse.json({ error: "Moderator access is required." }, { status: 403 });
  }
  let payload: { id?: unknown; status?: unknown; moderatorNote?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Send a valid moderation action." }, { status: 400 });
  }
  const statuses = new Set(["reviewed", "actioned", "dismissed"]);
  const note = typeof payload.moderatorNote === "string" ? payload.moderatorNote.trim() : null;
  if (typeof payload.id !== "string" || !/^[0-9a-f-]{36}$/i.test(payload.id) ||
      typeof payload.status !== "string" || !statuses.has(payload.status) ||
      (note && note.length > 1000)) {
    return NextResponse.json({ error: "Choose a valid report action." }, { status: 400 });
  }
  const { data, error } = await supabase.rpc("moderate_social_report", {
    report_id_input: payload.id,
    status_input: payload.status,
    note_input: note,
  });
  if (error) {
    console.error("Moderation action failed:", error);
    return NextResponse.json({ error: "Could not update this report." }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "Report not found." }, { status: 404 });
  return NextResponse.json({ data: { id: payload.id, status: payload.status } });
}
