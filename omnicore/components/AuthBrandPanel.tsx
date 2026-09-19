"use client";

import { motion } from "motion/react";
import BrandLogo from "@/components/BrandLogo";

const toneMap = {
  sky: { bg: "bg-sky-tint", chip: "bg-sky", text: "text-sky" },
  jade: { bg: "bg-jade-tint", chip: "bg-jade", text: "text-jade" },
  coral: { bg: "bg-coral-tint", chip: "bg-coral", text: "text-coral" },
  marigold: { bg: "bg-marigold/20", chip: "bg-marigold", text: "text-marigold-ink" },
} as const;

export default function AuthBrandPanel({
  eyebrow,
  heading,
  tone = "marigold",
}: {
  eyebrow: string;
  heading: string;
  tone?: keyof typeof toneMap;
}) {
  const t = toneMap[tone];

  return (
    <div className={`relative hidden flex-1 overflow-hidden border-r-2 border-ink ${t.bg} sm:flex sm:flex-col sm:justify-between sm:p-10`}>
      {/* floating shapes for motion, all bright brand colors */}
      <motion.div
        aria-hidden
        className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-marigold/60"
        animate={{ y: [0, 16, 0], rotate: [0, 8, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute bottom-16 -left-8 h-28 w-28 rounded-2xl bg-coral/50"
        animate={{ y: [0, -14, 0], rotate: [0, -6, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />
      <motion.div
        aria-hidden
        className="absolute right-16 top-1/2 h-16 w-16 -translate-y-1/2 rounded-full bg-jade/50"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
      />

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex items-center gap-2 font-display text-lg font-bold"
      >
        <BrandLogo compact />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 max-w-sm"
      >
        <span className={`inline-block rounded-full border-2 border-ink px-3 py-1 font-mono text-xs font-bold ${t.chip} text-ink`}>
          {eyebrow}
        </span>
        <h2 className="mt-4 font-display text-3xl font-bold leading-tight">{heading}</h2>
        <p className="mt-3 text-sm text-ink/70">
          Storefront, marketplace listing, live-proof widgets, and motor-park
          waybill dispatch — one dashboard.
        </p>
      </motion.div>
    </div>
  );
}
