// app/dashboard/(main)/reels/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentVendor } from "@/lib/vendor";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type ReelActionState = { error: string | null };

const BUCKET = "reel-media";
const MAX_VIDEO_BYTES = 60 * 1024 * 1024; // 60MB — keep dashboard uploads reasonable

export async function createReel(
  _prev: ReelActionState,
  formData: FormData
): Promise<ReelActionState> {
  const vendor = await getCurrentVendor();
  if (!vendor) return { error: "You must have a store set up first." };

  const caption = String(formData.get("caption") || "").trim();
  const productId = String(formData.get("productId") || "") || null;
  const video = formData.get("video");
  const poster = formData.get("poster");

  if (!(video instanceof File) || video.size === 0) {
    return { error: "A video file is required." };
  }
  if (video.size > MAX_VIDEO_BYTES) {
    return { error: "Video is too large (max 60MB). Trim it and try again." };
  }
  if (!video.type.startsWith("video/")) {
    return { error: "File must be a video." };
  }
  if (!(poster instanceof File) || poster.size === 0) {
    return { error: "A poster thumbnail is required (captured automatically from your video)." };
  }

  const supabase = await createClient();
  const id = crypto.randomUUID();
  const videoExt = video.type.split("/")[1] || "mp4";
  const videoPath = `${vendor.id}/${id}/video.${videoExt}`;
  const posterPath = `${vendor.id}/${id}/poster.jpg`;

  const { error: videoUploadError } = await supabase.storage
    .from(BUCKET)
    .upload(videoPath, video, { contentType: video.type, upsert: false });
  if (videoUploadError) {
    return {
      error: `Video upload failed: ${videoUploadError.message}. Make sure the "${BUCKET}" storage bucket exists (see SHIP.md).`,
    };
  }

  const { error: posterUploadError } = await supabase.storage
    .from(BUCKET)
    .upload(posterPath, poster, { contentType: "image/jpeg", upsert: false });
  if (posterUploadError) {
    return { error: `Thumbnail upload failed: ${posterUploadError.message}` };
  }

  const videoUrl = supabase.storage.from(BUCKET).getPublicUrl(videoPath).data.publicUrl;
  const posterUrl = supabase.storage.from(BUCKET).getPublicUrl(posterPath).data.publicUrl;

  const { error: insertError } = await supabase.from("reels").insert({
    vendor_id: vendor.id,
    product_id: productId,
    caption: caption || "",
    video_url: videoUrl,
    poster_url: posterUrl,
    is_live: false,
  });

  if (insertError) return { error: insertError.message };

  revalidatePath("/dashboard/reels");
  revalidatePath("/reels");
  redirect("/dashboard/reels");
}

export async function deleteReel(reelId: string) {
  const vendor = await getCurrentVendor();
  if (!vendor) return;

  const supabase = await createClient();
  await supabase.from("reels").delete().eq("id", reelId).eq("vendor_id", vendor.id);

  revalidatePath("/dashboard/reels");
  revalidatePath("/reels");
}
