"use client";

import { useEffect, useState } from "react";

type Review = { id: string; rating: number; body: string; created_at: string };

export default function StoreReviews({ vendorId }: { vendorId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    fetch(`/api/reviews?vendorId=${encodeURIComponent(vendorId)}`)
      .then(async (response) => {
        const payload = await response.json() as { data?: Review[]; error?: string };
        if (!response.ok) throw new Error(payload.error ?? "Could not load reviews.");
        if (active) setReviews(payload.data ?? []);
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Could not load reviews.");
      });
    return () => { active = false; };
  }, [vendorId]);
  const average = reviews.length
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <section className="mt-10 rounded-2xl border border-blue-100 bg-white p-5 sm:p-7">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-xl font-bold text-blue-950">Buyer reviews</h2>
        <p className="text-sm font-semibold text-blue-800">{average ? `★ ${average} · ${reviews.length} verified` : "No verified reviews yet"}</p>
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
      {reviews.length ? (
        <ul className="mt-4 divide-y divide-blue-100">
          {reviews.map((review) => (
            <li key={review.id} className="py-4 first:pt-0 last:pb-0">
              <div className="flex items-center justify-between">
                <span aria-label={`${review.rating} out of 5 stars`} className="font-bold text-blue-700">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span>
                <span className="text-xs text-blue-600">Verified purchase</span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-blue-950">{review.body}</p>
              <time className="mt-2 block text-xs text-blue-600">{new Date(review.created_at).toLocaleDateString()}</time>
            </li>
          ))}
        </ul>
      ) : <p className="mt-4 text-sm text-blue-700">Reviews are only published for delivered orders. That keeps the feedback useful.</p>}
    </section>
  );
}
