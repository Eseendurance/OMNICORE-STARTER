"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentVendor } from "@/lib/vendor";

export type SpaceActionState = { error: string | null };

export async function createVendorSpace(
  _previous: SpaceActionState,
  formData: FormData
): Promise<SpaceActionState> {
  const vendor = await getCurrentVendor();
  if (!vendor) return { error: "Set up your vendor account before creating a space." };

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const privacy = String(formData.get("privacy") ?? "public");
  if (name.length < 2 || name.length > 80 || description.length > 500 ||
      category.length < 2 || category.length > 60 ||
      (privacy !== "public" && privacy !== "invite_only")) {
    return { error: "Check the name, category, description, and access setting." };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("vendor_spaces").insert({
    owner_id: vendor.id,
    name,
    description: description || null,
    category,
    privacy,
    live_channel: null,
  });
  if (error) {
    console.error("Vendor space creation failed:", error);
    return { error: "Could not create this space. Try again." };
  }
  revalidatePath("/dashboard/spaces");
  revalidatePath("/community");
  redirect("/dashboard/spaces");
}
