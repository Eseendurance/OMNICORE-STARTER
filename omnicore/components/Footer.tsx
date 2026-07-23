import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t-2 border-ink bg-ink text-paper">
      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <div className="flex items-center gap-2 font-display text-lg font-bold">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-marigold font-mono text-xs font-bold text-ink">
                OC
              </span>
              OmniCore
            </div>
            <p className="mt-3 max-w-xs text-sm text-paper/70">
              The storefront, marketplace, and logistics engine built for
              vendors shipping across Nigeria.
            </p>
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-marigold">
              Platform
            </p>
            <ul className="mt-3 space-y-2 text-sm text-paper/80">
              <li><Link href="/explore" className="hover:text-marigold">Explore marketplace</Link></li>
              <li><Link href="/reels" className="hover:text-marigold">Reels & live</Link></li>
              <li><Link href="/#pricing" className="hover:text-marigold">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-marigold">
              Logistics partners
            </p>
            <ul className="mt-3 space-y-2 text-sm text-paper/80">
              <li>Terminal Africa · Topship · Sendstack</li>
              <li>Peace Mass Transit · ABC Transport</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-paper/20 pt-6 text-xs text-paper/50">
          © {new Date().getFullYear()} OmniCore AI. Built for vendors, not ad
          networks.
        </div>
      </div>
    </footer>
  );
}
