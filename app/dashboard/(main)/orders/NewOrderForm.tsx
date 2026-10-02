"use client";

import { useActionState } from "react";
import { createOrder, type OrderActionState } from "@/app/dashboard/(main)/orders/actions";

const initialState: OrderActionState = { error: null };

export default function NewOrderForm({
  products,
}: {
  products: { id: string; title: string; price: number }[];
}) {
  const [state, formAction, pending] = useActionState(createOrder, initialState);

  return (
    <form action={formAction} className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <input
        name="customerName"
        required
        placeholder="Customer name"
        className="rounded-md border-2 border-ink bg-white px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-marigold/40"
      />
      <input
        name="customerPhone"
        required
        placeholder="+2348012345678"
        className="rounded-md border-2 border-ink bg-white px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-marigold/40"
      />
      <select
        name="productId"
        className="rounded-md border-2 border-ink bg-white px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-marigold/40"
      >
        <option value="">No specific product</option>
        {products.map((p) => (
          <option key={p.id} value={p.id}>
            {p.title}
          </option>
        ))}
      </select>
      <input
        name="amount"
        type="number"
        min={0}
        required
        placeholder="Amount (₦)"
        className="rounded-md border-2 border-ink bg-white px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-marigold/40"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md border-2 border-ink bg-marigold px-4 py-2 text-sm font-bold shadow-[3px_3px_0_0_#14171F] transition hover:-translate-y-0.5 disabled:opacity-60"
      >
        {pending ? "Logging…" : "Log order"}
      </button>
      {state.error && (
        <p className="sm:col-span-2 lg:col-span-5 rounded-md border-2 border-coral bg-coral-tint px-3 py-2 text-sm text-coral">
          {state.error}
        </p>
      )}
    </form>
  );
}
