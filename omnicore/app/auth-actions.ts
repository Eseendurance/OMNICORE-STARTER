// app/auth-actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { safeInternalPath } from "@/lib/safe-internal-path";

export type ActionState = { error: string | null; checkEmail?: boolean };

function normalizedEmail(formData: FormData): string {
  return String(formData.get("email") || "").trim().toLowerCase();
}

function hasSupabaseAuthConfig(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function signInMessage(message: string): string {
  if (message.toLowerCase().includes("invalid login credentials")) return "That email and password do not match.";
  if (message.toLowerCase().includes("email not confirmed")) return "Confirm your email from the link we sent before signing in.";
  if (message.toLowerCase().includes("too many requests")) return "Too many attempts. Wait a little, then try again.";
  return "We could not sign you in. Check your details and try again.";
}

export async function signUp(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = normalizedEmail(formData);
  const password = String(formData.get("password") || "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8 || password.length > 128) {
    return { error: "Enter a valid email and a password between 8 and 128 characters." };
  }
  if (!hasSupabaseAuthConfig()) {
    return { error: "Sign-up is not configured. Add the Supabase URL and anon key to .env.local, then restart the app." };
  }

  let hasSession = false;
  try {
    const supabase = await createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: siteUrl ? { emailRedirectTo: new URL("/auth/callback", siteUrl).toString() } : undefined,
    });
    if (error) return { error: error.message };
    hasSession = Boolean(data.session);
  } catch (error) {
    console.error("Sign-up request failed:", error);
    return { error: "We could not reach sign-in services. Check your connection and try again." };
  }

  if (!hasSession) return { error: null, checkEmail: true };
  redirect("/dashboard/onboarding");
}

export async function signIn(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = normalizedEmail(formData);
  const password = String(formData.get("password") || "");
  const next = safeInternalPath(String(formData.get("next") || ""), "/dashboard");

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password || password.length > 128) {
    return { error: "Enter the email and password you used to create your account." };
  }
  if (!hasSupabaseAuthConfig()) {
    return { error: "Sign-in is not configured. Add the Supabase URL and anon key to .env.local, then restart the app." };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: signInMessage(error.message) };
  } catch (error) {
    console.error("Sign-in request failed:", error);
    return { error: "We could not reach sign-in services. Check your connection and try again." };
  }

  redirect(next);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}


export type ResetPasswordState = { error: string | null; sent?: boolean };

export async function requestPasswordReset(
  _prev: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  const email = normalizedEmail(formData);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Enter the email address on your account." };
  }
  if (!hasSupabaseAuthConfig()) {
    return { error: "Password reset is not configured. Add the Supabase URL and anon key, then restart the app." };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) {
    return { error: "Set NEXT_PUBLIC_SITE_URL so the reset link returns to this app." };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: new URL("/auth/callback?next=/auth/update-password", siteUrl).toString(),
    });
    if (error) {
      console.error("Password reset request failed:", error.message);
      return { error: "We could not send a reset link. Wait a little and try again." };
    }
    return { error: null, sent: true };
  } catch (error) {
    console.error("Password reset request failed:", error);
    return { error: "We could not reach sign-in services. Check your connection and try again." };
  }
}

export type UpdatePasswordState = { error: string | null; success?: boolean };

export async function updatePassword(
  _prev: UpdatePasswordState,
  formData: FormData
): Promise<UpdatePasswordState> {
  const password = String(formData.get("password") || "");
  const confirmation = String(formData.get("confirmPassword") || "");
  if (password.length < 8 || password.length > 128) {
    return { error: "Choose a password between 8 and 128 characters." };
  }
  if (password !== confirmation) return { error: "The passwords do not match." };

  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return { error: "Your reset link has expired. Request a new one." };
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      console.error("Password update failed:", error.message);
      return { error: "We could not update your password. Request a new reset link and try again." };
    }
  } catch (error) {
    console.error("Password update failed:", error);
    return { error: "We could not reach sign-in services. Check your connection and try again." };
  }
  redirect("/dashboard");
}
