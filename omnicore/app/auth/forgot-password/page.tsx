"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset, type ResetPasswordState } from "@/app/auth-actions";

const initialState: ResetPasswordState = { error: null };

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(requestPasswordReset, initialState);
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-16">
      <h1 className="font-display text-3xl font-bold">Reset your password</h1>
      {state.sent ? (
        <p className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">If that account exists, a reset link is on its way. Check your inbox and spam folder.</p>
      ) : (
        <>
          <p className="mt-2 text-sm text-ink/70">We will email a secure link to the address on your Kivo account.</p>
          <form action={action} className="mt-6 space-y-4">
            <label className="block text-sm font-semibold">Email address<input name="email" type="email" autoComplete="email" required className="mt-1 w-full rounded-xl border border-blue-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" /></label>
            {state.error && <p role="alert" className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900">{state.error}</p>}
            <button disabled={pending} className="w-full rounded-xl bg-blue-700 px-4 py-3 font-bold text-white disabled:opacity-60">{pending ? "Sending link..." : "Email me a reset link"}</button>
          </form>
        </>
      )}
      <Link href="/login" className="mt-5 text-sm font-semibold text-blue-700 hover:underline">Back to sign in</Link>
    </main>
  );
}
