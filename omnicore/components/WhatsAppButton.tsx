"use client";

// components/WhatsAppButton.tsx
import { buildWhatsAppOrderLink, type WhatsAppOrderItem } from "@/lib/whatsapp";

export default function WhatsAppButton({
  phone,
  item,
  className = "",
  variant = "default",
}: {
  phone: string;
  item: WhatsAppOrderItem;
  className?: string;
  /** "default" = full pill button. "compact" = round icon-only button for action rails. */
  variant?: "default" | "compact";
}) {
  const href = buildWhatsAppOrderLink(phone, item);

  if (variant === "compact") {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        aria-label="Order via WhatsApp"
        className={`flex flex-col items-center gap-1 text-paper ${className}`}
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-paper bg-jade text-lg">
          💬
        </span>
        <span className="font-mono text-[11px] font-semibold">Order</span>
      </a>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      // stopPropagation so the button works even when nested inside a
      // clickable card/link (ProductCard, ReelCard)
      onClick={(e) => e.stopPropagation()}
      className={`inline-flex items-center justify-center gap-1.5 rounded-md border-2 border-ink bg-jade px-3 py-2 font-mono text-xs font-semibold text-paper shadow-[3px_3px_0_0_#1E3A8A] transition hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_#1E3A8A] ${className}`}
    >
      <span aria-hidden>💬</span>
      Order via WhatsApp
    </a>
  );
}
