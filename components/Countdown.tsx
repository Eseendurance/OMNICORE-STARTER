"use client";

import { useEffect, useState } from "react";

// Counts down to the next midnight, local to the browser — a stand-in for a
// vendor-configured flash-sale end time.
export default function Countdown() {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const end = new Date(now);
      end.setHours(24, 0, 0, 0);
      setRemaining(Math.max(0, end.getTime() - now.getTime()));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (remaining === null) return null;

  const h = String(Math.floor(remaining / 3_600_000)).padStart(2, "0");
  const m = String(Math.floor((remaining % 3_600_000) / 60_000)).padStart(2, "0");
  const s = String(Math.floor((remaining % 60_000) / 1000)).padStart(2, "0");

  return (
    <div className="inline-flex items-center gap-1.5 rounded-md border-2 border-ink bg-coral px-3 py-1.5 font-mono text-sm font-bold text-paper">
      <span>Sale ends in</span>
      <span className="rounded bg-ink px-1.5 py-0.5">{h}:{m}:{s}</span>
    </div>
  );
}
