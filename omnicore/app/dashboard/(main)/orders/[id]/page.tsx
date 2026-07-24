import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentVendor } from "@/lib/vendor";
import DispatchForm from "@/app/dashboard/(main)/orders/[id]/DispatchForm";

const statusTone: Record<string, string> = {
  pending: "bg-ink/10 text-ink/70",
  confirmed: "bg-sky-tint text-sky",
  shipped: "bg-marigold text-ink",
  delivered: "bg-jade-tint text-jade",
  cancelled: "bg-coral-tint text-coral",
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const vendor = await getCurrentVendor();
  if (!vendor) return null;

  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .eq("vendor_id", vendor.id)
    .maybeSingle();

  if (!order) notFound();

  return (
    <div className="mx-auto max-w-lg">
      <Link href="/dashboard/orders" className="text-sm font-semibold text-sky hover:underline">
        ← All orders
      </Link>

      <div className="mt-3 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">{order.order_ref}</h1>
        <span className={`rounded-full px-3 py-1 font-mono text-xs ${statusTone[order.status] ?? ""}`}>
          {order.status}
        </span>
      </div>

      <div className="mt-4 rounded-xl border-2 border-ink bg-white p-4 text-sm shadow-[3px_3px_0_0_#14171F]">
        <p><span className="text-ink/50">Customer:</span> {order.customer_name}</p>
        <p><span className="text-ink/50">Phone:</span> {order.customer_phone}</p>
        <p><span className="text-ink/50">Amount:</span> ₦{order.amount.toLocaleString()}</p>
      </div>

      {order.status === "shipped" || order.status === "delivered" ? (
        <div className="mt-6 rounded-xl border-2 border-ink bg-jade-tint p-4 text-sm">
          <p className="font-bold text-jade">Dispatched via {order.transport_company}</p>
          <p className="mt-1 text-ink/70">
            {order.departure_terminal} · Driver {order.driver_name} ({order.driver_phone})
          </p>
          <p className="mt-1 font-mono text-xs text-ink/60">Waybill: {order.waybill_code}</p>
        </div>
      ) : (
        <div className="mt-6">
          <h2 className="font-display text-lg font-bold">Dispatch via motor park</h2>
          <p className="mt-1 text-xs text-ink/60">
            This sends a real SMS to the customer with the waybill and driver details.
          </p>
          <DispatchForm orderId={order.id} />
        </div>
      )}
    </div>
  );
}
