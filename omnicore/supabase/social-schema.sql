-- OmniCore social commerce extension.
-- Run after schema.sql. Every social record stays attached to a vendor,
-- product, order, or a named vendor space.

do $$ begin
  create type social_post_kind as enum ('product_drop', 'shipped', 'restock', 'reel');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type space_privacy as enum ('public', 'invite_only');
exception when duplicate_object then null;
end $$;

alter table vendors add column if not exists is_verified boolean not null default false;

create table if not exists vendor_follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  vendor_id uuid not null references vendors(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, vendor_id),
  check (follower_id <> vendor_id)
);
create index if not exists vendor_follows_vendor_idx on vendor_follows (vendor_id);

create or replace function refresh_vendor_follow_count()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_vendor_id uuid;
begin
  if tg_op = 'DELETE' then
    target_vendor_id := old.vendor_id;
  else
    target_vendor_id := new.vendor_id;
  end if;
  update vendors
  set followers = (select count(*)::integer from vendor_follows where vendor_id = target_vendor_id)
  where id = target_vendor_id;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists vendor_follows_refresh_count on vendor_follows;
create trigger vendor_follows_refresh_count
after insert or delete on vendor_follows
for each row execute function refresh_vendor_follow_count();
update vendors v
set followers = (select count(*)::integer from vendor_follows f where f.vendor_id = v.id);

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

-- Never let a browser client attach another vendor's product or fabricate dispatch proof.
create or replace function validate_social_post_links()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.kind = 'shipped' then
    if new.order_id is null or not exists (
      select 1 from orders o
      where o.id = new.order_id and o.vendor_id = new.vendor_id and o.status = 'shipped'
    ) then
      raise exception 'Dispatch proof must reference a shipped order belonging to this vendor';
    end if;
  else
    if new.product_id is null or not exists (
      select 1 from products p
      where p.id = new.product_id and p.vendor_id = new.vendor_id
    ) then
      raise exception 'Commerce updates must reference a product belonging to this vendor';
    end if;
    if new.order_id is not null then
      raise exception 'Only dispatch proof can reference an order';
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists social_posts_validate_links on social_posts;
create trigger social_posts_validate_links
before insert or update of vendor_id, product_id, order_id, kind on social_posts
for each row execute function validate_social_post_links();

create table if not exists social_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references social_posts(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 600),
  created_at timestamptz not null default now()
);
create index if not exists social_comments_post_created_idx
  on social_comments (post_id, created_at);

