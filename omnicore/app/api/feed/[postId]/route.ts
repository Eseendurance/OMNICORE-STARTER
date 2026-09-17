import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest, { params }: { params: { postId: string } }) {
  const { postId } = params;
  const supabase = await createClient();

  const { data: post, error: postErr } = await supabase
    .from("social_posts")
    .select(`*, vendor:vendors(id, name, slug, location, is_verified), product:products(id, title, price, image_url)`)
    .eq("id", postId)
    .maybeSingle();

  if (postErr) {
    console.error("Fetch post failed:", postErr);
    return NextResponse.json({ error: "Could not load post." }, { status: 500 });
  }

  const { data: comments, error: commentsErr } = await supabase
    .from("social_comments")
    .select(`id, author_id, body, created_at`)
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (commentsErr) {
    console.error("Fetch comments failed:", commentsErr);
    return NextResponse.json({ error: "Could not load comments." }, { status: 500 });
  }

  return NextResponse.json({ post, comments });
}

export async function POST(request: NextRequest, { params }: { params: { postId: string } }) {
  const { postId } = params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to comment." }, { status: 401 });

  const payload = await request.json();
  const body = typeof payload.body === "string" ? payload.body.trim() : "";
  if (!body || body.length > 600) return NextResponse.json({ error: "Invalid comment." }, { status: 400 });

  // Basic spam check for links and known patterns
  const banned = ["http://", "https://", "bit.ly", "free money", "send me"].map(s => s.toLowerCase());
  const lowered = body.toLowerCase();
  for (const b of banned) if (lowered.includes(b)) return NextResponse.json({ error: "Comment looks like spam." }, { status: 400 });

  // Simple rate-limit: max 5 comments per minute per user
  const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
  const { count } = await supabase
    .from('social_comments')
    .select('*', { count: 'exact', head: true })
    .eq('author_id', user.id)
    .gte('created_at', oneMinuteAgo as any);
  if ((count ?? 0) >= 5) return NextResponse.json({ error: 'You are commenting too quickly. Slow down.' }, { status: 429 });

  const { data, error } = await supabase.from("social_comments").insert({ post_id: postId, author_id: user.id, body }).select("id, post_id, author_id, body, created_at").single();
  if (error) {
    console.error("Insert comment failed:", error);
    return NextResponse.json({ error: "Could not save comment." }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
