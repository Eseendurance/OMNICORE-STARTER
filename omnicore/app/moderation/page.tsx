import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ModerationQueue from "@/components/ModerationQueue";

export const dynamic = "force-dynamic";
export const metadata = { title: "Moderation queue — Kivo" };

export default async function ModerationPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = user?.app_metadata?.role;
  if (role !== "moderator" && role !== "admin") notFound();
  return (
    <main>
      <p className="font-mono text-xs font-bold uppercase tracking-widest text-blue-700">Trust & safety</p>
      <h1 className="mt-2 font-display text-3xl font-bold text-blue-950">Moderation queue</h1>
      <p className="mt-2 text-sm text-blue-800">Review reports and record a clear outcome. Access is limited to support accounts with a moderator role.</p>
      <ModerationQueue />
    </main>
  );
}
