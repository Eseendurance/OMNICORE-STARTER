// app/auth-actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type ActionState = { error: string | null; checkEmail?: boolean };

export async function signUp(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");

  if (!email || !password || password.length < 6) {
    return { error: "Enter a valid email and a password of at least 6 characters." };
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: siteUrl ? { emailRedirectTo: `${siteUrl}/auth/callback` } : undefined,
  });
  if (error) return { error: error.message };

  // If the Supabase project has "Confirm email" turned on (the default),
  // signUp succeeds but returns no session — the user must click the link
  // in their inbox first. Redirecting to /dashboard here would just bounce
  // them straight back to /login via middleware, so show a message instead.
  if (!data.session) {
    return { error: null, checkEmail: true };
  }

  redirect("/dashboard/onboarding");
}

export async function signIn(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "/dashboard");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  redirect(next);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
