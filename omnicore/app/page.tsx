import Link from "next/link";
import Image from "next/image";
import { getVendors, getFeaturedProducts } from "@/lib/catalog";

export const dynamic = "force-dynamic";

const steps = [
  {
    n: "Set up your store",
    d: "For brands, boutique owners, and creators, KiVo turns product photos, pricing, and storefront content into a compelling online presence in minutes.",
  },
  {
    n: "Get discovered",
    d: "Reach buyers through a central marketplace, trend visibility, and search-driven discovery built for business growth, local demand, and repeat sales.",
  },
  {
    n: "Ship it, your way",
    d: "Manage courier dispatch, waybill tracking, and buyer updates from one dashboard built for businesses that need trust, speed, and operational clarity.",
  },
];

const targetAudiences = [
  "Small business owners",
  "Fashion, beauty, and retail brands",
  "Creators and influencers",
  "Local vendors and resellers",
  "Service-based and lifestyle businesses",
];

const marketSignals = [
  {
    title: "Brand-first commerce",
    text: "Businesses want a platform that blends storefronts, discovery, and social proof into one trusted buying journey.",
  },
  {
    title: "Trust-driven conversion",
    text: "Buyers are more likely to purchase from brands with verified storefronts, customer activity, and clear delivery visibility.",
  },
  {
    title: "Creator-led growth",
    text: "Creators and micro-brands need a way to monetise communities without managing a fragmented stack of tools.",
  },
];

const trustPillars = [
  {
    title: "Merchant identity",
    text: "Verified vendor profiles, follower relationships, and visible business information help buyers know who they are dealing with.",
  },
  {
    title: "Traceable operations",
    text: "Payment initialization, order events, dispatch updates, and waybill workflows create a clearer record from checkout to delivery.",
  },
  {
    title: "Built to compound",
    text: "KiVo connects discovery, content, storefronts, and logistics so every customer interaction can strengthen the next sale.",
  },
];

