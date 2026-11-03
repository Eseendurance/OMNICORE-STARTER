"use client";

import { useState } from "react";

type Props = { postId?: string; commentId?: string };

export default function ReportContentButton({ postId, commentId }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("scam");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/community/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, commentId, reason }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) {
        setMessage(result.error ?? "Could not send this report.");
        return;
      }
      setMessage("Thanks. A moderator will review this.");
      setOpen(false);
    } catch {
      setMessage("Could not reach Kivo. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className="text-xs font-semibold text-blue-700 hover:underline">
          Report
        </button>
      ) : (
        <>
          <label className="sr-only" htmlFor={`report-${postId ?? commentId}`}>Report reason</label>
          <select
            id={`report-${postId ?? commentId}`}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="rounded border border-blue-200 bg-white px-2 py-1 text-xs text-blue-900"
          >
            <option value="scam">Scam</option><option value="spam">Spam</option>
            <option value="harassment">Harassment</option><option value="unsafe">Unsafe</option>
            <option value="other">Other</option>
          </select>
          <button type="button" onClick={submit} disabled={busy} className="text-xs font-bold text-blue-700 disabled:opacity-60">
            {busy ? "Sending…" : "Send"}
          </button>
          <button type="button" onClick={() => setOpen(false)} className="text-xs text-blue-700">Cancel</button>
        </>
      )}
      {message && <span role="status" className="text-xs text-blue-700">{message}</span>}
    </span>
  );
}
