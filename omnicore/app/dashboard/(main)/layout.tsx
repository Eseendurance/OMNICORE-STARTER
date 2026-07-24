import { redirect } from "next/navigation";
import { getCurrentVendor } from "@/lib/vendor";
import DashboardSidebar from "@/components/DashboardSidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const vendor = await getCurrentVendor();

  // middleware.ts already ensures the user is signed in. This layout only
  // wraps routes under app/dashboard/(main)/ — onboarding lives outside
  // this route group specifically so it isn't gated by its own check.
  if (!vendor) {
    redirect("/dashboard/onboarding");
  }

  return (
    <div className="flex flex-1 flex-col sm:flex-row">
      <DashboardSidebar
        vendorName={vendor.name}
        vendorSlug={vendor.slug}
        vendorColor={vendor.color}
      />
      <div className="flex-1 px-5 py-8 sm:px-8">{children}</div>
    </div>
  );
}