export default async function Home() {
  const [vendors, products] = await Promise.all([getVendors(), getFeaturedProducts(4)]);

  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
        <div className="grid gap-10 sm:grid-cols-[1.1fr_0.9fr] sm:items-center">
          <div>
            <h1 className="font-display text-4xl font-bold leading-[1.05] sm:text-6xl">
              Sell your brand.
              <br />
              <span className="text-coral">Grow your audience.</span>
              <br />
              Win more customers.
            </h1>
            <p className="mt-5 max-w-md text-lg text-ink/70">
              KiVo gives founders, creators, and retailers a social-commerce platform to showcase products, attract buyers, build trust, and turn attention into repeat business.
            </p>
            <div id="get-started" className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="rounded-md border-2 border-ink bg-marigold px-6 py-3 font-body font-bold text-ink shadow-[4px_4px_0_0_#14171F] transition hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_#14171F]"
              >
                Start selling — it&apos;s free
              </Link>
              <Link
                href="/explore"
                className="rounded-md border-2 border-ink bg-white px-6 py-3 font-body font-bold text-ink transition hover:bg-ink hover:text-paper"
              >
                Browse the marketplace
              </Link>
            </div>
          </div>
          <div className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-2xl border-2 border-ink shadow-[8px_8px_0_0_#14171F]">
            <Image
              src="/kivo-hero.jpg"
              alt="KiVo merchant serving a customer"
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

      {/* Target audience and market positioning */}
      <section className="border-y-2 border-ink bg-white py-16">
        <div className="mx-auto max-w-6xl px-5">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-ink/50">Target audience</p>
              <h2 className="mt-3 font-display text-3xl font-bold">Built for brands and founders ready to grow online</h2>
              <div className="mt-5 flex flex-wrap gap-2">
                {targetAudiences.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border-2 border-ink bg-sky/10 px-3 py-1.5 text-sm font-semibold text-ink"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border-2 border-ink bg-paper p-5 shadow-[5px_5px_0_0_#14171F]">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-coral">Branding + market research</p>
              <p className="mt-4 text-sm leading-7 text-ink/75">
                KiVo is designed for ambitious businesses that want a clear brand story, better customer discovery, and a platform that supports direct sales, trust-building, and live buyer engagement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Vendor strip — real, empty until real vendors sign up */}
      <section className="border-b-2 border-ink bg-white py-10">
        <div className="mx-auto max-w-6xl px-5">
          <p className="font-mono text-xs uppercase tracking-widest text-ink/50">
            {vendors.length > 0 ? "Already shipping on KiVo" : "Be the first vendor on KiVo"}
          </p>
          {vendors.length === 0 ? (
            <Link
              href="/signup"
              className="mt-4 inline-block rounded-md border-2 border-ink bg-marigold px-4 py-2 text-sm font-bold shadow-[3px_3px_0_0_#14171F] transition hover:-translate-y-0.5"
            >
              Claim your storefront
            </Link>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {vendors.slice(0, 8).map((v) => (
                <Link
                  key={v.slug}
                  href={`/store/${v.slug}`}
                  className="rounded-lg border-2 border-ink px-3 py-4 text-center transition hover:-translate-y-0.5 hover:bg-marigold/20"
                >
                  <p className="font-display text-sm font-bold">{v.name}</p>
                  <p className="mt-1 font-mono text-[11px] text-ink/50">{v.location ?? "Nigeria"}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Market signals */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="font-display text-3xl font-bold">Where the opportunity is</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {marketSignals.map((signal) => (
            <div
              key={signal.title}
              className="rounded-xl border-2 border-ink bg-white p-5 shadow-[4px_4px_0_0_#14171F]"
            >
              <span className="font-mono text-xs font-bold text-sky">MARKET SIGNAL</span>
              <h3 className="mt-2 font-display text-lg font-bold">{signal.title}</h3>
              <p className="mt-2 text-sm text-ink/70">{signal.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust and investor positioning */}
      <section className="border-y-2 border-ink bg-sky/10 py-16">
        <div className="mx-auto max-w-6xl px-5">
          <div className="max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-widest text-coral">Trust is the product</p>
            <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
              A stronger operating layer for modern commerce
            </h2>
            <p className="mt-4 text-ink/70">
              KiVo is positioned to become more than a storefront builder: it is a connected growth layer for businesses that need customer discovery, social proof, payments, and delivery visibility in one place.
            </p>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {trustPillars.map((pillar) => (
              <div key={pillar.title} className="rounded-xl border-2 border-ink bg-white p-5 shadow-[4px_4px_0_0_#14171F]">
                <h3 className="font-display text-lg font-bold">{pillar.title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink/70">{pillar.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border-2 border-ink bg-white p-5">
            <div>
              <p className="font-display font-bold">For investors and strategic partners</p>
              <p className="mt-1 text-sm text-ink/65">Help more businesses formalise, grow, and serve customers with confidence.</p>
            </div>
            <Link href="/signup" className="rounded-md border-2 border-ink bg-marigold px-5 py-2.5 font-bold text-ink shadow-[3px_3px_0_0_#14171F] transition hover:-translate-y-0.5">
              Join the KiVo network
            </Link>
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

      {/* Live marketplace preview — real products, empty until vendors list */}
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
          {products.length === 0 ? (
            <p className="mt-8 rounded-lg border-2 border-dashed border-ink/30 bg-white p-8 text-center text-sm text-ink/50">
              No products listed yet — once vendors add inventory, it shows up here automatically.
            </p>
          ) : (
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {products.map((p) => (
                <Link
                  key={p.id}
                  href={`/store/${p.vendor.slug}`}
                  className="rounded-xl border-2 border-ink bg-white p-3 shadow-[3px_3px_0_0_#14171F] transition hover:-translate-y-0.5"
                >
                  <div className="relative aspect-square overflow-hidden rounded-lg">
                    <Image src={p.image_url} alt={p.title} fill className="object-cover" />
                  </div>
                  <p className="mt-2 truncate font-display text-sm font-bold">{p.title}</p>
                  <p className="font-mono text-xs text-coral">{p.live_viewers} viewing now</p>
                </Link>
              ))}
            </div>
          )}
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
                href="/signup"
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
