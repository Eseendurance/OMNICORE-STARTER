"use client";

import Link from "next/link";
import { useState } from "react";

type WorkspaceShellProps = {
  workspaceName?: string;
  children: React.ReactNode;
};

const navigation = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/products", label: "Products" },
  { href: "/dashboard/orders", label: "Orders" },
  { href: "/dashboard/reels", label: "Content" },
];

export default function WorkspaceShell({
  workspaceName = "My workspace",
  children,
}: WorkspaceShellProps) {
  const [open, setOpen] = useState(true);

  return (
    <div className="min-h-full bg-paper">
      <div className="mx-auto flex max-w-7xl gap-5 px-4 py-5 sm:px-6">
        <aside
          className={`shrink-0 rounded-2xl border-2 border-ink bg-white p-3 shadow-[4px_4px_0_0_#14171F] transition-all ${
            open ? "w-56" : "w-16"
          }`}
          aria-label="Workspace navigation"
        >
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="flex w-full items-center justify-between rounded-lg border-2 border-ink px-3 py-2 text-left text-sm font-bold hover:bg-sky/10"
            aria-label={open ? "Collapse navigation" : "Expand navigation"}
          >
            <span className={open ? "" : "sr-only"}>{workspaceName}</span>
            <span aria-hidden="true">{open ? "←" : "→"}</span>
          </button>
          <nav className="mt-4 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-lg px-3 py-2 text-sm font-semibold text-ink/70 hover:bg-sky/10 hover:text-ink"
              >
                <span className={open ? "" : "sr-only"}>{item.label}</span>
                {!open && <span aria-hidden="true">{item.label.slice(0, 1)}</span>}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="min-w-0 flex-1">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-ink/50">
              Workspace / {workspaceName}
            </p>
            <kbd className="rounded-md border-2 border-ink bg-white px-2 py-1 text-xs font-semibold text-ink/60">
              ⌘ K Quick actions
            </kbd>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