create table if not exists social_reactions (
  post_id uuid not null references social_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null default 'USEFUL' check (type in ('USEFUL', 'LIKE')),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
alter table social_reactions add column if not exists type text not null default 'USEFUL';
alter table social_reactions drop constraint if exists social_reactions_type_check;
alter table social_reactions add constraint social_reactions_type_check
  check (type in ('USEFUL', 'LIKE'));

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

-- Remove driver phone/waybill details from any early shipped posts created before this migration.
update social_posts p
set body = 'A parcel was dispatched from ' || coalesce(o.departure_terminal, 'the vendor desk') ||
    ' via ' || coalesce(o.transport_company, 'the selected carrier') || '.',
    route_label = coalesce(o.departure_terminal, 'Vendor dispatch') ||
    ' -> ' || coalesce(o.transport_company, 'Carrier')
from orders o
where p.order_id = o.id and p.kind = 'shipped';

-- Keep the earliest proof if an earlier app version retried dispatch and created duplicates.
delete from social_posts duplicate
using social_posts original
where duplicate.kind = 'shipped'
  and original.kind = 'shipped'
  and duplicate.order_id = original.order_id
  and duplicate.order_id is not null
  and (duplicate.created_at, duplicate.id) > (original.created_at, original.id);

-- A unique dispatch post per order makes retries idempotent.
create unique index if not exists social_posts_shipped_order_unique
  on social_posts (order_id) where kind = 'shipped' and order_id is not null;

-- Atomic per-user rate limits; unlike SELECT COUNT checks these cannot be raced.
create table if not exists social_rate_limits (
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null check (action in ('post', 'comment')),
  window_start timestamptz not null,
  request_count integer not null default 0 check (request_count > 0),
  primary key (user_id, action, window_start)
);
create index if not exists social_rate_limits_window_idx on social_rate_limits (window_start);
alter table social_rate_limits enable row level security;

-- Keep signal ranking current as people reply or leave a useful reaction.
create or replace function refresh_social_post_depth()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_post_id uuid;
begin
  target_post_id := coalesce(new.post_id, old.post_id);
  update social_posts
  set depth_score = 1
    + 2 * (select count(*) from social_comments where post_id = target_post_id)
    + least(10, (select count(*) from social_reactions where post_id = target_post_id))
  where id = target_post_id;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists social_comments_refresh_depth on social_comments;
create trigger social_comments_refresh_depth
after insert or delete on social_comments
for each row execute function refresh_social_post_depth();
drop trigger if exists social_reactions_refresh_depth on social_reactions;
create trigger social_reactions_refresh_depth
after insert or delete on social_reactions
for each row execute function refresh_social_post_depth();
update social_posts p
set depth_score = 1
  + 2 * (select count(*) from social_comments c where c.post_id = p.id)
  + least(10, (select count(*) from social_reactions r where r.post_id = p.id));

-- A vendor cannot grant itself verification or inflate follower totals.
create or replace function prevent_vendor_trust_tampering()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is not null and current_user = 'authenticated' and new.is_verified is distinct from old.is_verified then
    raise exception 'Verification status can only be changed by Kivo support';
  end if;
  if auth.uid() is not null and current_user = 'authenticated' and new.followers is distinct from old.followers then
    raise exception 'Follower totals are managed by Kivo';
  end if;
  return new;
end;
$$;
drop trigger if exists vendors_prevent_self_verification on vendors;
drop trigger if exists vendors_prevent_trust_tampering on vendors;
create trigger vendors_prevent_trust_tampering
before update of is_verified, followers on vendors
for each row execute function prevent_vendor_trust_tampering();

-- Prevent vendors from manually inflating signal scores through their own posts.
create or replace function prevent_social_signal_tampering()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is not null and current_user = 'authenticated'
     and new.depth_score is distinct from old.depth_score then
    raise exception 'Signal scores are calculated from community activity';
  end if;
  return new;
end;
$$;
drop trigger if exists social_posts_prevent_signal_tampering on social_posts;
create trigger social_posts_prevent_signal_tampering
before update of depth_score on social_posts
for each row execute function prevent_social_signal_tampering();

create or replace function consume_social_rate_limit(
  action_name text,
  maximum_requests integer,
  window_seconds integer
) returns table (allowed boolean, retry_after_seconds integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  bucket_start timestamptz;
  current_count integer;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;
  if action_name not in ('post', 'comment') or maximum_requests < 1 or window_seconds < 1 or window_seconds > 3600 then
    raise exception 'Invalid rate limit parameters';
  end if;

  bucket_start := to_timestamp(
    floor(extract(epoch from now()) / window_seconds) * window_seconds
  );

  delete from social_rate_limits where window_start < now() - interval '24 hours';

  insert into social_rate_limits (user_id, action, window_start, request_count)
  values (current_user_id, action_name, bucket_start, 1)
  on conflict (user_id, action, window_start)
  do update set request_count = social_rate_limits.request_count + 1
  returning request_count into current_count;

  return query select
    current_count <= maximum_requests,
    greatest(1, ceil(extract(epoch from (bucket_start + make_interval(secs => window_seconds) - now())))::integer);
end;
$$;
revoke all on function consume_social_rate_limit(text, integer, integer) from public;
grant execute on function consume_social_rate_limit(text, integer, integer) to authenticated;

-- A shipped-proof post is created only after the owning vendor's order is shipped.
create or replace function create_shipped_social_post(order_id_input uuid)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  shipment orders%rowtype;
  created_post_id uuid;
  dispatch_body text;
  dispatch_route text;
begin
  select * into shipment from orders where id = order_id_input;
  if not found or shipment.vendor_id <> auth.uid() then
    raise exception 'Order not found';
  end if;
  if shipment.status <> 'shipped' then
    raise exception 'Order is not marked shipped';
  end if;

  dispatch_body := 'A parcel was dispatched from ' || coalesce(shipment.departure_terminal, 'the vendor desk') ||
    ' via ' || coalesce(shipment.transport_company, 'the selected carrier') || '.';
  dispatch_route := coalesce(shipment.departure_terminal, 'Vendor dispatch') ||
    ' -> ' || coalesce(shipment.transport_company, 'Carrier');

  insert into social_posts (vendor_id, product_id, order_id, kind, body, route_label, depth_score)
  values (shipment.vendor_id, shipment.product_id, shipment.id, 'shipped', dispatch_body, dispatch_route, 1)
  on conflict (order_id) where kind = 'shipped' and order_id is not null
  do update set body = excluded.body, route_label = excluded.route_label
  returning id into created_post_id;
  return created_post_id;
end;
$$;
revoke all on function create_shipped_social_post(uuid) from public;
grant execute on function create_shipped_social_post(uuid) to authenticated;

alter table vendor_follows enable row level security;
alter table social_posts enable row level security;
alter table social_comments enable row level security;
alter table social_reactions enable row level security;
alter table vendor_spaces enable row level security;
alter table creator_support enable row level security;

drop policy if exists "social_posts_public_read" on social_posts;
create policy "social_posts_public_read" on social_posts for select using (true);
drop policy if exists "social_posts_vendor_write" on social_posts;
drop policy if exists "social_posts_vendor_insert" on social_posts;
drop policy if exists "social_posts_vendor_update" on social_posts;
drop policy if exists "social_posts_vendor_delete" on social_posts;
create policy "social_posts_vendor_insert" on social_posts for insert
  with check (auth.uid() = vendor_id and kind <> 'shipped');
create policy "social_posts_vendor_update" on social_posts for update
  using (auth.uid() = vendor_id and kind <> 'shipped')
  with check (auth.uid() = vendor_id and kind <> 'shipped');
create policy "social_posts_vendor_delete" on social_posts for delete
  using (auth.uid() = vendor_id and kind <> 'shipped');

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
drop policy if exists "creator_support_private_read" on creator_support;
create policy "creator_support_private_read" on creator_support for select
  using (auth.uid() = supporter_id or auth.uid() = vendor_id);
-- Inserts must come from a verified payment webhook using the service role.
-- No authenticated client insert/update/delete policy is intentionally provided.
