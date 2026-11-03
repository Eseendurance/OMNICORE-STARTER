import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const reasons = new Set(["spam", "scam", "harassment", "unsafe", "other"]);
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to report this." }, { status: 401 });

  let payload: { postId?: unknown; commentId?: unknown; reason?: unknown; details?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Send a valid report." }, { status: 400 });
  }
  const postId = typeof payload.postId === "string" ? payload.postId : null;
  const commentId = typeof payload.commentId === "string" ? payload.commentId : null;
  const reason = typeof payload.reason === "string" ? payload.reason : "";
  const details = typeof payload.details === "string" ? payload.details.trim() : null;
  if ((postId === null) === (commentId === null) ||
      (postId && !uuidPattern.test(postId)) || (commentId && !uuidPattern.test(commentId)) ||
      !reasons.has(reason) || (details && details.length > 1000)) {
    return NextResponse.json({ error: "Choose one valid post or comment and a report reason." }, { status: 400 });
  }

  const { data, error } = await supabase.from("social_reports").insert({
    reporter_id: user.id,
    post_id: postId,
    comment_id: commentId,
    reason,
    details,
  }).select("id").single();
  if (error?.code === "23505") {
    return NextResponse.json({ error: "You have already reported this item." }, { status: 409 });
  }
  if (error?.message.includes("Rate limit exceeded")) {
    return NextResponse.json({ error: "Too many reports. Try again later." }, { status: 429 });
  }
  if (error) {
    console.error("Create moderation report failed:", error);
    return NextResponse.json({ error: "Could not submit this report." }, { status: 500 });
  }
  return NextResponse.json({ id: data.id }, { status: 201 });
}
