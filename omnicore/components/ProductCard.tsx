import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/data";
import { getVendor } from "@/lib/data";
import { LiveProof, StockBar } from "@/components/LiveProof";
import WhatsAppButton from "@/components/WhatsAppButton";

const naira = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

export default function ProductCard({ product }: { product: Product }) {
  const vendor = getVendor(product.vendorSlug);
  const discount =
    product.compareAt && product.compareAt > product.price
      ? Math.round(100 - (product.price / product.compareAt) * 100)
      : null;

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border-2 border-ink bg-white shadow-[4px_4px_0_0_#14171F] transition hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#14171F]">
      <div className="relative aspect-square w-full overflow-hidden bg-ink/5">
        <Image
          src={product.image}
          alt={product.title}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover transition duration-300 group-hover:scale-105"
        />
        {discount && (
          <span className="absolute left-2 top-2 rounded bg-coral px-2 py-1 font-mono text-[11px] font-bold text-paper">
            -{discount}%
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        {vendor && (
          <Link
            href={`/store/${vendor.slug}`}
            className="font-mono text-[11px] font-semibold uppercase tracking-wide text-sky hover:underline"
          >
            {vendor.name}
          </Link>
        )}
        <h3 className="font-display text-sm font-bold leading-snug">{product.title}</h3>
        <div className="flex items-baseline gap-2">
          <span className="font-display text-lg font-bold">{naira.format(product.price)}</span>
          {product.compareAt && (
            <span className="font-mono text-xs text-ink/40 line-through">
              {naira.format(product.compareAt)}
            </span>
          )}
        </div>
        <LiveProof viewers={product.liveViewers} soldToday={product.soldToday} />
        <StockBar stockLeft={product.stockLeft} />
        {vendor && (
          <WhatsAppButton
            phone={vendor.whatsapp}
            item={{ title: product.title, price: product.price, vendorName: vendor.name }}
            className="mt-1 w-full"
          />
        )}
      </div>
    </div>
  );
}
