import Link from "next/link";
import { BadgeCheck, MapPin } from "lucide-react";

type ProfileCardProps = {
  vendor: {
    name: string;
    slug: string;
    location?: string | null;
    is_verified?: boolean | null;
  };
  compact?: boolean;
};

export default function ProfileCard({ vendor, compact = false }: ProfileCardProps) {
  return (
    <Link
      href={`/store/${vendor.slug}`}
      className={`group flex items-center gap-3 ${compact ? "" : "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"}`}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-display font-bold text-blue-800">
        {vendor.name.charAt(0).toUpperCase()}
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-1 font-semibold text-slate-900 group-hover:text-blue-700">
          <span className="truncate">{vendor.name}</span>
          {vendor.is_verified && <BadgeCheck size={15} className="shrink-0 text-blue-600" aria-label="Verified vendor" />}
        </span>
        {vendor.location && (
          <span className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
            <MapPin size={12} /> {vendor.location}
          </span>
        )}
      </span>
    </Link>
  );
}
