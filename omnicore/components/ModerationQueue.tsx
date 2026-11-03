"use client";

import { useEffect, useState } from "react";

type Report = {
  id: string;
  reason: string;
  details: string | null;
  status: string;
  moderator_note: string | null;
  created_at: string;
  post: { body: string } | { body: string }[] | null;
  comment: { body: string } | { body: string }[] | null;
};

function relatedBody(report: Report) {
  const relation = report.post ?? report.comment;
  return Array.isArray(relation) ? relation[0]?.body ?? "" : relation?.body ?? "";
}

export default function ModerationQueue() {
  const [reports, setReports] = useState<Report[]>([]);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  async function load() {
    const response = await fetch("/api/moderation/reports", { cache: "no-store" });
    const result = await response.json() as { data?: Report[]; error?: string };
    if (!response.ok) throw new Error(result.error ?? "Could not load reports.");
    setReports(result.data ?? []);
  }

  useEffect(() => {
    let active = true;
    fetch("/api/moderation/reports", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json() as { data?: Report[]; error?: string };
        if (!response.ok) throw new Error(result.error ?? "Could not load reports.");
        if (active) setReports(result.data ?? []);
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Could not load moderation queue.");
      });
    return () => { active = false; };
  }, []);

  async function updateReport(id: string, status: "reviewed" | "actioned" | "dismissed") {
    setBusyId(id);
    setError("");
    try {
      const response = await fetch("/api/moderation/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Could not update report.");
      await load();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Could not update report.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <section className="mt-6 space-y-4">
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {!reports.length ? <p className="rounded-2xl border border-blue-100 bg-white p-6 text-sm text-blue-700">No reports in the queue. New reports will show here.</p> : reports.map((report) => (
        <article key={report.id} className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold capitalize text-blue-950">{report.reason.replace("_", " ")} · {report.status}</p>
            <time className="text-xs text-blue-600">{new Date(report.created_at).toLocaleString()}</time>
          </div>
          <blockquote className="mt-3 rounded-xl bg-blue-50 p-3 text-sm leading-6 text-blue-950">{relatedBody(report)}</blockquote>
          {report.details && <p className="mt-2 text-sm text-blue-800">Reporter note: {report.details}</p>}
          {report.moderator_note && <p className="mt-2 text-sm text-blue-800">Moderator note: {report.moderator_note}</p>}
          {report.status === "open" && <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" disabled={busyId === report.id} onClick={() => updateReport(report.id, "reviewed")} className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-800 disabled:opacity-50">Mark reviewed</button>
            <button type="button" disabled={busyId === report.id} onClick={() => updateReport(report.id, "actioned")} className="rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Hide content</button>
            <button type="button" disabled={busyId === report.id} onClick={() => updateReport(report.id, "dismissed")} className="rounded-lg px-3 py-2 text-sm font-semibold text-blue-700 disabled:opacity-50">Dismiss</button>
          </div>}
        </article>
      ))}
    </section>
  );
}
