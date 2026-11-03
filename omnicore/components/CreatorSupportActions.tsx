"use client";

import { useState } from "react";

export default function CreatorSupportActions({ vendorId, vendorName }: { vendorId: string; vendorName: string }) {
  const [amount, setAmount] = useState("1000");
  const [purpose, setPurpose] = useState<"tip" | "membership">("tip");
  const [membershipDays, setMembershipDays] = useState<30 | 90>(30);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function checkout() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/payments/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId,
          purpose,
          amount: Number(amount),
          ...(purpose === "membership" ? { membershipDays } : { note }),
        }),
      });
      const result = await response.json() as { authorizationUrl?: string; error?: string };
      if (!response.ok || !result.authorizationUrl) {
        setError(result.error ?? "Could not start payment.");
        return;
      }
      window.location.assign(result.authorizationUrl);
    } catch {
      setError("Could not reach Kivo. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-5 sm:p-6">
      <h2 className="font-display text-xl font-bold text-blue-950">Back {vendorName}&apos;s work</h2>
      <p className="mt-1 text-sm leading-6 text-blue-800">Pay securely with Paystack. Tips go to the vendor; a 30- or 90-day membership opens their invite-only vendor spaces until it expires. Renew anytime.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <label className="text-sm font-semibold text-blue-950">
          Support type
          <select value={purpose} onChange={(event) => setPurpose(event.target.value as "tip" | "membership")} className="mt-1 block w-full rounded-lg border border-blue-200 bg-white px-3 py-2">
            <option value="tip">One-time tip</option><option value="membership">Membership</option>
          </select>
        </label>
        <label className="text-sm font-semibold text-blue-950">
          Amount (₦)
          <input value={amount} onChange={(event) => setAmount(event.target.value)} type="number" min="100" max="1000000" step="100" className="mt-1 block w-full rounded-lg border border-blue-200 bg-white px-3 py-2" />
        </label>
        {purpose === "membership" ? (
          <label className="text-sm font-semibold text-blue-950">
            Access period
            <select value={membershipDays} onChange={(event) => setMembershipDays(Number(event.target.value) as 30 | 90)} className="mt-1 block w-full rounded-lg border border-blue-200 bg-white px-3 py-2">
              <option value={30}>30 days</option><option value={90}>90 days</option>
            </select>
          </label>
        ) : (
          <label className="text-sm font-semibold text-blue-950">
            Note (optional)
            <input value={note} onChange={(event) => setNote(event.target.value)} maxLength={240} placeholder="Say thanks" className="mt-1 block w-full rounded-lg border border-blue-200 bg-white px-3 py-2" />
          </label>
        )}
      </div>
      <button type="button" onClick={checkout} disabled={busy} className="mt-4 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-60">
        {busy ? "Opening Paystack…" : `Continue to secure payment · ₦${Number(amount || 0).toLocaleString()}`}
      </button>
      {error && <p role="alert" className="mt-3 text-sm font-medium text-red-700">{error}</p>}
    </section>
  );
}
