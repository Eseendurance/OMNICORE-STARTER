import { getCurrentVendor } from "@/lib/vendor";
import LiveDashboard from "@/app/dashboard/(main)/live/LiveDashboard";

export default async function LivePage() {
  const vendor = await getCurrentVendor();
  if (!vendor) return null;

  return <LiveDashboard vendorId={vendor.id} vendorName={vendor.name} />;
}
