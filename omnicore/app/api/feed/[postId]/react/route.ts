import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in to react." }, { status: 401 });
  }

  let reactionType = "LIKE";
  try {
    const payload = await request.json();
    if (payload?.type && typeof payload.type === "string") {
      reactionType = payload.type.toUpperCase();
    }
  } catch {
    // If no JSON payload provided, fallback to default "LIKE"
  }

  // Check if reaction already exists to handle toggle logic
  const { data: existingReaction } = await supabase
    .from("social_reactions")
    .select("id, type")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingReaction && existingReaction.type === reactionType) {
    // Toggle off: user tapped the same reaction again
    const { error: deleteError } = await supabase
      .from("social_reactions")
      .delete()
      .eq("id", existingReaction.id);

    if (deleteError) {
      console.error("Delete reaction error:", deleteError);
      return NextResponse.json(
        { error: "Could not remove reaction." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, action: "removed" });
  }

  // Upsert/Update reaction
  const { error } = await supabase.from("social_reactions").upsert(
    {
      post_id: postId,
      user_id: user.id,
      type: reactionType,
    },
    { onConflict: "post_id,user_id" }
  );

  if (error) {
    console.error("Upsert reaction error:", error);
    return NextResponse.json(
      { error: "Could not save your reaction." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, action: "added", type: reactionType });
}