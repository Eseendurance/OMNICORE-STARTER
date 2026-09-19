// lib/whatsapp.ts
// Builds a wa.me deep link pre-filled with an order message.
// No API key required — wa.me links work for any WhatsApp number.

export type WhatsAppOrderItem = {
  title: string;
  price: number;
  vendorName: string;
  /** Optional canonical link back to the product/store, included in the message */
  url?: string;
};

const naira = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

/**
 * @param phone Vendor WhatsApp number, any format (spaces/dashes/+ all stripped).
 *              Must include country code, e.g. "+2348012345678".
 */
export function buildWhatsAppOrderLink(phone: string, item: WhatsAppOrderItem): string {
  const cleanPhone = phone.replace(/[^\d]/g, ""); // wa.me needs digits only, no "+"

  const lines = [
    `Hi ${item.vendorName}, I'd like to order:`,
    `• ${item.title} — ${naira.format(item.price)}`,
    item.url ? `Link: ${item.url}` : null,
    `(sent via KiVo)`,
  ].filter(Boolean) as string[];

  const message = encodeURIComponent(lines.join("\n"));
  return `https://wa.me/${cleanPhone}?text=${message}`;
}
