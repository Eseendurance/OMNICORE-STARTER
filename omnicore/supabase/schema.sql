-- supabase/schema.sql
--
-- Run this once in your Supabase project's SQL editor
-- (Project → SQL Editor → New query → paste this → Run).
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE throughout.
--
-- This replaces the hardcoded arrays in the old lib/data.ts with real
-- tables. Row Level Security (RLS) is enabled everywhere so:
--   - Anyone (including logged-out buyers) can read vendors/products.
--   - Only the vendor who owns a product can create/edit/delete it.
--   - Only the vendor who owns an order can see or update it.

-- ── Extensions ────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto"; -- for gen_random_uuid()

-- ── Vendors ───────────────────────────────────────────────────────────────
-- One row per vendor account. id = the Supabase Auth user id (1:1),
-- so a vendor's own row is auth.uid() = vendors.id.
create table if not exists vendors (
  id           uuid primary key references auth.users(id) on delete cascade,
  slug         text unique not null,
  name         text not null,
  tagline      text,
  location     text,
  color        text not null default 'marigold' check (color in ('marigold','jade','coral','sky')),
  whatsapp     text not null,
  rating       numeric(2,1) not null default 5.0,
  followers    integer not null default 0,
  following    integer not null default 0,
  is_verified  boolean not null default false,
  verified_at  timestamptz,
  response_rate numeric(5,2) not null default 0,
  created_at   timestamptz not null default now()
);

alter table vendors add column if not exists following integer not null default 0;
alter table vendors add column if not exists is_verified boolean not null default false;
alter table vendors add column if not exists verified_at timestamptz;
alter table vendors add column if not exists response_rate numeric(5,2) not null default 0;

