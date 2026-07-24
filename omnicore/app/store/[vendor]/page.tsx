import { notFound } from "next/navigation";
import Link from "next/link";
import { getVendorBySlug, getProductsForVendor } from "@/lib/catalog";
import type { CatalogProduct } from "@/lib/catalog";
import ProductCard from "@/components/ProductCard";
import Countdown from "@/components/Countdown";

// Vendors are created dynamically at runtime (real signups), so this route
// can't be statically generated at build time — it renders on demand.
export const dynamic = "force-dynamic";

const toneBg: Record<string, string> = {
  marigold: "bg-marigold",
  jade: "bg-jade",
  coral: "bg-coral",
  sky: "bg-sky",
};

export default async function StorePage({
  params,
}: {
  params: Promise<{ vendor: string }>;
}) {
  const { vendor: slug } = await params;
  const vendor = await getVendorBySlug(slug);
  if (!vendor) notFound();

  const rawProducts = await getProductsForVendor(vendor.id);
  const items: CatalogProduct[] = rawProducts.map((p) => ({
    ...p,
    vendor: { slug: vendor.slug, name: vendor.name, whatsapp: vendor.whatsapp, color: vendor.color },
  }));

  return (
    <div>
      <div className={`${toneBg[vendor.color]} border-b-2 border-ink`}>
        <div className="mx-auto max-w-6xl px-5 py-10">
          <p className="font-mono text-xs uppercase tracking-widest text-ink/70">
            {vendor.location ?? "Nigeria"} · {vendor.followers.toLocaleString()} followers
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold">{vendor.name}</h1>
          {vendor.tagline && <p className="mt-1 text-ink/80">{vendor.tagline}</p>}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="rounded-full border-2 border-ink bg-white px-3 py-1 font-mono text-xs font-bold">
              ★ {vendor.rating.toFixed(1)} rating
            </span>
            {items.length > 0 && <Countdown />}
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

        {items.length === 0 ? (
          <p className="mt-6 rounded-lg border-2 border-dashed border-ink/30 p-8 text-center text-sm text-ink/50">
            This vendor hasn&apos;t listed any products yet.
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

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
