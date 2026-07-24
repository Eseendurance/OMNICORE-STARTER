"use client";

import { useActionState } from "react";
import { createStore, type OnboardState } from "@/app/dashboard/onboarding/actions";

const initialState: OnboardState = { error: null };

export default function OnboardingForm() {
  const [state, formAction, pending] = useActionState(createStore, initialState);

  return (
    <div className="mx-auto max-w-lg px-5 py-16">
      <h1 className="font-display text-3xl font-bold">Set up your store</h1>
      <p className="mt-2 text-sm text-ink/60">
        This creates your public storefront at /store/your-slug and the
        WhatsApp number buyers will message to order.
      </p>

      <form action={formAction} className="mt-8 flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="font-mono text-xs font-semibold uppercase text-ink/60">Store name</span>
          <input
            name="name"
            required
            placeholder="Adaeze Leather Co."
            className="rounded-md border-2 border-ink bg-white px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-marigold/40"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-mono text-xs font-semibold uppercase text-ink/60">Tagline</span>
          <input
            name="tagline"
            placeholder="Handmade footwear out of Aba"
            className="rounded-md border-2 border-ink bg-white px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-marigold/40"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-mono text-xs font-semibold uppercase text-ink/60">Location</span>
          <input
            name="location"
            placeholder="Aba, Abia"
            className="rounded-md border-2 border-ink bg-white px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-marigold/40"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-mono text-xs font-semibold uppercase text-ink/60">
            WhatsApp number (with country code)
          </span>
          <input
            name="whatsapp"
            required
            placeholder="+2348012345678"
            className="rounded-md border-2 border-ink bg-white px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-marigold/40"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-mono text-xs font-semibold uppercase text-ink/60">Brand color</span>
          <select
            name="color"
            defaultValue="marigold"
            className="rounded-md border-2 border-ink bg-white px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-marigold/40"
          >
            <option value="marigold">Marigold</option>
            <option value="jade">Jade</option>
            <option value="coral">Coral</option>
            <option value="sky">Sky</option>
          </select>
        </label>

        {state.error && (
          <p className="rounded-md border-2 border-coral bg-coral-tint px-3 py-2 text-sm text-coral">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-2 rounded-md border-2 border-ink bg-marigold px-4 py-2.5 font-bold shadow-[3px_3px_0_0_#14171F] transition hover:-translate-y-0.5 disabled:opacity-60"
        >
          {pending ? "Creating…" : "Create my store"}
        </button>
      </form>
    </div>
  );
}
