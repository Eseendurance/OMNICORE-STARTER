"use client";

import { useEffect, useState } from "react";
import SearchBar from "@/components/SearchBar";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/lib/data";

export default function ExplorePage() {
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  async function runSearch(query: string) {
    setLoading(true);
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    setResults(data.results);
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/search?q=`);
      const data = await res.json();
      if (!cancelled) {
        setResults(data.results);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <div className="max-w-2xl">
        <span className="inline-block rounded-full border-2 border-ink bg-sky-tint px-3 py-1 font-mono text-xs font-bold text-sky">
          CENTRAL MARKETPLACE
        </span>
        <h1 className="mt-4 font-display text-4xl font-bold">
          Explore every vendor, in one search.
        </h1>
        <p className="mt-3 text-ink/70">
          Every product added by every vendor is indexed here automatically —
          this is what buyers and search engines see first.
        </p>
      </div>

      <div className="mt-8">
        <SearchBar onResults={runSearch} />
      </div>

      <div className="mt-8">
        {loading ? (
          <p className="font-mono text-sm text-ink/50">Loading…</p>
        ) : results.length === 0 ? (
          <p className="font-mono text-sm text-ink/50">
            No products match that search. Try a different term.
          </p>
        ) : (
          <>
            <p className="mb-4 font-mono text-xs uppercase tracking-widest text-ink/50">
              {results.length} product{results.length === 1 ? "" : "s"} found
            </p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {results.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
