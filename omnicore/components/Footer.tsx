import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";

export default function Footer() {
  return (
    <footer className="border-t-2 border-ink bg-ink text-paper">
      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <BrandLogo compact />
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
              Logistics
            </p>
            <ul className="mt-3 space-y-2 text-sm text-paper/80">
              <li>Courier API dispatch</li>
              <li>Motor park waybill tracking</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-paper/20 pt-6 text-xs text-paper/50">
          © {new Date().getFullYear()} KiVo. Built for vendors, not ad
          networks.
          <span className="ml-2 text-sky">Powered by BRIEF GROUP</span>
        </div>
      </div>
    </footer>
  );
}
