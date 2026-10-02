import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentVendor } from "@/lib/vendor";
import FadeInStagger, { FadeInItem } from "@/components/motion/FadeInStagger";

export default async function DashboardOverview() {
  const vendor = await getCurrentVendor();
  if (!vendor) return null; // layout already redirects; this satisfies TS

  const supabase = await createClient();

  const [{ count: productCount }, { count: pendingOrders }, { data: recentOrders }] =
    await Promise.all([
      supabase.from("products").select("*", { count: "exact", head: true }).eq("vendor_id", vendor.id),
      supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("vendor_id", vendor.id)
        .eq("status", "pending"),
      supabase
        .from("orders")
        .select("*")
        .eq("vendor_id", vendor.id)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const stats = [
    { label: "Products live", value: productCount ?? 0, href: "/dashboard/products" },
    { label: "Orders awaiting dispatch", value: pendingOrders ?? 0, href: "/dashboard/orders" },
  ];

  return (
    <div>
      <FadeInStagger className="grid gap-4 sm:grid-cols-2">
        {stats.map((s) => (
          <FadeInItem key={s.label}>
            <Link
              href={s.href}
              className="block rounded-xl border-2 border-ink bg-white p-5 shadow-[4px_4px_0_0_#14171F] transition hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_#14171F]"
            >
              <p className="font-mono text-xs uppercase tracking-widest text-ink/50">{s.label}</p>
              <p className="mt-2 font-display text-4xl font-bold">{s.value}</p>
            </Link>
          </FadeInItem>
        ))}
      </FadeInStagger>

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Recent orders</h2>
          <Link href="/dashboard/orders" className="text-sm font-semibold text-sky hover:underline">
            View all →
          </Link>
        </div>
        {!recentOrders || recentOrders.length === 0 ? (
          <p className="mt-4 rounded-lg border-2 border-dashed border-ink/30 p-6 text-center text-sm text-ink/50">
            No orders yet. Orders you log from WhatsApp conversations will show up here.
          </p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-lg border-2 border-ink">
            <table className="w-full text-sm">
              <thead className="bg-marigold text-ink">
                <tr>
                  <th className="p-3 text-left font-mono text-xs font-bold uppercase">Ref</th>
                  <th className="p-3 text-left font-mono text-xs font-bold uppercase">Customer</th>
                  <th className="p-3 text-left font-mono text-xs font-bold uppercase">Amount</th>
                  <th className="p-3 text-left font-mono text-xs font-bold uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o.id} className="border-t border-ink/10">
                    <td className="p-3">
                      <Link href={`/dashboard/orders/${o.id}`} className="font-mono text-sky hover:underline">
                        {o.order_ref}
                      </Link>
                    </td>
                    <td className="p-3">{o.customer_name}</td>
                    <td className="p-3">₦{o.amount.toLocaleString()}</td>
                    <td className="p-3">
                      <span className="rounded-full bg-jade-tint px-2 py-1 font-mono text-xs text-jade">
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
