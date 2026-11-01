import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ vendorId: string }> }
) {
  const { vendorId } = await params;
  const supabase = await createClient();
  const [{ count, error: countError }, { data: { user } }] = await Promise.all([
    supabase.from("vendor_follows").select("follower_id", { count: "exact", head: true }).eq("vendor_id", vendorId),
    supabase.auth.getUser(),
  ]);
  if (countError) {
    console.error("Vendor follower count failed:", countError);
    return NextResponse.json({ error: "Could not load follower details." }, { status: 500 });
  }

  let following = false;
  if (user) {
    const { data, error } = await supabase.from("vendor_follows")
      .select("follower_id").eq("vendor_id", vendorId).eq("follower_id", user.id).maybeSingle();
    if (error) {
      console.error("Vendor follow status failed:", error);
      return NextResponse.json({ error: "Could not load follow status." }, { status: 500 });
    }
    following = Boolean(data);
  }
  return NextResponse.json({ followers: count ?? 0, following });
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ vendorId: string }> }
) {
  const { vendorId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to follow this vendor." }, { status: 401 });
  if (user.id === vendorId) return NextResponse.json({ error: "You cannot follow your own store." }, { status: 400 });

  const { data: vendor, error: vendorError } = await supabase.from("vendors").select("id").eq("id", vendorId).maybeSingle();
  if (vendorError) {
    console.error("Follow vendor lookup failed:", vendorError);
    return NextResponse.json({ error: "Could not verify this store." }, { status: 500 });
  }
  if (!vendor) return NextResponse.json({ error: "Store not found." }, { status: 404 });

  const { error } = await supabase.from("vendor_follows").upsert(
    { follower_id: user.id, vendor_id: vendorId },
    { onConflict: "follower_id,vendor_id", ignoreDuplicates: true }
  );
  if (error) {
    console.error("Follow vendor write failed:", error);
    return NextResponse.json({ error: "Could not follow this vendor." }, { status: 500 });
  }
  return GET(_request, { params: Promise.resolve({ vendorId }) });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ vendorId: string }> }
) {
  const { vendorId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to manage follows." }, { status: 401 });

  const { error } = await supabase.from("vendor_follows").delete()
    .eq("follower_id", user.id).eq("vendor_id", vendorId);
  if (error) {
    console.error("Unfollow vendor failed:", error);
    return NextResponse.json({ error: "Could not unfollow this vendor." }, { status: 500 });
  }
  return GET(_request, { params: Promise.resolve({ vendorId }) });
}
