import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentVendor } from "@/lib/vendor";

const REACTIONS = ["LIKE", "FIRE", "LAUGH", "ROCKET", "IDEA"] as const;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
) {
  const { postId } = await params;
  const vendor = await getCurrentVendor();
  if (!vendor) return NextResponse.json({ error: "Sign in to react." }, { status: 401 });

  let body: { reaction?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (!body.reaction || !REACTIONS.includes(body.reaction as (typeof REACTIONS)[number])) {
    return NextResponse.json({ error: "Unsupported reaction." }, { status: 400 });
  }

  const supabase = await createClient();
  const reaction = body.reaction as (typeof REACTIONS)[number];
  const { data: existing } = await supabase
    .from("post_reactions")
    .select("post_id")
    .eq("post_id", postId)
    .eq("vendor_id", vendor.id)
    .eq("reaction", reaction)
    .maybeSingle();

  const result = existing
    ? await supabase.from("post_reactions").delete().match({ post_id: postId, vendor_id: vendor.id, reaction })
    : await supabase.from("post_reactions").insert({ post_id: postId, vendor_id: vendor.id, reaction });
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  return NextResponse.json({ reaction, active: !existing });
}
