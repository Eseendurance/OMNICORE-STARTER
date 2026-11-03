# OmniCore AI — starter

A deployable Next.js starter matching the three-layer OmniCore architecture:
a SaaS landing page for vendors, dynamic vendor storefronts, a searchable
central marketplace, and a TikTok-style Reels/Live feed. Bright, no-dark-mode
design system ("Manifest Board" — inspired by motor-park departure boards).

## What's here

Kivo is the updated customer-facing brand for this existing OmniCore repository. The folder, GitHub repository, Supabase project, and Vercel project remain unchanged.

| Route | Layer | What it does |
|---|---|---|
| `/` | Layer 1 | SaaS landing page — pitches vendors on signing up |
| `/store/[vendor]` | Layer 2 | Dynamic storefront per vendor, with live-proof badges, stock bars, countdown |
| `/explore` | Layer 3 | Central marketplace with live search across all vendors |
| `/reels` | New | Vertical swipe feed of vendor product videos / live drops |
| `/community` | New | Product-linked vendor updates, replies, reactions, and vendor spaces |
| `/messages` | New | Buyer/vendor conversations scoped to claimed orders, with delivery confirmation and verified reviews |
| `/moderation` | New | Report queue for trusted moderators and admins |
| `/dashboard/spaces` | New | Create public and membership-only trade spaces |
| `/api/search` | — | Search endpoint, currently backed by mock data in `lib/data.ts` |

All product/vendor data is mocked in `lib/data.ts` so the app runs and
deploys with zero configuration. Replace that file with real database calls
when you're ready.

## Run locally

Install dependencies and configure Supabase from `.env.example` first. In PowerShell, use `npm.cmd` if your execution policy blocks `npm.ps1`:

```powershell
npm.cmd install
npm.cmd run dev
```

Run checks before deployment:

```powershell
npm.cmd run lint
npm.cmd run build
```

Open http://localhost:3000.

## Deploy to Vercel

The Next.js app and its `package.json` are in the repository's `omnicore`
subfolder. For the existing Vercel project, open **Settings → General →
Root Directory**, set it to `omnicore`, save, and redeploy. Do not create a
new project or move the app. A `NEXT_NO_VERSION` error means Vercel is
looking above the folder that contains `package.json`.

Run local commands from `omnicore`:

```powershell
cd omnicore
npm.cmd ci
npm.cmd run lint
npm.cmd run build
```

In the existing Vercel project, set the Root Directory to `omnicore`, keep
the framework as Next.js, and configure the required environment variables
below for the environments you use.

## Wiring in real integrations

Copy `.env.example` to `.env.local` and fill in what you need. Each entry is
commented with where to get a free/low-cost key:

- **Search** — Meilisearch Cloud (free tier) or Typesense Cloud, replacing the mock logic in `app/api/search/route.ts`.
- **WhatsApp commerce bridge** — Meta WhatsApp Business Cloud API (infrastructure is free; customer-initiated replies are free/unlimited).
- **SMS dispatch notifications** — Termii (Nigeria-focused, free trial credit).
- **Courier rates/labels** — Terminal Africa (free sandbox endpoint) or Sendstack.
- **Live viewer counts** — Supabase Realtime (free tier) instead of raw WebSockets.
- **Payments** — Paystack (free to integrate, per-transaction fee only).
- **Paystack support** — server-side transaction initialization and a signed
  webhook at `/api/payments/paystack/webhook`. The webhook verifies each
  transaction with Paystack before recording a tip or 30/90-day membership.
  An active membership grants access to that vendor's invite-only spaces.
  Add `PAYSTACK_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and
  `NEXT_PUBLIC_SITE_URL`. Never expose the service-role key.
- **Order messages/reviews** — vendors should enter the buyer's confirmed
  Kivo sign-in email when logging an order. Buyers can link matching orders
  at `/messages`, confirm delivery in the private thread, and then leave one
  verified review. Existing orders without a buyer email cannot be claimed.
- **Moderation** — reports are available on posts/comments. Set a trusted
  user's `app_metadata.role` to `moderator` or `admin` using Supabase's
  privileged Auth Admin API; never use editable `user_metadata` for roles.
  The moderator page is `/moderation`. After changing app metadata, the
  moderator must sign in again to refresh their JWT.

  For a DBA-managed account, a privileged SQL operator can set the role by
  user UUID:

  ```sql
  update auth.users
  set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
    || '{"role":"moderator"}'::jsonb
  where id = '<trusted-user-uuid>';
  ```

In Vercel: **Project → Settings → Environment Variables**, add the same keys
to the existing project, then redeploy.

## Design system

Tokens live in `app/globals.css` under `:root` / `@theme inline`.
Production app surfaces use white and blue, with the persisted optional
theme control. Fonts use local system stacks; builds do not download Google
Fonts or depend on external font access.

## Extending

- `app/reels/page.tsx` uses poster images as placeholders — swap in real `<video>` sources or a streaming provider (Mux, Cloudflare Stream) when vendors start uploading.
- Orders, dispatch/waybill notifications, community interactions, and order conversations use the existing Supabase project. New database objects remain DBA-applied; the app never runs the schema script at startup.

## Community database migration

After `supabase/schema.sql` is installed, ask your DBA to review and run
`supabase/social-schema.sql` in the same Supabase project. This migration
adds community interactions, order-linked messaging, verified reviews,
moderation, and Paystack support records. Community feeds, order claims,
reviews, moderation, and payment callbacks need the DBA-applied schema.
The app does not run the migration automatically.

## Installable app

The production site serves a web manifest, Kivo app icons, a service worker, and an offline fallback page. Installation requires HTTPS (localhost is allowed for development). The offline worker deliberately does not cache API responses, dashboard pages, or private account data.

## Password recovery

The sign-in page links to `/auth/forgot-password`; reset emails return through `/auth/callback` to `/auth/update-password`. Configure `NEXT_PUBLIC_SITE_URL` and allow the deployed callback URL in Supabase Authentication URL settings.
