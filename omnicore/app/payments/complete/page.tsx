import { redirect } from "next/navigation";
import PaymentStatus from "@/components/PaymentStatus";

export const dynamic = "force-dynamic";
export const metadata = { title: "Payment status — Kivo" };

export default async function PaymentCompletePage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string; trxref?: string }>;
}) {
  const params = await searchParams;
  const reference = params.reference ?? params.trxref;
  if (!reference || !/^[A-Za-z0-9-]{8,100}$/.test(reference)) redirect("/community");
  return <PaymentStatus reference={reference} />;
}
