"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Conversation = {
  id: string;
  order_id: string;
  buyer_id: string;
  vendor_id: string;
  order: { order_ref: string; customer_name: string; status: string };
  vendor: { name: string; slug: string };
};
type Message = { id: string; sender_id: string; body: string; created_at: string };

export default function OrderInbox({ userId }: { userId: string }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [reviewed, setReviewed] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/orders/conversations", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json() as { data?: Conversation[]; error?: string };
        if (!response.ok) throw new Error(result.error ?? "Could not load order conversations.");
        if (active) setConversations(result.data ?? []);
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Could not load conversations.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!selected) return;
    const supabase = createClient();
    const channel = supabase.channel(`order-messages-${selected.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "order_messages",
        filter: `conversation_id=eq.${selected.id}`,
      }, (event) => {
        const incoming = event.new as Message;
        setMessages((current) => current.some((message) => message.id === incoming.id)
          ? current
          : [...current, incoming]);
      })
      .subscribe((status, subscriptionError) => {
        if (status === "CHANNEL_ERROR" || subscriptionError) {
          console.error("Order message realtime subscription failed:", subscriptionError);
        }
      });
    return () => { void supabase.removeChannel(channel); };
  }, [selected]);

  async function openConversation(conversation: Conversation) {
    setSelected(conversation);
    setMessages([]);
    setReviewed(false);
    setError("");
    try {
      const [messageResponse, reviewResponse] = await Promise.all([
        fetch(`/api/orders/conversations/${conversation.id}`, { cache: "no-store" }),
        fetch(`/api/reviews?orderId=${encodeURIComponent(conversation.order_id)}`, { cache: "no-store" }),
      ]);
      const messageResult = await messageResponse.json() as { messages?: Message[]; error?: string };
      if (!messageResponse.ok) throw new Error(messageResult.error ?? "Could not open this conversation.");
      setMessages(messageResult.messages ?? []);
      if (reviewResponse.ok) {
        const reviewResult = await reviewResponse.json() as { data?: { id: string }[] };
        setReviewed(Boolean(reviewResult.data?.length));
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not open this conversation.");
    }
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !body.trim()) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/orders/conversations/${selected.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const result = await response.json() as { data?: Message; error?: string };
      if (!response.ok || !result.data) throw new Error(result.error ?? "Could not send this message.");
      setMessages((current) => [...current, result.data!]);
      setBody("");
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Could not send this message.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelivery() {
    if (!selected) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/orders/${selected.order_id}/confirm-delivery`, { method: "POST" });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Could not confirm delivery.");
      const updated = { ...selected, order: { ...selected.order, status: "delivered" } };
      setSelected(updated);
      setConversations((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (confirmError) {
      setError(confirmError instanceof Error ? confirmError.message : "Could not confirm delivery.");
    } finally {
      setBusy(false);
    }
  }

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const formData = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: selected.order_id,
          rating: Number(formData.get("rating")),
          body: formData.get("review"),
        }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Could not publish review.");
      setReviewed(true);
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : "Could not publish review.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 grid gap-5 lg:grid-cols-[19rem_minmax(0,1fr)]">
      <aside className="rounded-2xl border border-blue-100 bg-white p-3">
        <h2 className="px-3 py-2 font-semibold text-blue-950">Orders and conversations</h2>
        {loading ? <p className="p-3 text-sm text-blue-700">Loading your orders…</p> : conversations.length ? (
          <ul className="space-y-1">
            {conversations.map((conversation) => (
              <li key={conversation.id}>
                <button type="button" onClick={() => openConversation(conversation)} className={`w-full rounded-xl p-3 text-left ${selected?.id === conversation.id ? "bg-blue-100" : "hover:bg-blue-50"}`}>
                  <span className="block font-semibold text-blue-950">{conversation.vendor.name}</span>
                  <span className="mt-1 block text-xs text-blue-700">{conversation.order.order_ref} · {conversation.order.status}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : <p className="p-3 text-sm leading-6 text-blue-700">No linked orders yet. Ask the vendor to record your verified account email with the order. Delivered orders can be reviewed here.</p>}
      </aside>
      <section className="min-h-80 rounded-2xl border border-blue-100 bg-white p-4 sm:p-5">
        {selected ? (
          <>
            <header className="border-b border-blue-100 pb-3">
              <h2 className="font-display text-lg font-bold text-blue-950">{selected.vendor.name}</h2>
              <p className="mt-1 text-xs text-blue-700">Order {selected.order.order_ref} · {selected.order.status}. Keep personal/payment details in the secure order, not chat.</p>
            </header>
            {selected.buyer_id === userId && selected.order.status === "shipped" && (
              <button type="button" onClick={confirmDelivery} disabled={busy} className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-900 disabled:opacity-60">
                {busy ? "Confirming…" : "I received this order"}
              </button>
            )}
            <div className="max-h-96 min-h-40 space-y-3 overflow-y-auto py-4" aria-live="polite">
              {messages.map((message) => (
                <div key={message.id} className={`max-w-[85%] rounded-2xl p-3 text-sm ${message.sender_id === userId ? "ml-auto bg-blue-700 text-white" : "bg-blue-50 text-blue-950"}`}>
                  <p className="whitespace-pre-wrap">{message.body}</p>
                  <time className={`mt-1 block text-[11px] ${message.sender_id === userId ? "text-blue-100" : "text-blue-600"}`}>{new Date(message.created_at).toLocaleString()}</time>
                </div>
              ))}
              {!messages.length && <p className="text-sm text-blue-700">This is the order thread. A quick hello is a good place to start.</p>}
            </div>
            <form onSubmit={sendMessage} className="flex gap-2 border-t border-blue-100 pt-3">
              <input value={body} onChange={(event) => setBody(event.target.value)} maxLength={2000} placeholder="Message about this order…" className="min-w-0 flex-1 rounded-lg border border-blue-200 px-3 py-2 text-sm" required />
              <button disabled={busy} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">{busy ? "Sending…" : "Send"}</button>
            </form>
            {selected.buyer_id === userId && selected.order.status === "delivered" && !reviewed && (
              <form onSubmit={submitReview} className="mt-5 rounded-xl bg-blue-50 p-4">
                <h3 className="font-semibold text-blue-950">How did this order go?</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  <label className="text-sm text-blue-900">Rating
                    <select name="rating" className="ml-2 rounded border border-blue-200 bg-white px-2 py-1"><option value="5">5 stars</option><option value="4">4 stars</option><option value="3">3 stars</option><option value="2">2 stars</option><option value="1">1 star</option></select>
                  </label>
                  <input name="review" minLength={5} maxLength={1200} required placeholder="Share a useful detail" className="min-w-0 flex-1 rounded border border-blue-200 px-3 py-1 text-sm" />
                  <button disabled={busy} className="rounded bg-blue-700 px-3 py-1 text-sm font-bold text-white disabled:opacity-60">Leave verified review</button>
                </div>
              </form>
            )}
            {reviewed && <p className="mt-4 text-sm font-semibold text-blue-700">Thanks. Your verified review is published.</p>}
          </>
        ) : <p className="grid min-h-64 place-items-center text-center text-sm text-blue-700">Select an order to open its private conversation.</p>}
        {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      </section>
    </div>
  );
}
