import SignupForm from "@/app/signup/SignupForm";
import AuthBrandPanel from "@/components/AuthBrandPanel";

export default function SignupPage() {
  return (
    <div className="flex flex-1 flex-col sm:flex-row">
      <AuthBrandPanel
        eyebrow="JOIN OMNICORE"
        heading="Real buyers. Real dispatch. Zero ad spend."
        tone="coral"
      />
      <SignupForm />
    </div>
  );
}
