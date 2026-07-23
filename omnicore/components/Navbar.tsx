import Link from "next/link";

const links = [
  { href: "/explore", label: "Explore" },
  { href: "/reels", label: "Reels" },
  { href: "/#pricing", label: "Pricing" },
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b-2 border-ink bg-paper">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link href="/" className="flex items-center gap-2 font-display text-xl font-bold">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-ink font-mono text-sm font-semibold text-marigold">
            OC
          </span>
          <span className="font-display font-bold">OmniCore</span>
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
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/explore"
            className="hidden font-body text-sm font-semibold text-ink/80 hover:text-ink sm:block"
          >
            Sign in
          </Link>
          <Link
            href="/#get-started"
            className="rounded-md border-2 border-ink bg-marigold px-4 py-2 font-body text-sm font-bold text-ink shadow-[3px_3px_0_0_#14171F] transition hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_#14171F]"
          >
            Start selling
          </Link>
        </div>
      </div>
    </header>
  );
}
