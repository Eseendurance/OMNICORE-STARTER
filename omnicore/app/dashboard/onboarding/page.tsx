import { redirect } from "next/navigation";
import { getCurrentVendor } from "@/lib/vendor";
import OnboardingForm from "@/app/dashboard/onboarding/OnboardingForm";

export default async function OnboardingPage() {
  const vendor = await getCurrentVendor();
  if (vendor) redirect("/dashboard");

  return <OnboardingForm />;
}
