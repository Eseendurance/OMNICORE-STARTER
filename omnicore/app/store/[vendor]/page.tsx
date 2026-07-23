import { notFound } from "next/navigation";
import Link from "next/link";
import { getProductsForVendor, getVendor, vendors } from "@/lib/data";
import ProductCard from "@/components/ProductCard";
import Countdown from "@/components/Countdown";

export function generateStaticParams() {
  return vendors.map((v) => ({ vendor: v.slug }));
}

export default async function StorePage({
  params,
}: {
  params: Promise<{ vendor: string }>;
}) {
  const { vendor: slug } = await params;
  const vendor = getVendor(slug);
  if (!vendor) notFound();

  const items = getProductsForVendor(slug);
  const toneBg: Record<string, string> = {
    marigold: "bg-marigold",
    jade: "bg-jade",
    coral: "bg-coral",
    sky: "bg-sky",
  };

  return (
    <div>
      <div className={`${toneBg[vendor.color]} border-b-2 border-ink`}>
        <div className="mx-auto max-w-6xl px-5 py-10">
          <p className="font-mono text-xs uppercase tracking-widest text-ink/70">
            {vendor.location} · {vendor.followers.toLocaleString()} followers
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold">{vendor.name}</h1>
          <p className="mt-1 text-ink/80">{vendor.tagline}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="rounded-full border-2 border-ink bg-white px-3 py-1 font-mono text-xs font-bold">
              ★ {vendor.rating.toFixed(1)} rating
            </span>
            <Countdown />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">In stock now ({items.length})</h2>
          <Link href="/explore" className="font-body text-sm font-bold text-sky hover:underline">
            ← Back to marketplace
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>

        <div className="mt-10 rounded-xl border-2 border-ink bg-sky-tint p-5">
          <p className="font-mono text-xs font-bold uppercase text-sky">Shipping options</p>
          <p className="mt-2 text-sm text-ink/80">
            This vendor ships via automated courier for intra-city orders,
            and self-managed motor park waybill for interstate cargo. You’ll
            choose at checkout, and get SMS/WhatsApp updates either way.
          </p>
        </div>
      </div>
    </div>
  );
}
