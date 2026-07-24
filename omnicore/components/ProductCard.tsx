import Image from "next/image";
import Link from "next/link";
import type { CatalogProduct } from "@/lib/catalog";
import { LiveProof, StockBar } from "@/components/LiveProof";
import WhatsAppButton from "@/components/WhatsAppButton";

const naira = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

export default function ProductCard({ product }: { product: CatalogProduct }) {
  const vendor = product.vendor;
  const discount =
    product.compare_at && product.compare_at > product.price
      ? Math.round(100 - (product.price / product.compare_at) * 100)
      : null;

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border-2 border-ink bg-white shadow-[4px_4px_0_0_#14171F] transition hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#14171F]">
      <div className="relative aspect-square w-full overflow-hidden bg-ink/5">
        <Image
          src={product.image_url}
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
          {product.compare_at && (
            <span className="font-mono text-xs text-ink/40 line-through">
              {naira.format(product.compare_at)}
            </span>
          )}
        </div>
        <LiveProof viewers={product.live_viewers} soldToday={product.sold_today} />
        <StockBar stockLeft={product.stock_left} />
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
