import { NextRequest, NextResponse } from "next/server";
import { getPostById } from "@/lib/catalog";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
) {
  const { postId } = await params;
  if (!postId) return NextResponse.json({ error: "postId is required." }, { status: 400 });
  try {
    const post = await getPostById(postId);
    if (!post) return NextResponse.json({ error: "Feed post not found." }, { status: 404 });
    return NextResponse.json({ post, comments: post.comments, reactions: post.reactions });
  } catch (error) {
    console.error("Feed post request failed:", error);
    return NextResponse.json({ error: "Unable to load feed post." }, { status: 500 });
  }
}
