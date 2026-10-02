-- OmniCore social commerce extension.
-- Run after schema.sql. Every social record stays attached to a vendor,
-- product, order, or a named vendor space.

create type social_post_kind as enum ('product_drop', 'shipped', 'restock', 'reel');
create type space_privacy as enum ('public', 'invite_only');

alter table vendors add column if not exists is_verified boolean not null default false;

create table if not exists vendor_follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  vendor_id uuid not null references vendors(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, vendor_id),
  check (follower_id <> vendor_id)
);

create table if not exists social_posts (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendors(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  order_id uuid references orders(id) on delete set null,
  kind social_post_kind not null,
  body text not null check (char_length(body) between 1 and 1200),
  media_url text,
  route_label text,
  depth_score integer not null default 0 check (depth_score >= 0),
  created_at timestamptz not null default now()
);

create index if not exists social_posts_feed_idx
  on social_posts (depth_score desc, created_at desc);
create index if not exists social_posts_vendor_idx on social_posts (vendor_id);

create table if not exists social_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references social_posts(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 600),
  created_at timestamptz not null default now()
);

create table if not exists social_reactions (
  post_id uuid not null references social_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists vendor_spaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references vendors(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 80),
  description text,
  category text not null default 'General',
  privacy space_privacy not null default 'public',
  is_live boolean not null default false,
  live_channel text,
  created_at timestamptz not null default now()
);

create table if not exists creator_support (
  id uuid primary key default gen_random_uuid(),
  supporter_id uuid not null references auth.users(id) on delete restrict,
  vendor_id uuid not null references vendors(id) on delete cascade,
  amount integer not null check (amount > 0),
  note text,
  created_at timestamptz not null default now()
);

alter table vendor_follows enable row level security;
alter table social_posts enable row level security;
alter table social_comments enable row level security;
alter table social_reactions enable row level security;
alter table vendor_spaces enable row level security;
alter table creator_support enable row level security;

drop policy if exists "social_posts_public_read" on social_posts;
create policy "social_posts_public_read" on social_posts for select using (true);
drop policy if exists "social_posts_vendor_write" on social_posts;
create policy "social_posts_vendor_write" on social_posts for all
  using (auth.uid() = vendor_id) with check (auth.uid() = vendor_id);

drop policy if exists "vendor_follows_public_read" on vendor_follows;
create policy "vendor_follows_public_read" on vendor_follows for select using (true);
drop policy if exists "vendor_follows_self_write" on vendor_follows;
create policy "vendor_follows_self_write" on vendor_follows for all
  using (auth.uid() = follower_id) with check (auth.uid() = follower_id);

drop policy if exists "social_comments_public_read" on social_comments;
create policy "social_comments_public_read" on social_comments for select using (true);
drop policy if exists "social_comments_self_write" on social_comments;
create policy "social_comments_self_write" on social_comments for all
  using (auth.uid() = author_id) with check (auth.uid() = author_id);

drop policy if exists "social_reactions_public_read" on social_reactions;
create policy "social_reactions_public_read" on social_reactions for select using (true);
drop policy if exists "social_reactions_self_write" on social_reactions;
create policy "social_reactions_self_write" on social_reactions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "vendor_spaces_public_read" on vendor_spaces;
create policy "vendor_spaces_public_read" on vendor_spaces for select
  using (privacy = 'public' or auth.uid() = owner_id);
drop policy if exists "vendor_spaces_owner_write" on vendor_spaces;
create policy "vendor_spaces_owner_write" on vendor_spaces for all
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "creator_support_private" on creator_support;
create policy "creator_support_private" on creator_support for all
  using (auth.uid() = supporter_id or auth.uid() = vendor_id)
  with check (auth.uid() = supporter_id);
