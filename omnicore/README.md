# OmniCore AI — starter

A deployable Next.js starter matching the three-layer OmniCore architecture:
a SaaS landing page for vendors, dynamic vendor storefronts, a searchable
central marketplace, and a TikTok-style Reels/Live feed. Bright, no-dark-mode
design system ("Manifest Board" — inspired by motor-park departure boards).

## What's here

| Route | Layer | What it does |
|---|---|---|
| `/` | Layer 1 | SaaS landing page — pitches vendors on signing up |
| `/store/[vendor]` | Layer 2 | Dynamic storefront per vendor, with live-proof badges, stock bars, countdown |
| `/explore` | Layer 3 | Central marketplace with live search across all vendors |
| `/reels` | New | Vertical swipe feed of vendor product videos / live drops |
| `/api/search` | — | Search endpoint, currently backed by mock data in `lib/data.ts` |

All product/vendor data is mocked in `lib/data.ts` so the app runs and
deploys with zero configuration. Replace that file with real database calls
when you're ready.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Deploy to Vercel

**Option A — CLI**
```bash
npm install -g vercel
vercel        # first deploy, follow prompts
vercel --prod # promote to production
```

**Option B — GitHub**
1. Push this folder to a new GitHub repo.
2. Go to https://vercel.com/new, import the repo.
3. Vercel auto-detects Next.js (see `vercel.json`) — no config needed to deploy the starter as-is.
4. Click Deploy.

Both options work with zero environment variables — the starter uses mock
data. Add the keys below when you're ready to go live.

## Wiring in real integrations

Copy `.env.example` to `.env.local` and fill in what you need. Each entry is
commented with where to get a free/low-cost key:

- **Search** — Meilisearch Cloud (free tier) or Typesense Cloud, replacing the mock logic in `app/api/search/route.ts`.
- **WhatsApp commerce bridge** — Meta WhatsApp Business Cloud API (infrastructure is free; customer-initiated replies are free/unlimited).
- **SMS dispatch notifications** — Termii (Nigeria-focused, free trial credit).
- **Courier rates/labels** — Terminal Africa (free sandbox endpoint) or Sendstack.
- **Live viewer counts** — Supabase Realtime (free tier) instead of raw WebSockets.
- **Payments** — Paystack (free to integrate, per-transaction fee only).

In Vercel: **Project → Settings → Environment Variables**, add the same keys, redeploy.

## Design system

Tokens live in `app/globals.css` under `:root` / `@theme inline`:

- `--paper` (#FFFCF5) — background, always bright, never dark
- `--ink` (#14171F) — text and borders
- `--marigold` (#FFB100) — primary CTA
- `--jade` (#00875A) — confirmed/money states
- `--coral` (#FF4B3E) — urgency, live badges
- `--sky` (#2E9CFF) — links, buyer actions

Fonts: Space Grotesk (display), Manrope (body), IBM Plex Mono (data/manifest/tracking codes), loaded via `next/font/google` in `app/layout.tsx`.

## Extending

- Swap `lib/data.ts` for a real database (Postgres via Supabase/Neon, or your own API).
- `app/reels/page.tsx` uses poster images as placeholders — swap in real `<video>` sources or a streaming provider (Mux, Cloudflare Stream) when vendors start uploading.
- The motor-park waybill flow described in the original blueprint (dispatch → update → buyer notification) isn't built yet — it's a good next feature to add as a vendor-dashboard form plus a Termii/WhatsApp send on submit.
