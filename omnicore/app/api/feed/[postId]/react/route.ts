import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(_: Request, { params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to react." }, { status: 401 });

  const { error } = await supabase.from("social_reactions").upsert({
    post_id: postId,
    user_id: user.id,
  });
  if (error) return NextResponse.json({ error: "Could not save your reaction." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
