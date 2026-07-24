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
3. **Storage → New bucket** → name it exactly `product-images` → toggle **Public bucket** on (product photos need to be publicly viewable on storefronts). This is what `app/dashboard/(main)/products/actions.ts` uploads to.
4. **Authentication → URL Configuration** → set **Site URL** to your real deployed domain (e.g. `https://your-app.vercel.app`), and add `https://your-app.vercel.app/auth/callback` under **Redirect URLs**. This is required for the email-confirmation link to work — without it, new vendor signups will fail to complete.
5. **Project Settings → API** → copy the **Project URL** and the **anon/public key**. You'll need these next.

## 4. Environment variables

Set these in **Vercel → your project → Settings → Environment Variables**
(for both Production and Preview):

```
NEXT_PUBLIC_SUPABASE_URL=<from Supabase Project Settings → API>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from Supabase Project Settings → API>
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app

TERMII_API_KEY=<from termii.com>
TERMII_SENDER_ID=OmniCore
REMOVE_BG_API_KEY=<from remove.bg/api>
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
4. You should land on `/dashboard`. Go to **Products → Add product**, upload a photo, optionally try "Remove background (AI)", fill in the rest, publish.
5. Visit `/store/your-slug` (in a new tab/incognito) — your product should be live, with a working "Order via WhatsApp" button.
6. Visit `/explore` — your product should show up in the marketplace search.
7. Back in the dashboard, **Orders → Log a new order** with a real phone number you can check.
8. Open that order, fill in the waybill dispatch form, submit — you should get a real SMS.

If any step fails, check the `DEPLOY.md` troubleshooting table from the
earlier integration pack (still valid), and check Vercel's function logs
for the specific route that failed.

## What's still mock/placeholder after this

- **Reels**: the schema and page are real (queries Postgres), but there's
  no upload UI yet for vendors to post a reel — you'd add that the same
  way products/new works, uploading to Storage and inserting a `reels` row.
- **"Go live"** button on `/reels` is not wired to anything yet.
- Product `live_viewers` / `sold_today` counters are static columns you'd
  update via a real-time mechanism (Supabase Realtime) if you want the
  "14 people viewing" badges to reflect actual traffic instead of whatever
  number a vendor sets when creating the product.
