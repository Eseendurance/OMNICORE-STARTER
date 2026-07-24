// app/dashboard/onboarding/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type OnboardState = { error: string | null };

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createStore(
  _prev: OnboardState,
  formData: FormData
): Promise<OnboardState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const name = String(formData.get("name") || "").trim();
  const tagline = String(formData.get("tagline") || "").trim();
  const location = String(formData.get("location") || "").trim();
  const whatsapp = String(formData.get("whatsapp") || "").trim();
  const color = String(formData.get("color") || "marigold");

  if (!name || !whatsapp) {
    return { error: "Store name and WhatsApp number are required." };
  }
  if (!/^\+\d{10,15}$/.test(whatsapp.replace(/[\s-]/g, ""))) {
    return { error: "WhatsApp number must include country code, e.g. +2348012345678." };
  }

  const baseSlug = slugify(name) || "store";
  let slug = baseSlug;
  let suffix = 1;
  // Ensure slug uniqueness (route /store/[vendor] depends on it).
  while (true) {
    const { data: existing } = await supabase
      .from("vendors")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!existing) break;
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  const { error } = await supabase.from("vendors").insert({
    id: user.id,
    slug,
    name,
    tagline: tagline || null,
    location: location || null,
    whatsapp: whatsapp.replace(/[\s-]/g, ""),
    color: color as "marigold" | "jade" | "coral" | "sky",
  });

  if (error) return { error: error.message };

  redirect("/dashboard");
}
