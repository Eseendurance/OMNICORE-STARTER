type Entry = {
  code: string;
  label: string;
  tone?: "marigold" | "jade" | "coral" | "sky";
};

const toneBg: Record<string, string> = {
  marigold: "bg-marigold text-ink",
  jade: "bg-jade text-paper",
  coral: "bg-coral text-paper",
  sky: "bg-sky text-paper",
};

export default function ManifestBoard({ entries }: { entries: Entry[] }) {
  const loop = [...entries, ...entries];
  return (
    <div className="overflow-hidden border-y-2 border-ink bg-ink py-2.5">
      <div className="marquee-track">
        {loop.map((e, i) => (
          <div
            key={i}
            className="manifest mx-3 flex shrink-0 items-center gap-2 text-xs"
          >
            <span
              className={`rounded px-2 py-1 font-semibold ${toneBg[e.tone ?? "marigold"]}`}
            >
              {e.code}
            </span>
            <span className="text-paper/90">{e.label}</span>
            <span aria-hidden className="text-paper/30">{"////"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
