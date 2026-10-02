import { createClient } from "@/lib/supabase/server";
import { getCurrentVendor } from "@/lib/vendor";
import NewReelForm from "@/app/dashboard/(main)/reels/new/NewReelForm";

export default async function NewReelPage() {
  const vendor = await getCurrentVendor();
  if (!vendor) return null;

  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("id, title")
    .eq("vendor_id", vendor.id);

  return <NewReelForm products={products ?? []} />;
}
