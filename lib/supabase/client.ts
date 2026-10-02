// lib/supabase/client.ts
// Use in Client Components ("use client").
//
// Note: not using the <Database> generic here. Supabase's typed query
// parser (for select("*") etc.) expects a fuller schema shape (including
// Relationships per table) than we hand-maintain in lib/supabase/types.ts.
// Instead we type our own function signatures explicitly using the Row
// types from lib/supabase/types.ts — see lib/vendor.ts for the pattern.

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
