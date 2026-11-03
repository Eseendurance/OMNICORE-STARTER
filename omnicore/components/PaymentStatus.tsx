"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Status = { purpose: "tip" | "membership"; status: "pending" | "paid" | "failed"; amount: number };

export default function PaymentStatus({ reference }: { reference: string }) {
  const [payment, setPayment] = useState<Status | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout>;
    async function check() {
      try {
        const response = await fetch(`/api/payments/support/${encodeURIComponent(reference)}`, { cache: "no-store" });
        const result = await response.json() as { data?: Status; error?: string };
        if (!response.ok) throw new Error(result.error ?? "Could not check payment.");
        if (!active) return;
        setPayment(result.data ?? null);
        if (result.data?.status === "pending" && attempts++ < 10) timer = setTimeout(check, 2500);
      } catch (checkError) {
        if (active) setError(checkError instanceof Error ? checkError.message : "Could not check payment.");
      }
    }
    check();
    return () => { active = false; clearTimeout(timer); };
  }, [reference]);

  return (
    <main className="mx-auto max-w-xl px-5 py-16 text-center">
      <p className="font-mono text-xs font-bold uppercase tracking-widest text-blue-700">Payment update</p>
      <h1 className="mt-3 font-display text-3xl font-bold text-blue-950">
        {payment?.status === "paid" ? "Payment confirmed" : payment?.status === "failed" ? "Payment not completed" : "Checking with Paystack"}
      </h1>
      <p className="mt-3 text-sm leading-6 text-blue-800">
        {payment?.status === "paid"
          ? payment.purpose === "tip" ? "Your tip has reached the vendor." : "Your membership is active. Thank you for backing this store."
          : payment?.status === "failed" ? "No support was recorded. You can try again from the storefront." : "We are waiting for Paystack to confirm the transaction. This can take a few seconds."}
      </p>
      {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
      {!payment && !error && <div className="mx-auto mt-6 h-2 w-48 animate-pulse rounded bg-blue-100" />}
      <Link href="/community" className="mt-7 inline-flex rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-bold text-white">Back to Kivo</Link>
    </main>
  );
}
