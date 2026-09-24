// app/dashboard/(main)/live/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentVendor } from "@/lib/vendor";
import { revalidatePath } from "next/cache";

export async function startLiveReel(caption: string): Promise<{ id: string } | { error: string }> {
  const vendor = await getCurrentVendor();
  if (!vendor) return { error: "Not signed in." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reels")
    .insert({
      vendor_id: vendor.id,
      caption: caption || `${vendor.name} is live`,
      // No pre-recorded video for a live stream — the poster is a static
      // placeholder shown only if a viewer's Agora connection is still
      // loading; the real feed is the WebRTC video track.
      poster_url: "/kivo-logo.png",
      is_live: true,
    })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message || "Could not start the live reel." };

  revalidatePath("/reels");
  revalidatePath("/dashboard/reels");
  return { id: data.id };
}

export async function endLiveReel(reelId: string) {
  const vendor = await getCurrentVendor();
  if (!vendor) return;

  const supabase = await createClient();
  await supabase
    .from("reels")
    .update({ is_live: false })
    .eq("id", reelId)
    .eq("vendor_id", vendor.id);

  revalidatePath("/reels");
  revalidatePath("/dashboard/reels");
}
