# Shipping the real platform — step by step

This bundle contains your full repo, with everything from the mock starter
through the real Supabase-backed platform, as a linear git history on top
of your existing `main` branch. Nothing here has been pushed to GitHub —
I don't have write access to your account — so these are the exact
commands to do it yourself.

## 1. Get this history into your local clone

```bash
# From a fresh folder (or wherever you keep your local clone):
git clone https://github.com/Eseendurance/OMNICORE-STARTER.git
cd OMNICORE-STARTER

# Pull in the branch from the bundle:
git remote add bundle /path/to/omnicore-real-platform.bundle
git fetch bundle add-integrations
git checkout -b add-integrations bundle/add-integrations
```

If you'd rather not deal with git remotes, unzip the plain zip instead and
copy the `omnicore/` folder over your existing one — but you'll lose the
commit-by-commit history that way.

## 2. Review, then merge to main

```bash
# Optional: look at what changed before merging
git log --oneline main..add-integrations
git diff main add-integrations --stat

# Merge when you're happy with it
git checkout main
git merge add-integrations
git push origin main
```

## 3. Create a Supabase project (free tier)

1. [supabase.com](https://supabase.com) → New project. Pick a region close to your users (e.g. Frankfurt or London for Nigeria-facing traffic).
2. Once it's provisioned: **SQL Editor → New query** → paste the entire contents of `omnicore/supabase/schema.sql` → **Run**. This creates `vendors`, `products`, `reels`, `orders`, and all the row-level-security policies.
3. **Storage → New bucket** → create two public buckets:
   - `product-images` (product photos) — used by `app/dashboard/(main)/products/actions.ts`
   - `reel-media` (reel videos + auto-captured thumbnails) — used by `app/dashboard/(main)/reels/actions.ts`
   Toggle **Public bucket** on for both — product photos and reel videos need to be publicly viewable on storefronts and the reels feed.
4. **Authentication → URL Configuration** → set **Site URL** to your real deployed domain (e.g. `https://your-app.vercel.app`), and add `https://your-app.vercel.app/auth/callback` under **Redirect URLs**. This is required for the email-confirmation link to work — without it, new vendor signups will fail to complete.
5. **Project Settings → API** → copy the **Project URL** and the **anon/public key**. You'll need these next.

## 3b. Create an Agora project for Go Live (free tier)

1. [console.agora.io](https://console.agora.io) → create a project. Enable **App Certificate** (Project Management → your project → Edit → enable Primary Certificate) — this is required for token auth, which the app uses.
2. Copy the **App ID** and **App Certificate**. New Agora projects are auto-enrolled in the RTC Free package (10,000 minutes/month, no card required).
3. Without this, "Go Live" fails with a clear on-screen error telling you exactly which two env vars are missing — it won't fail silently or fall back to fake video.

## 4. Environment variables

Set these in **Vercel → your project → Settings → Environment Variables**
(for both Production and Preview):

```
NEXT_PUBLIC_SUPABASE_URL=<from Supabase Project Settings → API>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from Supabase Project Settings → API>
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app

TERMII_API_KEY=<from termii.com>
TERMII_SENDER_ID=KiVo

NEXT_PUBLIC_AGORA_APP_ID=<from console.agora.io>
AGORA_APP_CERTIFICATE=<from console.agora.io — keep secret, never NEXT_PUBLIC_>
```

`NEXT_PUBLIC_SITE_URL` matters more than it looks — it's used both for the
Supabase email-confirmation redirect and for the waybill-dispatch server
action to call your own SMS route internally. Get the domain wrong and
signups/dispatch will silently misbehave.

## 5. Deploy

If your Vercel project is already linked to this GitHub repo, pushing to
`main` triggers a deploy automatically. Otherwise:

```bash
npm install -g vercel
vercel --prod
```

## 6. Post-deploy checklist

Run through this once, in order — it mirrors exactly how a real vendor
would use the platform, so it'll catch any setup mistake:

1. Visit `/signup`, create an account.
2. Check your email, click the confirmation link — you should land back on the app already signed in.
3. You should be redirected to `/dashboard/onboarding`. Fill in a store name and WhatsApp number, submit.
4. You should land on `/dashboard`. Go to **Products → Add product**, upload a photo, optionally try "Remove background", fill in the rest, publish.
5. Visit `/store/your-slug` (in a new tab/incognito) — your product should be live, with a working "Order via WhatsApp" button.
6. Visit `/explore` — your product should show up in the marketplace search.
7. Back in the dashboard, **Orders → Log a new order** with a real phone number you can check.
8. Open that order, fill in the waybill dispatch form, submit — you should get a real SMS.
9. In the dashboard, go to **Reels → Upload video**, pick a short video — a thumbnail is captured automatically. Publish, then check `/reels` in another tab — it should actually play.
10. Go to **Go live**, click "Go live" — your browser will ask for camera/mic permission. Once connected, open `/reels` in a different browser (or incognito) — you should see your live video, not a placeholder.

If any step fails, check the `DEPLOY.md` troubleshooting table from the
earlier integration pack (still valid), and check Vercel's function logs
for the specific route that failed.

## What's still genuinely not built

Being precise about this so nothing here is a silent stub:

- **Live stream recording**: when a broadcast ends, it's just gone — there's
  no saved replay. Agora supports cloud recording as an add-on if you want
  this later.
- **Real-time viewer counts**: product `live_viewers` / `sold_today` are
  static columns a vendor sets when creating a product, not driven by
  actual traffic. Wiring real counts would mean Supabase Realtime
  presence tracking on the storefront pages — a reasonable next step, not
  done here.
- **Likes on reels**: the like button is visual only right now; it doesn't
  increment `reels.likes` in the database yet.
- **Multiple simultaneous live streams**: the current channel-naming
  scheme (`live-{vendorId}`) supports one concurrent live stream per
  vendor, which matches "vendor goes live to their buyers" — it's not
  built for one vendor running two broadcasts at once.
