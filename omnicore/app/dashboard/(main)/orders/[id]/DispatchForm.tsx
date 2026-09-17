"use client";

import { useActionState } from "react";
import { dispatchOrder, type DispatchState } from "@/app/dashboard/(main)/orders/actions";

const initialState: DispatchState = { error: null };

export default function DispatchForm({ orderId }: { orderId: string }) {
  const action = dispatchOrder.bind(null, orderId);
  const [state, formAction, pending] = useActionState(action, initialState);

  if (state.success) {
    return (
      <div className="mt-3 rounded-lg border-2 border-ink bg-jade-tint p-4 text-sm">
        <p className="font-bold text-jade">Order marked as shipped.</p>
        {state.warning && <p className="mt-1 text-coral">{state.warning}</p>}
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-3 flex flex-col gap-3">
      <input
        name="transportCompany"
        required
        placeholder="Transport company name"
        className="rounded-md border-2 border-ink bg-white px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-marigold/40"
      />
      <input
        name="departureTerminal"
        required
        placeholder="Departure terminal (e.g. Jibowu Motor Park, Lagos)"
        className="rounded-md border-2 border-ink bg-white px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-marigold/40"
      />
      <div className="grid grid-cols-2 gap-3">
        <input
          name="driverName"
          required
          placeholder="Driver name"
          className="rounded-md border-2 border-ink bg-white px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-marigold/40"
        />
        <input
          name="driverPhone"
          required
          placeholder="Driver phone"
          className="rounded-md border-2 border-ink bg-white px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-marigold/40"
        />
      </div>
      <input
        name="waybillCode"
        required
        placeholder="Waybill / parcel code"
        className="rounded-md border-2 border-ink bg-white px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-marigold/40"
      />

      {state.error && (
        <p className="rounded-md border-2 border-coral bg-coral-tint px-3 py-2 text-sm text-coral">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md border-2 border-ink bg-marigold px-4 py-2.5 font-bold shadow-[3px_3px_0_0_#1E3A8A] transition hover:-translate-y-0.5 disabled:opacity-60"
      >
        {pending ? "Sending SMS + dispatching…" : "Mark as shipped & notify customer"}
      </button>
    </form>
  );
}
