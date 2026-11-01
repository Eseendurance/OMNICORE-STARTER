import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const reactionTypes = ["USEFUL", "LIKE"] as const;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to react." }, { status: 401 });

  let type: typeof reactionTypes[number] = "USEFUL";
  if (request.headers.get("content-type")?.includes("application/json")) {
    let payload: { type?: unknown };
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ error: "Send a valid reaction." }, { status: 400 });
    }
    if (payload.type !== undefined) {
      if (typeof payload.type !== "string" || !reactionTypes.includes(payload.type.toUpperCase() as typeof type)) {
        return NextResponse.json({ error: "Choose a valid reaction." }, { status: 400 });
      }
      type = payload.type.toUpperCase() as typeof type;
    }
  }

  const { data: post, error: postError } = await supabase
    .from("social_posts")
    .select("id")
    .eq("id", postId)
    .maybeSingle();
  if (postError) {
    console.error("Reaction post lookup failed:", postError);
    return NextResponse.json({ error: "Could not verify that post." }, { status: 500 });
  }
  if (!post) return NextResponse.json({ error: "Post not found." }, { status: 404 });

  const { data: current, error: currentError } = await supabase
    .from("social_reactions")
    .select("type")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (currentError) {
    console.error("Reaction lookup failed:", currentError);
    return NextResponse.json({ error: "Could not load your reaction." }, { status: 500 });
  }

  if (current?.type === type) {
    const { error } = await supabase
      .from("social_reactions")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", user.id);
    if (error) {
      console.error("Reaction removal failed:", error);
      return NextResponse.json({ error: "Could not remove your reaction." }, { status: 500 });
    }
    return NextResponse.json({ ok: true, action: "removed" });
  }

  const { error } = await supabase.from("social_reactions").upsert(
    { post_id: postId, user_id: user.id, type },
    { onConflict: "post_id,user_id" }
  );
  if (error) {
    console.error("Reaction save failed:", error);
    return NextResponse.json({ error: "Could not save your reaction." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, action: "added", type });
}
