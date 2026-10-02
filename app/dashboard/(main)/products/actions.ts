// app/dashboard/(main)/products/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentVendor } from "@/lib/vendor";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export type ProductActionState = { error: string | null };

const BUCKET = "product-images";

export async function createProduct(
  _prev: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {
  const vendor = await getCurrentVendor();
  if (!vendor) return { error: "You must have a store set up first." };

  const title = String(formData.get("title") || "").trim();
  const price = Number(formData.get("price"));
  const compareAtRaw = formData.get("compareAt");
  const compareAt = compareAtRaw ? Number(compareAtRaw) : null;
  const category = String(formData.get("category") || "General").trim();
  const stockLeft = Number(formData.get("stockLeft") || 0);
  const image = formData.get("image");

  if (!title || !Number.isFinite(price) || price < 0) {
    return { error: "Title and a valid price are required." };
  }
  if (!(image instanceof File) || image.size === 0) {
    return { error: "A product photo is required." };
  }

  const supabase = await createClient();

  const ext = image.type.split("/")[1] || "png";
  const path = `${vendor.id}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, image, {
    contentType: image.type,
    upsert: false,
  });
  if (uploadError) {
    return {
      error: `Image upload failed: ${uploadError.message}. Make sure the "${BUCKET}" storage bucket exists (see README).`,
    };
  }

  const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(path);

  const { error: insertError } = await supabase.from("products").insert({
    vendor_id: vendor.id,
    title,
    price: Math.round(price),
    compare_at: compareAt && compareAt > price ? Math.round(compareAt) : null,
    category: category || "General",
    image_url: publicUrl.publicUrl,
    stock_left: Number.isFinite(stockLeft) ? Math.max(0, Math.round(stockLeft)) : 0,
  });

  if (insertError) return { error: insertError.message };

  revalidatePath("/dashboard/products");
  redirect("/dashboard/products");
}

export async function deleteProduct(productId: string) {
  const vendor = await getCurrentVendor();
  if (!vendor) return;

  const supabase = await createClient();
  await supabase.from("products").delete().eq("id", productId).eq("vendor_id", vendor.id);

  revalidatePath("/dashboard/products");
}
