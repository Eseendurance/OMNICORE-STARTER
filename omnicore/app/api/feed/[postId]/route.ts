import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params;
  const supabase = await createClient();
  const { data: post, error: postError } = await supabase
    .from("social_posts")
    .select("id, vendor_id, product_id, order_id, kind, body, media_url, route_label, depth_score, created_at, vendor:vendors(id, name, slug, location, is_verified), product:products(id, title, price, image_url)")
    .eq("id", postId)
    .maybeSingle();
  if (postError) {
    console.error("Fetch post failed:", postError);
    return NextResponse.json({ error: "Could not load post." }, { status: 500 });
  }
  if (!post) return NextResponse.json({ error: "Post not found." }, { status: 404 });

  const { data: comments, error } = await supabase
    .from("social_comments")
    .select("id, author_id, body, created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: true })
    .limit(100);
  if (error) {
    console.error("Fetch comments failed:", error);
    return NextResponse.json({ error: "Could not load comments." }, { status: 500 });
  }
  return NextResponse.json({ post, comments: comments ?? [] });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to comment." }, { status: 401 });

  let payload: { body?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Send a valid JSON comment." }, { status: 400 });
  }
  const body = typeof payload.body === "string" ? payload.body.trim() : "";
  if (!body || body.length > 600) return NextResponse.json({ error: "Write a comment up to 600 characters." }, { status: 400 });
  if (/(https?:\/\/|www\.|bit\.ly|free money)/i.test(body)) {
    return NextResponse.json({ error: "This comment looks like spam or contains a link." }, { status: 400 });
  }

  const { data: post, error: postError } = await supabase
    .from("social_posts")
    .select("id")
    .eq("id", postId)
    .maybeSingle();
  if (postError) {
    console.error("Comment post lookup failed:", postError);
    return NextResponse.json({ error: "Could not verify that post." }, { status: 500 });
  }
  if (!post) return NextResponse.json({ error: "Post not found." }, { status: 404 });

  const { data: limitRows, error: limitError } = await supabase.rpc("consume_social_rate_limit", {
    action_name: "comment",
    maximum_requests: 5,
    window_seconds: 60,
  });
  if (limitError) {
    console.error("Comment rate limit failed:", limitError);
    return NextResponse.json({ error: "Commenting is temporarily unavailable." }, { status: 503 });
  }
  if (!limitRows?.[0]?.allowed) {
    return NextResponse.json(
      { error: "You are commenting too quickly. Slow down.", retryAfter: limitRows?.[0]?.retry_after_seconds ?? 60 },
      { status: 429 }
    );
  }

  const { data, error } = await supabase
    .from("social_comments")
    .insert({ post_id: postId, author_id: user.id, body })
    .select("id, post_id, author_id, body, created_at")
    .single();
  if (error) {
    console.error("Insert comment failed:", error);
    return NextResponse.json({ error: "Could not save comment." }, { status: 500 });
  }
  return NextResponse.json({ data }, { status: 201 });
}
