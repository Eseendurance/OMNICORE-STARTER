export function LiveProof({
  viewers,
  soldToday,
}: {
  viewers: number;
  soldToday: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] font-semibold">
      <span className="inline-flex items-center gap-1 rounded-full bg-coral-tint px-2.5 py-1 text-coral">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-coral" />
        {viewers} viewing now
      </span>
      <span className="inline-flex items-center gap-1 rounded-full bg-jade-tint px-2.5 py-1 text-jade">
        {soldToday} sold today
      </span>
    </div>
  );
}

export function StockBar({ stockLeft, total = 50 }: { stockLeft: number; total?: number }) {
  const pct = Math.max(6, Math.min(100, Math.round((stockLeft / total) * 100)));
  const urgent = stockLeft <= 8;
  return (
    <div className="mt-2">
      <div className="h-2 w-full overflow-hidden rounded-full bg-ink/10">
        <div
          className={`h-full rounded-full ${urgent ? "bg-coral" : "bg-jade"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className={`mt-1 font-mono text-[11px] font-semibold ${urgent ? "text-coral" : "text-ink/60"}`}>
        {urgent ? `Only ${stockLeft} left` : `${stockLeft} in stock`}
      </p>
    </div>
  );
}
