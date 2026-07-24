import Image from "next/image";
import Link from "next/link";
import type { CatalogReel } from "@/lib/catalog";
import WhatsAppButton from "@/components/WhatsAppButton";

export default function ReelCard({ reel }: { reel: CatalogReel }) {
  const vendor = reel.vendor;
  const product = reel.product;

  return (
    <div className="relative flex h-[calc(100vh-8rem)] min-h-[520px] w-full snap-start items-end overflow-hidden rounded-2xl border-2 border-ink bg-ink">
      <Image
        src={reel.poster_url}
        alt={reel.caption}
        fill
        className="object-cover opacity-90"
        sizes="(max-width: 768px) 100vw, 420px"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/10 to-transparent" />

      {reel.is_live && (
        <span className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full border-2 border-paper bg-coral px-3 py-1 font-mono text-xs font-bold text-paper">
          <span className="h-1.5 w-1.5 rounded-full bg-paper" />
          LIVE
        </span>
      )}

      {/* right-side action rail, TikTok-style */}
      <div className="absolute bottom-24 right-3 flex flex-col items-center gap-5">
        <button className="flex flex-col items-center gap-1 text-paper" aria-label="Like">
          <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-paper bg-coral">♥</span>
          <span className="font-mono text-[11px] font-semibold">{reel.likes.toLocaleString()}</span>
        </button>
        {vendor && (
          <Link
            href={`/store/${vendor.slug}`}
            className="flex flex-col items-center gap-1 text-paper"
            aria-label="Visit store"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-paper bg-marigold text-ink">🛍</span>
            <span className="font-mono text-[11px] font-semibold">Shop</span>
          </Link>
        )}
        <button className="flex flex-col items-center gap-1 text-paper" aria-label="Share">
          <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-paper bg-sky">↗</span>
          <span className="font-mono text-[11px] font-semibold">Share</span>
        </button>
        {vendor && product && (
          <WhatsAppButton
            phone={vendor.whatsapp}
            item={{ title: product.title, price: product.price, vendorName: vendor.name }}
            variant="compact"
          />
        )}
      </div>

      <div className="relative z-10 max-w-[75%] p-5 text-paper">
        {vendor && (
          <Link href={`/store/${vendor.slug}`} className="font-display text-sm font-bold hover:underline">
            @{vendor.slug}
          </Link>
        )}
        <p className="mt-1 text-sm text-paper/90">{reel.caption}</p>
      </div>
    </div>
  );
}