create table if not exists vendor_follows (
  follower_id  uuid not null references vendors(id) on delete cascade,
  following_id uuid not null references vendors(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create index if not exists vendor_follows_following_idx on vendor_follows(following_id);

create or replace function update_vendor_follow_counts()
returns trigger
language plpgsql
security definer
as $$
begin
  if TG_OP = 'INSERT' then
    update vendors set following = following + 1 where id = NEW.follower_id;
    update vendors set followers = followers + 1 where id = NEW.following_id;
    return NEW;
  end if;
  update vendors set following = greatest(0, following - 1) where id = OLD.follower_id;
  update vendors set followers = greatest(0, followers - 1) where id = OLD.following_id;
  return OLD;
end;
$$;

drop trigger if exists vendor_follow_counts_trigger on vendor_follows;
create trigger vendor_follow_counts_trigger
after insert or delete on vendor_follows
for each row execute function update_vendor_follow_counts();

-- ── Products ──────────────────────────────────────────────────────────────
create table if not exists products (
  id              uuid primary key default gen_random_uuid(),
  vendor_id       uuid not null references vendors(id) on delete cascade,
  title           text not null,
  price           integer not null check (price >= 0), -- kobo-free naira integer, e.g. 28500
  compare_at      integer check (compare_at is null or compare_at >= 0),
  category        text not null default 'General',
  image_url       text not null,
  stock_left      integer not null default 0 check (stock_left >= 0),
  live_viewers    integer not null default 0,
  sold_today      integer not null default 0,
  created_at      timestamptz not null default now()
);

create index if not exists products_vendor_id_idx on products(vendor_id);
create index if not exists products_title_trgm_idx on products using gin (to_tsvector('english', title));

-- ── Reels ─────────────────────────────────────────────────────────────────
create table if not exists reels (
  id           uuid primary key default gen_random_uuid(),
  vendor_id    uuid not null references vendors(id) on delete cascade,
  product_id   uuid references products(id) on delete set null,
  caption      text not null default '',
  video_url    text,          -- real video file (Supabase Storage or Mux/Cloudflare Stream URL)
  poster_url   text not null, -- thumbnail/cover image
  is_live      boolean not null default false,
  likes        integer not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists reels_vendor_id_idx on reels(vendor_id);

-- ── Optional social posts ────────────────────────────────────────────────
-- Uses vendors as the existing authenticated user/profile model.
create table if not exists posts (
  id           uuid primary key default gen_random_uuid(),
  vendor_id    uuid not null references vendors(id) on delete cascade,
  body         text not null check (char_length(body) between 1 and 5000),
  media_url    text,
  created_at   timestamptz not null default now()
);

create table if not exists post_comments (
  id           uuid primary key default gen_random_uuid(),
  post_id      uuid not null references posts(id) on delete cascade,
  vendor_id    uuid not null references vendors(id) on delete cascade,
  body         text not null check (char_length(body) between 1 and 1000),
  created_at   timestamptz not null default now()
);

create table if not exists post_reactions (
  post_id      uuid not null references posts(id) on delete cascade,
  vendor_id    uuid not null references vendors(id) on delete cascade,
  reaction     text not null check (reaction in ('LIKE', 'FIRE', 'LAUGH', 'ROCKET', 'IDEA')),
  created_at   timestamptz not null default now(),
  primary key (post_id, vendor_id, reaction)
);

create index if not exists posts_created_at_idx on posts(created_at desc);
create index if not exists post_comments_post_id_idx on post_comments(post_id);
create index if not exists post_reactions_post_id_idx on post_reactions(post_id);

-- ── Enterprise workspaces and audit history ─────────────────────────────
-- Optional multi-tenant layer. Existing vendor workflows remain valid; a
-- vendor can be linked to a workspace when the organization feature is enabled.
create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  slug text not null,
  created_at timestamptz not null default now(),
  unique (organization_id, slug)
);

create table if not exists workspace_members (
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'viewer'
    check (role in ('owner', 'admin', 'manager', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  workspace_id uuid references workspaces(id) on delete set null,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists workspace_members_user_id_idx on workspace_members(user_id);
create index if not exists audit_logs_org_created_at_idx on audit_logs(organization_id, created_at desc);

-- ── Orders ────────────────────────────────────────────────────────────────
-- Buyers order via the WhatsApp button (no cart/payment gateway in v1 —
-- matches the original blueprint's WhatsApp-commerce-bridge model). The
-- vendor logs the order here once confirmed, then dispatches it, which
-- triggers the real SMS via /api/orders/waybill-notify.
create table if not exists orders (
  id                  uuid primary key default gen_random_uuid(),
  vendor_id           uuid not null references vendors(id) on delete cascade,
  product_id          uuid references products(id) on delete set null,
  order_ref           text unique not null default ('ORD-' || substr(replace(gen_random_uuid()::text,'-',''),1,8)),
  customer_name        text not null,
  customer_phone       text not null,
  amount              integer not null check (amount >= 0),
  status              text not null default 'pending'
                       check (status in ('pending','confirmed','shipped','delivered','cancelled')),

  -- filled in when the vendor dispatches via motor park
  transport_company   text,
  departure_terminal  text,
  driver_name         text,
  driver_phone        text,
  waybill_code        text,
  shipped_at          timestamptz,

  created_at          timestamptz not null default now()
);

create index if not exists orders_vendor_id_idx on orders(vendor_id);
create index if not exists orders_status_idx on orders(status);

create table if not exists order_events (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references orders(id) on delete cascade,
  vendor_id    uuid not null references vendors(id) on delete cascade,
  status       text not null check (status in ('pending','confirmed','shipped','delivered','cancelled','refunded','disputed')),
  note         text,
  created_at   timestamptz not null default now()
);

create index if not exists order_events_order_id_idx on order_events(order_id, created_at desc);

-- ── Row Level Security ────────────────────────────────────────────────────
alter table vendors  enable row level security;
alter table products enable row level security;
alter table reels    enable row level security;
alter table posts    enable row level security;
alter table post_comments enable row level security;
alter table post_reactions enable row level security;
alter table orders   enable row level security;
alter table vendor_follows enable row level security;
alter table order_events enable row level security;

-- Vendors: public read (storefronts are public), owner-only write
drop policy if exists "vendors_public_read" on vendors;
create policy "vendors_public_read" on vendors for select using (true);

drop policy if exists "vendors_owner_insert" on vendors;
create policy "vendors_owner_insert" on vendors for insert with check (auth.uid() = id);

drop policy if exists "vendors_owner_update" on vendors;
create policy "vendors_owner_update" on vendors for update using (auth.uid() = id);

drop policy if exists "vendor_follows_public_read" on vendor_follows;
create policy "vendor_follows_public_read" on vendor_follows for select using (true);
drop policy if exists "vendor_follows_owner_write" on vendor_follows;
create policy "vendor_follows_owner_write" on vendor_follows for all
  using (auth.uid() = follower_id) with check (auth.uid() = follower_id);

-- Products: public read, owner-only write
drop policy if exists "products_public_read" on products;
create policy "products_public_read" on products for select using (true);

drop policy if exists "products_owner_write" on products;
create policy "products_owner_write" on products for all
  using (auth.uid() = vendor_id) with check (auth.uid() = vendor_id);

-- Reels: public read, owner-only write
drop policy if exists "reels_public_read" on reels;
create policy "reels_public_read" on reels for select using (true);

drop policy if exists "reels_owner_write" on reels;
create policy "reels_owner_write" on reels for all
  using (auth.uid() = vendor_id) with check (auth.uid() = vendor_id);

drop policy if exists "posts_public_read" on posts;
create policy "posts_public_read" on posts for select using (true);
drop policy if exists "posts_owner_write" on posts;
create policy "posts_owner_write" on posts for all
  using (auth.uid() = vendor_id) with check (auth.uid() = vendor_id);

drop policy if exists "post_comments_public_read" on post_comments;
create policy "post_comments_public_read" on post_comments for select using (true);
drop policy if exists "post_comments_owner_write" on post_comments;
create policy "post_comments_owner_write" on post_comments for all
  using (auth.uid() = vendor_id) with check (auth.uid() = vendor_id);

drop policy if exists "post_reactions_public_read" on post_reactions;
create policy "post_reactions_public_read" on post_reactions for select using (true);
drop policy if exists "post_reactions_owner_write" on post_reactions;
create policy "post_reactions_owner_write" on post_reactions for all
  using (auth.uid() = vendor_id) with check (auth.uid() = vendor_id);

-- Orders: vendor can see/manage only their own orders. No public read —
-- order data (customer phone, etc.) is private to the vendor.
drop policy if exists "orders_owner_all" on orders;
create policy "orders_owner_all" on orders for all
  using (auth.uid() = vendor_id) with check (auth.uid() = vendor_id);

drop policy if exists "order_events_owner_all" on order_events;
create policy "order_events_owner_all" on order_events for all
  using (auth.uid() = vendor_id) with check (auth.uid() = vendor_id);

-- ── Seed data ─────────────────────────────────────────────────────────────
-- There's no generic seed script here on purpose: vendors.id is a foreign
-- key into auth.users, so a vendor row can only exist for a real signed-up
-- account. To seed test data:
--   1. Sign up through /signup in the app (creates an auth.users row).
--   2. Copy that user's id from Supabase → Authentication → Users.
--   3. Insert a vendors row using that id, e.g.:
--        insert into vendors (id, slug, name, tagline, location, color, whatsapp)
--        values ('<paste-user-id>', 'adaeze-leather', 'Adaeze Leather Co.',
--                'Handmade footwear out of Aba', 'Aba, Abia', 'coral', '+2348031234001');
--   4. Add products referencing that vendor's id.
