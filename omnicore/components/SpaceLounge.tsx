import Link from "next/link";
import { Headphones, Users } from "lucide-react";

type Space = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  is_live: boolean;
};

export default function SpaceLounge({ spaces }: { spaces: Space[] }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-blue-600">Vendor spaces</p>
          <h2 className="mt-1 font-display text-xl font-bold text-slate-950">Talk shop. Ship better.</h2>
        </div>
        <Headphones className="text-blue-600" size={20} />
      </div>
      <p className="mt-2 text-sm text-slate-600">Drop into a focused lounge for a category or route. No random feeds.</p>
      <div className="mt-4 space-y-3">
        {spaces.length === 0 ? (
          <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">The first lounge opens when vendors create one.</p>
        ) : spaces.map((space) => (
          <Link key={space.id} href={`/community/spaces/${space.id}`} className="flex items-center justify-between rounded-xl border border-slate-200 p-3 transition hover:border-blue-300 hover:bg-blue-50">
            <span>
              <span className="block font-semibold text-slate-900">{space.name}</span>
              <span className="block text-xs text-slate-500">{space.category} · {space.description ?? "Open vendor conversation"}</span>
            </span>
            <span className="flex items-center gap-1 text-xs font-semibold text-blue-700">
              {space.is_live ? <><span className="h-2 w-2 rounded-full bg-red-500" /> Live</> : <><Users size={14} /> Join</>}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
