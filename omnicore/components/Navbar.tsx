import Link from "next/link";
import { getCurrentVendor } from "@/lib/vendor";
import { createClient } from "@/lib/supabase/server";

const links = [
  { href: "/explore", label: "Explore" },
  { href: "/reels", label: "Reels" },
  { href: "/community", label: "Community" },
  { href: "/#pricing", label: "Pricing" },
];

export default async function Navbar() {
  const [vendor, supabase] = await Promise.all([getCurrentVendor(), createClient()]);
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-50 border-b-2 border-ink bg-paper">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link href="/" className="flex items-center gap-2 font-display text-xl font-bold">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-ink font-mono text-sm font-semibold text-marigold">
            K
          </span>
          <span className="font-display font-bold">Kivo</span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="font-body text-sm font-semibold text-ink/80 transition hover:text-ink"
            >
              {l.label}
            </Link>
          ))}
          {user && <Link href="/messages" className="font-body text-sm font-semibold text-ink/80 transition hover:text-ink">Order messages</Link>}
        </nav>
        <div className="flex items-center gap-3">
          {vendor ? (
            <Link
              href="/dashboard"
              className="hidden font-body text-sm font-semibold text-ink/80 hover:text-ink sm:block"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              className="hidden font-body text-sm font-semibold text-ink/80 hover:text-ink sm:block"
            >
              Sign in
            </Link>
          )}
          <Link
            href={vendor ? "/dashboard/products/new" : "/signup"}
            className="rounded-md border-2 border-ink bg-marigold px-4 py-2 font-body text-sm font-bold text-ink shadow-[3px_3px_0_0_#1E3A8A] transition hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_#1E3A8A]"
          >
            {vendor ? "Add product" : "Start selling"}
          </Link>
        </div>
      </div>
      <nav aria-label="Mobile navigation" className="flex gap-5 overflow-x-auto border-t border-blue-100 px-5 py-3 md:hidden">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="shrink-0 text-sm font-semibold text-ink/80 hover:text-blue-700">
            {link.label}
          </Link>
        ))}
        {user && <Link href="/messages" className="shrink-0 text-sm font-semibold text-ink/80 hover:text-blue-700">Order messages</Link>}
      </nav>
    </header>
  );
}
