import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileCard from "@/components/ProfileCard";

export const dynamic = "force-dynamic";

export default async function CommunityPostPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;
  const supabase = await createClient();
  const { data: post, error } = await supabase
    .from("social_posts")
    .select("id, kind, body, route_label, depth_score, created_at, vendor:vendors(id, name, slug, location, is_verified), product:products(id, title, price, image_url)")
    .eq("id", postId)
    .maybeSingle();

  if (error) {
    console.error("Community post page query failed:", error);
    throw new Error("Could not load this community update.");
  }
  if (!post) notFound();

  const { data: comments, error: commentsError } = await supabase
    .from("social_comments")
    .select("id, body, created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: true })
    .limit(100);
  if (commentsError) {
    console.error("Community post comments query failed:", commentsError);
    throw new Error("Could not load comments for this update.");
  }

  const vendor = Array.isArray(post.vendor) ? post.vendor[0] : post.vendor;
  const product = Array.isArray(post.product) ? post.product[0] : post.product;

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <Link href="/community" className="text-sm font-semibold text-blue-700 hover:underline">Back to community</Link>
      <article className="mt-5 rounded-2xl border border-blue-100 bg-white p-5 shadow-sm sm:p-7">
        {vendor && <ProfileCard vendor={vendor} compact />}
        <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-blue-900">{post.body}</p>
        {post.kind === "shipped" && post.route_label && <p className="mt-4 rounded-xl bg-blue-50 p-3 text-sm font-semibold text-blue-900">Dispatch: {post.route_label}</p>}
        {product && <Link href={`/store/${vendor?.slug ?? ""}`} className="mt-4 block rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm font-semibold text-blue-900 hover:border-blue-300">{product.title} | Naira {Number(product.price).toLocaleString()}</Link>}
        <p className="mt-5 text-xs text-blue-700">Shared {new Date(post.created_at).toLocaleString()}</p>
      </article>
      <section className="mt-5 rounded-2xl border border-blue-100 bg-white p-5">
        <h2 className="font-display text-lg font-bold text-blue-950">Questions and replies</h2>
        {!comments?.length ? <p className="mt-3 text-sm text-blue-700">No replies yet.</p> : <ul className="mt-3 space-y-3">{comments.map((comment) => <li key={comment.id} className="rounded-xl bg-blue-50 p-3"><p className="whitespace-pre-wrap text-sm text-blue-900">{comment.body}</p><time className="mt-2 block text-xs text-blue-700">{new Date(comment.created_at).toLocaleString()}</time></li>)}</ul>}
        <Link href="/community" className="mt-4 inline-flex rounded-lg bg-blue-700 px-4 py-2 text-sm font-bold text-white hover:bg-blue-800">Reply in Community</Link>
      </section>
    </main>
  );
}
