import Link from "next/link";
import Image from "next/image";
import ManifestBoard from "@/components/ManifestBoard";
import { products, vendors } from "@/lib/data";

const manifestEntries = [
  { code: "RTE-01", label: "Aba → Lagos, courier dispatched", tone: "sky" as const },
  { code: "WVB-14", label: "Onitsha park waybill, 40kg cargo booked", tone: "marigold" as const },
  { code: "LIVE", label: "22 people viewing Lagos Fit Studio right now", tone: "coral" as const },
  { code: "PAID", label: "Order #8823 confirmed, ₦28,500", tone: "jade" as const },
];

const steps = [
  {
    n: "Set up your store",
    d: "Add products, prices, and photos. OmniCore generates your storefront and search listing automatically.",
  },
  {
    n: "Get discovered",
    d: "Every product is indexed into the central Explore marketplace and submitted to Google Shopping — no ad spend required.",
  },
  {
    n: "Ship it, your way",
    d: "Quote a courier API in one click, or hand it to the motor park and log the waybill yourself. Buyers get SMS/WhatsApp updates either way.",
  },
];

export default function Home() {
  return (
    <div>
      <ManifestBoard entries={manifestEntries} />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
        <div className="grid gap-10 sm:grid-cols-[1.1fr_0.9fr] sm:items-center">
          <div>
            <span className="inline-block rounded-full border-2 border-ink bg-marigold px-3 py-1 font-mono text-xs font-bold text-ink">
              BUILT FOR NIGERIAN VENDORS
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold leading-[1.05] sm:text-6xl">
              Your store.
              <br />
              <span className="text-coral">Real buyers.</span>
              <br />
              Shipped the way you already ship.
            </h1>
            <p className="mt-5 max-w-md text-lg text-ink/70">
              OmniCore AI gives you a storefront, a place in the central
              marketplace, live proof that people are actually watching, and
              a logistics desk that understands both courier APIs and motor
              park waybills.
            </p>
            <div id="get-started" className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/explore"
                className="rounded-md border-2 border-ink bg-marigold px-6 py-3 font-body font-bold text-ink shadow-[4px_4px_0_0_#14171F] transition hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_#14171F]"
              >
                Start selling — it&apos;s free
              </Link>
              <Link
                href="/store/adaeze-leather"
                className="rounded-md border-2 border-ink bg-white px-6 py-3 font-body font-bold text-ink transition hover:bg-ink hover:text-paper"
              >
                Watch how it works
              </Link>
            </div>
          </div>
          <div className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-2xl border-2 border-ink shadow-[8px_8px_0_0_#14171F]">
            <Image
              src="https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=700"
              alt="Vendor packing an order for dispatch"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute bottom-3 left-3 right-3 rounded-lg border-2 border-ink bg-white/95 p-3 backdrop-blur">
              <p className="font-mono text-[11px] font-bold text-coral">● LIVE</p>
              <p className="font-display text-sm font-bold">14 people viewing this product</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted vendors strip */}
      <section className="border-y-2 border-ink bg-white py-10">
        <div className="mx-auto max-w-6xl px-5">
          <p className="font-mono text-xs uppercase tracking-widest text-ink/50">
            Already shipping on OmniCore
          </p>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {vendors.map((v) => (
              <Link
                key={v.slug}
                href={`/store/${v.slug}`}
                className="rounded-lg border-2 border-ink px-3 py-4 text-center transition hover:-translate-y-0.5 hover:bg-marigold/20"
              >
                <p className="font-display text-sm font-bold">{v.name}</p>
                <p className="mt-1 font-mono text-[11px] text-ink/50">{v.location}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="font-display text-3xl font-bold">Three moves to your first sale</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {steps.map((s, i) => (
            <div
              key={s.n}
              className="rounded-xl border-2 border-ink bg-white p-5 shadow-[4px_4px_0_0_#14171F]"
            >
              <span className="font-mono text-xs font-bold text-sky">STEP {i + 1}</span>
              <h3 className="mt-2 font-display text-lg font-bold">{s.n}</h3>
              <p className="mt-2 text-sm text-ink/70">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Live marketplace preview */}
      <section className="bg-jade-tint py-16">
        <div className="mx-auto max-w-6xl px-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-3xl font-bold">Selling right now</h2>
              <p className="mt-1 text-ink/70">A live slice of the Explore marketplace.</p>
            </div>
            <Link href="/explore" className="font-body font-bold text-sky hover:underline">
              Browse the full marketplace →
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {products.slice(0, 4).map((p) => (
              <Link
                key={p.id}
                href={`/store/${p.vendorSlug}`}
                className="rounded-xl border-2 border-ink bg-white p-3 shadow-[3px_3px_0_0_#14171F] transition hover:-translate-y-0.5"
              >
                <div className="relative aspect-square overflow-hidden rounded-lg">
                  <Image src={p.image} alt={p.title} fill className="object-cover" />
                </div>
                <p className="mt-2 truncate font-display text-sm font-bold">{p.title}</p>
                <p className="font-mono text-xs text-coral">{p.liveViewers} viewing now</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="font-display text-3xl font-bold">Simple pricing</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {[
            { name: "Starter", price: "Free", d: "Up to 20 products, Explore listing, WhatsApp checkout.", tone: "sky" },
            { name: "Growth", price: "₦7,500/mo", d: "Unlimited products, live-proof widgets, Reels uploads.", tone: "marigold", featured: true },
            { name: "Scale", price: "₦22,000/mo", d: "Courier API automation, priority support, team seats.", tone: "coral" },
          ].map((p) => (
            <div
              key={p.name}
              className={`rounded-xl border-2 border-ink p-6 ${p.featured ? "bg-marigold shadow-[6px_6px_0_0_#14171F]" : "bg-white shadow-[4px_4px_0_0_#14171F]"}`}
            >
              <h3 className="font-display text-lg font-bold">{p.name}</h3>
              <p className="mt-2 font-display text-3xl font-bold">{p.price}</p>
              <p className="mt-3 text-sm text-ink/70">{p.d}</p>
              <Link
                href="/explore"
                className="mt-5 block rounded-md border-2 border-ink bg-ink px-4 py-2 text-center font-body font-bold text-paper transition hover:bg-ink/80"
              >
                Choose {p.name}
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
