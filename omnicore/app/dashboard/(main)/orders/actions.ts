// app/dashboard/(main)/orders/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentVendor } from "@/lib/vendor";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type OrderActionState = { error: string | null };

export async function createOrder(
  _prev: OrderActionState,
  formData: FormData
): Promise<OrderActionState> {
  const vendor = await getCurrentVendor();
  if (!vendor) return { error: "You must have a store set up first." };

  const customerName = String(formData.get("customerName") || "").trim();
  const customerPhone = String(formData.get("customerPhone") || "").trim();
  const amount = Number(formData.get("amount"));
  const productId = String(formData.get("productId") || "") || null;

  if (!customerName || !customerPhone || !Number.isFinite(amount) || amount < 0) {
    return { error: "Customer name, phone, and a valid amount are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("orders").insert({
    vendor_id: vendor.id,
    product_id: productId,
    customer_name: customerName,
    customer_phone: customerPhone,
    amount: Math.round(amount),
    status: "confirmed",
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/orders");
  redirect("/dashboard/orders");
}

export type DispatchState = { error: string | null; success?: boolean; warning?: string };

export async function dispatchOrder(
  orderId: string,
  _prev: DispatchState,
  formData: FormData
): Promise<DispatchState> {
  const vendor = await getCurrentVendor();
  if (!vendor) return { error: "Not signed in." };

  const transportCompany = String(formData.get("transportCompany") || "").trim();
  const departureTerminal = String(formData.get("departureTerminal") || "").trim();
  const driverName = String(formData.get("driverName") || "").trim();
  const driverPhone = String(formData.get("driverPhone") || "").trim();
  const waybillCode = String(formData.get("waybillCode") || "").trim();

  if (!transportCompany || !departureTerminal || !driverName || !driverPhone || !waybillCode) {
    return { error: "All waybill fields are required." };
  }

  const supabase = await createClient();
  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .eq("vendor_id", vendor.id)
    .single();

  if (fetchError || !order) return { error: "Order not found." };

  // Send the real SMS via the route we already built.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  let smsOk = true;
  let smsErrorDetail = "";
  if (siteUrl) {
    try {
      const res = await fetch(`${siteUrl}/api/orders/waybill-notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerPhone: order.customer_phone,
          customerName: order.customer_name,
          transportCompany,
          departureTerminal,
          driverName,
          driverPhone,
          waybillCode,
          orderId: order.order_ref,
        }),
      });
      if (!res.ok) {
        smsOk = false;
        const data = await res.json().catch(() => ({}));
        smsErrorDetail = data.error || `SMS route returned ${res.status}`;
      }
    } catch {
      smsOk = false;
      smsErrorDetail = "Could not reach the SMS notification route.";
    }
  } else {
    smsOk = false;
    smsErrorDetail = "NEXT_PUBLIC_SITE_URL is not set, so the SMS route couldn't be called.";
  }

  const { error: updateError } = await supabase
    .from("orders")
    .update({
      status: "shipped",
      transport_company: transportCompany,
      departure_terminal: departureTerminal,
      driver_name: driverName,
      driver_phone: driverPhone,
      waybill_code: waybillCode,
      shipped_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("vendor_id", vendor.id);

  if (updateError) return { error: updateError.message };

  // Auto-create a 'shipped' social post so buyers and followers see real dispatch proof.
  try {
    const routeLabel = `${departureTerminal} → ${transportCompany} #${waybillCode}`;
    const postBody = `Your parcel left ${departureTerminal} with ${transportCompany}. Driver: ${driverName} (${driverPhone}). Waybill ${waybillCode}`;
    await supabase.from('social_posts').insert({
      vendor_id: vendor.id,
      order_id: order.id,
      kind: 'shipped',
      body: postBody,
      route_label: routeLabel,
      depth_score: 1,
    });
  } catch (err) {
    // Non-fatal: log and continue
    console.error('Could not create shipped post:', err);
  }

  revalidatePath(`/dashboard/orders/${orderId}`);
  revalidatePath("/dashboard/orders");

  if (!smsOk) {
    return {
      error: null,
      success: true,
      warning: `Order marked shipped, but the SMS didn't send: ${smsErrorDetail}`,
    };
  }

  return { error: null, success: true };
}
