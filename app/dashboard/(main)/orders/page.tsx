import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentVendor } from "@/lib/vendor";
import NewOrderForm from "@/app/dashboard/(main)/orders/NewOrderForm";

const statusTone: Record<string, string> = {
  pending: "bg-ink/10 text-ink/70",
  confirmed: "bg-sky-tint text-sky",
  shipped: "bg-marigold text-ink",
  delivered: "bg-jade-tint text-jade",
  cancelled: "bg-coral-tint text-coral",
};

export default async function OrdersPage() {
  const vendor = await getCurrentVendor();
  if (!vendor) return null;

  const supabase = await createClient();
  const [{ data: orders }, { data: products }] = await Promise.all([
    supabase.from("orders").select("*").eq("vendor_id", vendor.id).order("created_at", { ascending: false }),
    supabase.from("products").select("id, title, price").eq("vendor_id", vendor.id),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold">Orders</h2>
      </div>

      <div className="mt-4 rounded-xl border-2 border-ink bg-sky-tint p-5">
        <p className="font-mono text-xs font-bold uppercase text-sky">Log a new order</p>
        <p className="mt-1 text-xs text-ink/60">
          When a buyer confirms and pays through WhatsApp, log it here so you can track dispatch.
        </p>
        <NewOrderForm products={products ?? []} />
      </div>

      <div className="mt-6">
        {!orders || orders.length === 0 ? (
          <p className="rounded-lg border-2 border-dashed border-ink/30 p-8 text-center text-sm text-ink/50">
            No orders logged yet.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border-2 border-ink">
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
                {orders.map((o) => (
                  <tr key={o.id} className="border-t border-ink/10 hover:bg-paper">
                    <td className="p-3">
                      <Link href={`/dashboard/orders/${o.id}`} className="font-mono text-sky hover:underline">
                        {o.order_ref}
                      </Link>
                    </td>
                    <td className="p-3">
                      {o.customer_name}
                      <span className="block font-mono text-xs text-ink/40">{o.customer_phone}</span>
                    </td>
                    <td className="p-3">₦{o.amount.toLocaleString()}</td>
                    <td className="p-3">
                      <span className={`rounded-full px-2 py-1 font-mono text-xs ${statusTone[o.status] ?? ""}`}>
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
