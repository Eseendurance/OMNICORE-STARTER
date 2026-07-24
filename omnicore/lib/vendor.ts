// lib/vendor.ts
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type VendorRow = Database["public"]["Tables"]["vendors"]["Row"];

export async function getCurrentVendor(): Promise<VendorRow | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: vendor } = await supabase
    .from("vendors")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return (vendor as VendorRow | null) ?? null;
}
