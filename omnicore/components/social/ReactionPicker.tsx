"use client";

import { useState } from "react";

const REACTIONS = [
  { type: "LIKE", symbol: "❤️", label: "Love" },
  { type: "FIRE", symbol: "🔥", label: "Fire" },
  { type: "LAUGH", symbol: "😂", label: "Haha" },
  { type: "ROCKET", symbol: "🚀", label: "Rocket" },
  { type: "IDEA", symbol: "💡", label: "Idea" },
] as const;

type Reaction = (typeof REACTIONS)[number]["type"];

export default function ReactionPicker({
  postId,
  initialCounts = {},
}: {
  postId: string;
  initialCounts?: Partial<Record<Reaction, number>>;
}) {
  const [counts, setCounts] = useState(initialCounts);
  const [active, setActive] = useState<Reaction | null>(null);
  const [pending, setPending] = useState(false);

  async function toggleReaction(type: Reaction) {
    if (pending) return;
    const wasActive = active === type;
    setPending(true);
    setActive(wasActive ? null : type);
    setCounts((current) => ({
      ...current,
      [type]: Math.max(0, (current[type] ?? 0) + (wasActive ? -1 : 1)),
    }));

    try {
      const response = await fetch(`/api/feed/${postId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reaction: type }),
      });
      if (!response.ok) throw new Error("Reaction request failed");
    } catch {
      setActive(active);
      setCounts(initialCounts);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5" aria-label="Post reactions">
      {REACTIONS.map((reaction) => (
        <button
          key={reaction.type}
          type="button"
          title={reaction.label}
          disabled={pending}
          onClick={() => toggleReaction(reaction.type)}
          className={`rounded-full border px-2.5 py-1 text-xs transition ${
            active === reaction.type
              ? "border-sky bg-sky-tint text-sky"
              : "border-sky/20 bg-white text-ink/70 hover:border-sky/50"
          }`}
        >
          {reaction.symbol} {counts[reaction.type] ? counts[reaction.type] : ""}
        </button>
      ))}
    </div>
  );
}
