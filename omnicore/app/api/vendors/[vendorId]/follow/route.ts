import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentVendor } from "@/lib/vendor";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ vendorId: string }> },
) {
  const { vendorId } = await params;
  const follower = await getCurrentVendor();
  if (!follower) return NextResponse.json({ error: "Sign in to follow vendors." }, { status: 401 });
  if (follower.id === vendorId) return NextResponse.json({ error: "You cannot follow your own store." }, { status: 400 });

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("vendor_follows")
    .select("follower_id")
    .eq("follower_id", follower.id)
    .eq("following_id", vendorId)
    .maybeSingle();

  const result = existing
    ? await supabase.from("vendor_follows").delete().match({ follower_id: follower.id, following_id: vendorId })
    : await supabase.from("vendor_follows").insert({ follower_id: follower.id, following_id: vendorId });
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });

  const { count } = await supabase
    .from("vendor_follows")
    .select("follower_id", { count: "exact", head: true })
    .eq("following_id", vendorId);
  return NextResponse.json({ following: !existing, followers: count ?? 0 });
}
