"use client";

import Link from "next/link";
import { useActionState } from "react";
import { updatePassword, type UpdatePasswordState } from "@/app/auth-actions";

const initialState: UpdatePasswordState = { error: null };

export default function UpdatePasswordPage() {
  const [state, action, pending] = useActionState(updatePassword, initialState);
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-16">
      <h1 className="font-display text-3xl font-bold">Choose a new password</h1>
      <p className="mt-2 text-sm text-ink/70">Use at least 8 characters that you do not use elsewhere.</p>
      <form action={action} className="mt-6 space-y-4">
        <label className="block text-sm font-semibold">New password<input name="password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required className="mt-1 w-full rounded-xl border border-blue-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" /></label>
        <label className="block text-sm font-semibold">Confirm password<input name="confirmPassword" type="password" autoComplete="new-password" minLength={8} maxLength={128} required className="mt-1 w-full rounded-xl border border-blue-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" /></label>
        {state.error && <p role="alert" className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900">{state.error}</p>}
        <button disabled={pending} className="w-full rounded-xl bg-blue-700 px-4 py-3 font-bold text-white disabled:opacity-60">{pending ? "Updating..." : "Save new password"}</button>
      </form>
      <Link href="/login" className="mt-5 text-sm font-semibold text-blue-700 hover:underline">Back to sign in</Link>
    </main>
  );
}
