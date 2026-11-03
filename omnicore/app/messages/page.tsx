import { redirect } from "next/navigation";
import OrderInbox from "@/components/OrderInbox";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Order messages — Kivo" };

export default async function MessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=%2Fmessages");
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <p className="font-mono text-xs font-bold uppercase tracking-widest text-blue-700">Order support</p>
      <h1 className="mt-2 font-display text-3xl font-bold text-blue-950">Messages tied to your orders</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-800">Only you and the vendor on an order can read its thread. We link orders using your confirmed account email.</p>
      <OrderInbox userId={user.id} />
    </main>
  );
}
