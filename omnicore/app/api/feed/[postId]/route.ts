import { NextRequest, NextResponse } from "next/server";

/**
 * The legacy feed-post endpoint is retired. Keep this route explicit so
 * deployments that still reference the path satisfy the Next.js 16 route
 * contract while returning a clear response to old clients.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
) {
  const { postId } = await params;

  return NextResponse.json(
    {
      error: "Feed posts are no longer supported.",
      postId,
    },
    { status: 410 },
  );
}
