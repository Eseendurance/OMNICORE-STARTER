import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentVendor } from "@/lib/vendor";
import { deleteProduct } from "@/app/dashboard/(main)/products/actions";
import FadeInStagger, { FadeInItem } from "@/components/motion/FadeInStagger";

export default async function ProductsPage() {
  const vendor = await getCurrentVendor();
  if (!vendor) return null;

  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("vendor_id", vendor.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold">Your products</h2>
        <Link
          href="/dashboard/products/new"
          className="rounded-md border-2 border-ink bg-marigold px-4 py-2 text-sm font-bold shadow-[3px_3px_0_0_#14171F] transition hover:-translate-y-0.5"
        >
          + Add product
        </Link>
      </div>

      {!products || products.length === 0 ? (
        <p className="mt-6 rounded-lg border-2 border-dashed border-ink/30 p-8 text-center text-sm text-ink/50">
          No products yet — add your first one to go live on the marketplace.
        </p>
      ) : (
        <FadeInStagger className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <FadeInItem
              key={p.id}
              className="flex gap-3 rounded-xl border-2 border-ink bg-white p-3 shadow-[3px_3px_0_0_#14171F] transition hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_#14171F]"
            >
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-ink/5">
                <Image src={p.image_url} alt={p.title} fill className="object-cover" />
              </div>
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <p className="font-display text-sm font-bold leading-snug">{p.title}</p>
                  <p className="font-mono text-xs text-ink/60">
                    ₦{p.price.toLocaleString()} · {p.stock_left} in stock
                  </p>
                </div>
                <form action={deleteProduct.bind(null, p.id)}>
                  <button className="font-mono text-xs font-semibold text-coral hover:underline">
                    Delete
                  </button>
                </form>
              </div>
            </FadeInItem>
          ))}
        </FadeInStagger>
      )}
    </div>
  );
}
