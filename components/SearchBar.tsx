"use client";

import { useState } from "react";

export default function SearchBar({
  onResults,
}: {
  onResults: (query: string) => void;
}) {
  const [value, setValue] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onResults(value);
      }}
      className="flex w-full max-w-xl items-center gap-2"
    >
      <input
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          onResults(e.target.value);
        }}
        placeholder="Search products, vendors, categories…"
        className="w-full rounded-md border-2 border-ink bg-white px-4 py-3 font-body text-sm placeholder:text-ink/40 focus:outline-none focus:ring-4 focus:ring-marigold/40"
      />
      <button
        type="submit"
        className="shrink-0 rounded-md border-2 border-ink bg-sky px-4 py-3 font-body text-sm font-bold text-paper shadow-[3px_3px_0_0_#1E3A8A] transition hover:-translate-y-0.5"
      >
        Search
      </button>
    </form>
  );
}
