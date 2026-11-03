"use client";

import { FormEvent, useEffect, useState } from "react";
import { Heart, MessageCircle, PackageCheck, Send, Truck, X } from "lucide-react";
import Link from "next/link";
import ProfileCard from "@/components/ProfileCard";
import ReportContentButton from "@/components/ReportContentButton";

type FeedItem = {
  id: string;
  vendor_id: string;
  kind: "product_drop" | "shipped" | "restock" | "reel";
  body: string;
  route_label: string | null;
  depth_score: number;
  created_at: string;
  vendor: { name: string; slug: string; location: string | null; is_verified: boolean };
  product: { id: string; title: string; price: number; image_url: string } | null;
};

type PostDetails = {
  post: FeedItem | null;
  comments: { id: string; author_id: string; body: string; created_at: string }[];
};

const kindLabels = {
  product_drop: "New product",
  shipped: "Dispatch proof",
  restock: "Restock",
  reel: "Reel",
};

type FeedProduct = { id: string; title: string };

export default function Feed({
  canPost,
  products,
  vendorName,
}: {
  canPost: boolean;
  products: FeedProduct[];
  vendorName: string;
}) {
  const [mode, setMode] = useState<"signal" | "chronological">("signal");
  const [items, setItems] = useState<FeedItem[]>([]);
  const [body, setBody] = useState("");
  const [kind, setKind] = useState<keyof typeof kindLabels>("product_drop");
  const [productId, setProductId] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [postPending, setPostPending] = useState(false);
  const [commentPending, setCommentPending] = useState(false);
  const [reactedPostIds, setReactedPostIds] = useState<string[]>([]);

  // Modal state for discussing a post
  const [openPostId, setOpenPostId] = useState<string | null>(null);
  const [postDetails, setPostDetails] = useState<PostDetails | null>(null);
  const [commentBody, setCommentBody] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/feed?mode=${mode}`)
      .then((response) => response.json())
      .then((payload: { data?: FeedItem[]; error?: string }) => {
        if (cancelled) return;
        if (payload.error) setMessage(payload.error);
        setItems(payload.data ?? []);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setMessage("The feed is taking a break. Try again.");
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [mode]);

  async function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setPostPending(true);
    try {
      const response = await fetch("/api/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, kind, productId }),
      });
      const payload = await response.json() as { data?: FeedItem; error?: string };
      if (!response.ok || !payload.data) {
        setMessage(payload.error ?? "Could not publish your update.");
        return;
      }
      setItems((current) => [payload.data!, ...current]);
      setBody("");
      setMessage("Posted. Your buyers can see it now.");
    } catch {
      setMessage("Could not reach Kivo. Check your connection and try again.");
    } finally {
      setPostPending(false);
    }
  }

  async function react(postId: string) {
    try {
      const response = await fetch(`/api/feed/${postId}/react`, { method: "POST" });
      const payload = await response.json();
      if (!response.ok) {
        setMessage(payload.error ?? "Sign in to leave a reaction.");
        return;
      }
      setReactedPostIds((current) => payload.action === "removed"
        ? current.filter((id) => id !== postId)
        : current.includes(postId) ? current : [...current, postId]);
    } catch {
      setMessage("Could not save your reaction. Check your connection and try again.");
    }
  }

  async function openDiscussion(postId: string) {
    setOpenPostId(postId);
    setPostDetails(null);
    try {
      const res = await fetch(`/api/feed/${postId}`);
      if (!res.ok) {
        setMessage('Could not load that post.');
        setOpenPostId(null);
        return;
      }
      const payload = await res.json();
      setPostDetails(payload as PostDetails);
    } catch {
      setMessage('Could not load that post.');
      setOpenPostId(null);
    }
  }

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!openPostId || !commentBody.trim()) return;
    setCommentPending(true);
    setMessage("");
    try {
      const response = await fetch(`/api/feed/${openPostId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: commentBody }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setMessage(payload.error ?? "Could not add comment.");
        return;
      }
      setCommentBody("");
      setPostDetails((previous) => previous
        ? { ...previous, comments: [...previous.comments, payload.data] }
        : previous);
    } catch {
      setMessage("Could not send your comment. Check your connection and try again.");
    } finally {
      setCommentPending(false);
    }
  }

  return (
    <section aria-label="Community feed">
      {canPost && products.length === 0 && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          Add a product to your store before sharing a community update.
        </div>
      )}
      {canPost && products.length > 0 && (
        <form onSubmit={publish} className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
          <div className="flex gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-800">{vendorName.charAt(0).toUpperCase()}</span>
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              maxLength={1200}
              placeholder="What shipped, restocked, or launched today?"
              className="min-h-20 flex-1 resize-none bg-blue-50 p-3 text-sm text-blue-950 outline-none ring-blue-500 placeholder:text-blue-600 focus:ring-2"
              required
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <select value={kind} onChange={(event) => setKind(event.target.value as keyof typeof kindLabels)} className="rounded-lg border border-blue-100 bg-white px-3 py-2 text-sm text-blue-900">
              {Object.entries(kindLabels).filter(([value]) => value !== "shipped" && value !== "reel").map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <select
              value={productId}
              onChange={(event) => setProductId(event.target.value)}
              required
              className="min-w-0 flex-1 rounded-lg border border-blue-100 bg-white px-3 py-2 text-sm text-blue-900"
              aria-label="Attach a product"
            >
              <option value="">Attach a product</option>
              {products.map((product) => <option key={product.id} value={product.id}>{product.title}</option>)}
            </select>
            <button disabled={postPending} className="flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-800 disabled:opacity-60" type="submit">
              <Send size={15} /> {postPending ? "Posting..." : "Post update"}
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 flex items-center gap-2 border-b border-blue-100 pb-3">
        <span className="mr-auto text-sm font-semibold text-blue-950">Updates from vendors</span>
        {(["signal", "chronological"] as const).map((value) => (
          <button key={value} onClick={() => { setLoading(true); setMode(value); }} className={`rounded-full px-3 py-1.5 text-xs font-bold ${mode === value ? "bg-blue-700 text-white" : "bg-blue-50 text-blue-800"}`}>
            {value === "signal" ? "Human signal" : "Latest"}
          </button>
        ))}
      </div>

      {message && <p className="mt-3 rounded-lg bg-blue-50 p-3 text-sm text-blue-900" role="status">{message}</p>}
      {loading ? <div className="mt-4 h-48 animate-pulse rounded-2xl bg-blue-50" /> : items.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-blue-200 p-10 text-center text-sm text-blue-700">No commerce updates yet. Vendors can be the first to share what is moving.</div>
      ) : (
        <div className="mt-4 space-y-4">
          {items.map((item) => (
            <article key={item.id} className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <ProfileCard vendor={item.vendor} compact />
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700">{kindLabels[item.kind]}</span>
              </div>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-blue-900">{item.body}</p>
              {item.kind === "shipped" && <div className="mt-3 flex items-center gap-2 rounded-xl bg-blue-50 p-3 text-sm font-semibold text-blue-900"><Truck size={17} /> {item.route_label ?? "Dispatch logged from the vendor desk"}</div>}
              {item.product && <div className="mt-3 flex items-center gap-2 rounded-xl border border-blue-100 p-3 text-sm"><PackageCheck size={17} className="text-blue-600" /><span className="font-semibold">{item.product.title}</span><span className="ml-auto font-mono text-xs">₦{item.product.price.toLocaleString()}</span></div>}
              <div className="mt-4 flex gap-5 text-xs font-semibold text-blue-700">
                <button onClick={() => react(item.id)} aria-pressed={reactedPostIds.includes(item.id)} className="flex items-center gap-1 transition hover:text-blue-700"><Heart size={15} fill={reactedPostIds.includes(item.id) ? "currentColor" : "none"} /> {reactedPostIds.includes(item.id) ? "Useful" : "Mark useful"}</button>
                <button onClick={() => openDiscussion(item.id)} className="flex items-center gap-1 text-blue-900 hover:text-blue-700"><MessageCircle size={15} /> Discuss</button>
                <Link href={`/community/post/${item.id}`} className="text-blue-700 hover:underline">Open</Link>
                <ReportContentButton postId={item.id} />
                <span className="ml-auto">Signal {item.depth_score}</span>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Modal: post discussion */}
      {openPostId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-100/90 p-4">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-auto rounded-2xl bg-white p-4 shadow-lg">
            <div className="flex items-start justify-between">
              <h3 className="font-display text-lg font-bold">Discussion</h3>
              <button onClick={() => { setOpenPostId(null); setPostDetails(null); }} aria-label="Close"><X /></button>
            </div>
            <div className="mt-3">
              {!postDetails ? <div className="h-24 animate-pulse rounded-md bg-blue-50" /> : (
                <>
                  <div>
                    <div className="flex items-center justify-between">
                      <ProfileCard vendor={postDetails.post!.vendor} compact />
                      <span className="text-xs text-blue-700">Signal {postDetails.post!.depth_score}</span>
                    </div>
                    <p className="mt-3 text-sm text-blue-900">{postDetails.post!.body}</p>
                    {postDetails.post!.product && <div className="mt-3 rounded-md border p-3">Product: {postDetails.post!.product.title}</div>}
                  </div>

                  <div className="mt-4">
                    <h4 className="font-semibold">Comments</h4>
                    {postDetails.comments.length === 0 ? <p className="mt-2 text-sm text-blue-700">No comments yet — be the first to ask about this dispatch or product.</p> : (
                      <ul className="mt-2 space-y-2">
                        {postDetails.comments.map((c) => (
                          <li key={c.id} className="rounded-md border border-blue-100 p-3">
                            <p className="text-sm text-blue-950">{c.body}</p>
                            <div className="mt-2"><ReportContentButton commentId={c.id} /></div>
                          </li>
                        ))}
                      </ul>
                    )}

                    <form onSubmit={submitComment} className="mt-4">
                      <textarea value={commentBody} onChange={(e) => setCommentBody(e.target.value)} className="w-full rounded-md border p-2" placeholder="Write a helpful question or confirmation..." />
                      <div className="mt-2 flex justify-end">
                        <button type="submit" disabled={commentPending} className="rounded-md bg-blue-700 px-3 py-1 text-white disabled:opacity-60">{commentPending ? "Sending..." : "Send"}</button>
                      </div>
                    </form>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
