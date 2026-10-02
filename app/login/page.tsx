import { Suspense } from "react";
import LoginForm from "@/app/login/LoginForm";
import AuthBrandPanel from "@/components/AuthBrandPanel";

export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-col sm:flex-row">
      <AuthBrandPanel
        eyebrow="WELCOME BACK"
        heading="Your storefront missed you."
        tone="sky"
      />
      <div className="flex flex-1">
        <Suspense fallback={<div className="flex-1" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
