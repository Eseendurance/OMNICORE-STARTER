"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  Store,
  LogOut,
} from "lucide-react";
import { signOut } from "@/app/auth-actions";

const toneBg: Record<string, string> = {
  marigold: "bg-marigold",
  jade: "bg-jade",
  coral: "bg-coral",
  sky: "bg-sky",
};

const links = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/products", label: "Products", icon: Package },
  { href: "/dashboard/orders", label: "Orders", icon: ClipboardList },
];

export default function DashboardSidebar({
  vendorName,
  vendorSlug,
  vendorColor,
}: {
  vendorName: string;
  vendorSlug: string;
  vendorColor: string;
}) {
  const pathname = usePathname();

  return (
    <motion.aside
      initial={{ x: -12, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex w-full shrink-0 flex-col border-b-2 border-ink bg-white sm:h-[calc(100vh-1px)] sm:w-64 sm:border-b-0 sm:border-r-2 sm:sticky sm:top-0"
    >
      <div className="flex items-center gap-3 border-b-2 border-ink p-5">
        <motion.span
          initial={{ scale: 0, rotate: -8 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 15, delay: 0.1 }}
          className={`flex h-10 w-10 items-center justify-center rounded-lg border-2 border-ink font-display font-bold ${toneBg[vendorColor] ?? "bg-marigold"}`}
        >
          {vendorName.charAt(0).toUpperCase()}
        </motion.span>
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-bold">{vendorName}</p>
          <p className="truncate font-mono text-[11px] text-ink/50">/{vendorSlug}</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {links.map((l, i) => {
          const Icon = l.icon;
          const active = pathname === l.href;
          return (
            <motion.div
              key={l.href}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i + 0.1, duration: 0.3 }}
              className="relative"
            >
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  className="absolute inset-0 rounded-lg border-2 border-ink bg-marigold shadow-[3px_3px_0_0_#14171F]"
                />
              )}
              <Link
                href={l.href}
                className={`relative z-10 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                  active ? "text-ink" : "text-ink/70 hover:bg-paper"
                }`}
              >
                <Icon size={18} strokeWidth={2.25} />
                {l.label}
              </Link>
            </motion.div>
          );
        })}

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <Link
            href={`/store/${vendorSlug}`}
            target="_blank"
            className="mt-2 flex items-center gap-3 rounded-lg border-2 border-ink bg-jade-tint px-3 py-2.5 text-sm font-semibold text-jade transition hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_#14171F]"
          >
            <Store size={18} strokeWidth={2.25} />
            View storefront ↗
          </Link>
        </motion.div>
      </nav>

      <form action={signOut} className="border-t-2 border-ink p-3">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-ink/60 transition hover:bg-coral-tint hover:text-coral">
          <LogOut size={18} strokeWidth={2.25} />
          Sign out
        </button>
      </form>
    </motion.aside>
  );
}
