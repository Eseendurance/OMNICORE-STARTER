"use client";

import { useActionState } from "react";
import { createVendorSpace, type SpaceActionState } from "./actions";

const initialState: SpaceActionState = { error: null };

export default function SpaceForm() {
  const [state, formAction, pending] = useActionState(createVendorSpace, initialState);
  return (
    <form action={formAction} className="mt-5 grid gap-3 rounded-2xl border border-blue-100 bg-white p-5 sm:grid-cols-2">
      <label className="text-sm font-semibold text-blue-950">Space name
        <input name="name" required minLength={2} maxLength={80} placeholder="Aba fashion sellers" className="mt-1 block w-full rounded-lg border border-blue-200 px-3 py-2" />
      </label>
      <label className="text-sm font-semibold text-blue-950">Trade or region
        <input name="category" required minLength={2} maxLength={60} placeholder="Fashion · Aba" className="mt-1 block w-full rounded-lg border border-blue-200 px-3 py-2" />
      </label>
      <label className="text-sm font-semibold text-blue-950 sm:col-span-2">What is this space for?
        <textarea name="description" maxLength={500} rows={3} placeholder="Keep the conversation tied to the work." className="mt-1 block w-full rounded-lg border border-blue-200 px-3 py-2" />
      </label>
      <label className="text-sm font-semibold text-blue-950">Access
        <select name="privacy" className="mt-1 block w-full rounded-lg border border-blue-200 bg-white px-3 py-2">
          <option value="public">Public</option>
          <option value="invite_only">Membership required</option>
        </select>
      </label>
      <div className="flex items-end">
        <button type="submit" disabled={pending} className="w-full rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">
          {pending ? "Creating…" : "Create space"}
        </button>
      </div>
      {state.error && <p role="alert" className="sm:col-span-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
    </form>
  );
}
