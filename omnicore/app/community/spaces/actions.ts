"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentVendor } from "@/lib/vendor";

export async function setSpaceLive(spaceId: string, isLive: boolean): Promise<{ error?: string }> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(spaceId)) {
    return { error: "This space link is not valid." };
  }

  const vendor = await getCurrentVendor();
  if (!vendor) return { error: "Sign in with a vendor account to host a lounge." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vendor_spaces")
    .update({
      is_live: isLive,
      live_channel: isLive ? `space-${spaceId}` : null,
    })
    .eq("id", spaceId)
    .eq("owner_id", vendor.id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Could not update space live status:", error);
    return { error: "Could not update this lounge. Please try again." };
  }
  if (!data) return { error: "Only the space owner can change its live status." };

  revalidatePath(`/community/spaces/${spaceId}`);
  revalidatePath("/community");
  return {};
}
