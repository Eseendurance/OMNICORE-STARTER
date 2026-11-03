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
alter table social_posts add column if not exists is_hidden boolean not null default false;

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
alter table social_comments add column if not exists is_hidden boolean not null default false;
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

-- Buyers can claim vendor-entered orders using the verified email on their Kivo account.
alter table orders add column if not exists customer_email text;
alter table orders add column if not exists buyer_id uuid references auth.users(id) on delete set null;

create table if not exists order_conversations (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references orders(id) on delete cascade,
  vendor_id uuid not null references vendors(id) on delete cascade,
  buyer_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table if not exists order_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references order_conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists order_messages_conversation_created_idx
  on order_messages (conversation_id, created_at);
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'order_messages'
     ) then
    alter publication supabase_realtime add table public.order_messages;
  end if;
end;
$$;

create table if not exists purchase_reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references orders(id) on delete cascade,
  buyer_id uuid not null references auth.users(id) on delete cascade,
  vendor_id uuid not null references vendors(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  rating integer not null check (rating between 1 and 5),
  body text not null check (char_length(body) between 5 and 1200),
  created_at timestamptz not null default now()
);
create index if not exists purchase_reviews_vendor_created_idx
  on purchase_reviews (vendor_id, created_at desc);

create table if not exists social_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid references social_posts(id) on delete cascade,
  comment_id uuid references social_comments(id) on delete cascade,
  reason text not null check (reason in ('spam', 'scam', 'harassment', 'unsafe', 'other')),
  details text check (details is null or char_length(details) <= 1000),
  status text not null default 'open' check (status in ('open', 'reviewed', 'actioned', 'dismissed')),
  moderator_id uuid references auth.users(id) on delete set null,
  moderator_note text check (moderator_note is null or char_length(moderator_note) <= 1000),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  check ((post_id is null) <> (comment_id is null))
);
create unique index if not exists social_reports_post_reporter_unique
  on social_reports (reporter_id, post_id) where post_id is not null;
create unique index if not exists social_reports_comment_reporter_unique
  on social_reports (reporter_id, comment_id) where comment_id is not null;
create index if not exists social_reports_queue_idx on social_reports (status, created_at);

create table if not exists support_payments (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  supporter_id uuid not null references auth.users(id) on delete restrict,
  vendor_id uuid not null references vendors(id) on delete cascade,
  purpose text not null check (purpose in ('tip', 'membership')),
  amount integer not null check (amount between 100 and 10000000),
  note text check (note is null or char_length(note) <= 240),
  membership_days integer check (membership_days is null or membership_days between 1 and 366),
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  provider_reference text unique,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  check ((purpose = 'tip' and membership_days is null) or (purpose = 'membership' and membership_days is not null))
);
alter table creator_support add column if not exists payment_id uuid references support_payments(id) on delete set null;
create unique index if not exists creator_support_payment_unique
  on creator_support (payment_id) where payment_id is not null;
create table if not exists creator_memberships (
  id uuid primary key default gen_random_uuid(),
  supporter_id uuid not null references auth.users(id) on delete cascade,
  vendor_id uuid not null references vendors(id) on delete cascade,
  payment_id uuid not null unique references support_payments(id) on delete restrict,
  starts_at timestamptz not null default now(),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  check (expires_at > starts_at)
);
create index if not exists creator_memberships_active_idx
  on creator_memberships (vendor_id, expires_at desc);

create or replace function prevent_order_buyer_tampering()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if tg_op = 'INSERT' then
    if current_user = 'authenticated' and new.buyer_id is not null then
      raise exception 'Buyer ownership is claimed by the buyer, not set by the vendor';
    end if;
  elsif tg_op = 'UPDATE' then
    if current_user = 'authenticated' and new.buyer_id is distinct from old.buyer_id then
      raise exception 'Buyer ownership is claimed by the buyer, not set by the vendor';
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists orders_prevent_buyer_tampering on orders;
create trigger orders_prevent_buyer_tampering
before insert or update of buyer_id on orders
for each row execute function prevent_order_buyer_tampering();

create or replace function claim_verified_email_orders()
returns integer
language plpgsql security definer
set search_path = public, auth, pg_temp
as $$
declare
  account_email text;
  claimed_count integer;
begin
  select lower(email) into account_email
  from auth.users
  where id = auth.uid() and email_confirmed_at is not null;
  if account_email is null then
    raise exception 'Confirm your account email before claiming orders';
  end if;

  update orders
  set buyer_id = auth.uid()
  where buyer_id is null and lower(customer_email) = account_email;
  get diagnostics claimed_count = row_count;

  insert into order_conversations (order_id, vendor_id, buyer_id)
  select id, vendor_id, auth.uid()
  from orders
  where buyer_id = auth.uid()
  on conflict (order_id) do nothing;
  return claimed_count;
end;
$$;
revoke all on function claim_verified_email_orders() from public, anon;
grant execute on function claim_verified_email_orders() to authenticated;

create or replace function confirm_my_order_delivered(order_id_input uuid)
returns boolean
language plpgsql security definer
set search_path = public, pg_temp
as $$
begin
  update orders set status = 'delivered'
  where id = order_id_input and buyer_id = auth.uid() and status = 'shipped';
  return found;
end;
$$;
revoke all on function confirm_my_order_delivered(uuid) from public, anon;
grant execute on function confirm_my_order_delivered(uuid) to authenticated;

create or replace function validate_purchase_review()
returns trigger
language plpgsql security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1 from orders o
    where o.id = new.order_id and o.buyer_id = new.buyer_id
      and o.vendor_id = new.vendor_id and o.product_id is not distinct from new.product_id
      and o.status = 'delivered'
  ) then
    raise exception 'Reviews require a delivered order claimed by its buyer';
  end if;
  return new;
end;
$$;
drop trigger if exists purchase_reviews_verify_order on purchase_reviews;
create trigger purchase_reviews_verify_order
before insert or update on purchase_reviews
for each row execute function validate_purchase_review();

create or replace function is_kivo_moderator()
returns boolean language sql stable set search_path = public, pg_temp as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role' = 'moderator', false)
      or coalesce(auth.jwt() -> 'app_metadata' ->> 'role' = 'admin', false)
$$;

create or replace function prevent_self_hiding_social_content()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if current_user = 'authenticated' and new.is_hidden is distinct from old.is_hidden then
    raise exception 'Content visibility can only be changed by Kivo moderation';
  end if;
  return new;
end;
$$;
drop trigger if exists social_posts_prevent_self_hiding on social_posts;
create trigger social_posts_prevent_self_hiding
before update of is_hidden on social_posts
for each row execute function prevent_self_hiding_social_content();
drop trigger if exists social_comments_prevent_self_hiding on social_comments;
create trigger social_comments_prevent_self_hiding
before update of is_hidden on social_comments
for each row execute function prevent_self_hiding_social_content();

create or replace function moderate_social_report(
  report_id_input uuid,
  status_input text,
  note_input text default null
)
returns boolean
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  report_row social_reports%rowtype;
begin
  if not is_kivo_moderator() then raise exception 'Moderator access required'; end if;
  if status_input not in ('reviewed', 'actioned', 'dismissed') or
     (note_input is not null and char_length(note_input) > 1000) then
    raise exception 'Invalid moderation action';
  end if;
  select * into report_row from social_reports where id = report_id_input for update;
  if not found then return false; end if;

  if status_input = 'actioned' then
    if report_row.post_id is not null then
      update social_posts set is_hidden = true where id = report_row.post_id;
    else
      update social_comments set is_hidden = true where id = report_row.comment_id;
    end if;
  end if;
  update social_reports
  set status = status_input, moderator_id = auth.uid(), moderator_note = note_input, reviewed_at = now()
  where id = report_id_input;
  return true;
end;
$$;
revoke all on function moderate_social_report(uuid, text, text) from public, anon;
grant execute on function moderate_social_report(uuid, text, text) to authenticated;

create or replace function finalize_support_payment(reference_input text, provider_reference_input text)
returns boolean
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  payment_row support_payments%rowtype;
  membership_start timestamptz;
begin
  select * into payment_row from support_payments
  where reference = reference_input for update;
  if not found then raise exception 'Payment reference not found'; end if;
  if payment_row.status = 'paid' then return false; end if;

  update support_payments
  set status = 'paid', provider_reference = provider_reference_input, paid_at = now()
  where id = payment_row.id;

  if payment_row.purpose = 'tip' then
    insert into creator_support (supporter_id, vendor_id, amount, note, payment_id)
    values (payment_row.supporter_id, payment_row.vendor_id, payment_row.amount,
      payment_row.note, payment_row.id)
    on conflict (payment_id) where payment_id is not null do nothing;
  else
    perform pg_advisory_xact_lock(hashtextextended(
      payment_row.supporter_id::text || ':' || payment_row.vendor_id::text, 0
    ));
    select greatest(now(), coalesce(max(expires_at), now())) into membership_start
    from creator_memberships
    where supporter_id = payment_row.supporter_id and vendor_id = payment_row.vendor_id;
    insert into creator_memberships (supporter_id, vendor_id, payment_id, starts_at, expires_at)
    values (payment_row.supporter_id, payment_row.vendor_id, payment_row.id,
      membership_start, membership_start + make_interval(days => payment_row.membership_days))
    on conflict (payment_id) do nothing;
  end if;
  return true;
end;
$$;
revoke all on function finalize_support_payment(text, text) from public, anon, authenticated;
grant execute on function finalize_support_payment(text, text) to service_role;

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
alter table social_rate_limits drop constraint if exists social_rate_limits_action_check;
alter table social_rate_limits add constraint social_rate_limits_action_check
  check (action in ('post', 'comment', 'message', 'report', 'support'));
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
  if action_name not in ('post', 'comment', 'message', 'report') or maximum_requests < 1 or window_seconds < 1 or window_seconds > 3600 then
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
revoke all on function consume_social_rate_limit(text, integer, integer) from public, anon, authenticated;

create or replace function consume_support_start_limit(user_id_input uuid)
returns boolean
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  bucket_start timestamptz;
  current_count integer;
begin
  if coalesce(auth.role(), '') <> 'service_role' or user_id_input is null then
    raise exception 'Trusted server access required';
  end if;
  bucket_start := to_timestamp(floor(extract(epoch from now()) / 3600) * 3600);
  delete from social_rate_limits where window_start < now() - interval '24 hours';
  insert into social_rate_limits (user_id, action, window_start, request_count)
  values (user_id_input, 'support', bucket_start, 1)
  on conflict (user_id, action, window_start)
  do update set request_count = social_rate_limits.request_count + 1
  returning request_count into current_count;
  return current_count <= 5;
end;
$$;
revoke all on function consume_support_start_limit(uuid) from public, anon, authenticated;
grant execute on function consume_support_start_limit(uuid) to service_role;

-- Enforce limits for direct Supabase writes too, not only app API requests.
create or replace function enforce_social_write_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  action_name text;
  limit_count integer;
  window_size integer;
  request_allowed boolean;
begin
  if tg_table_name = 'social_posts' then
    if new.kind = 'shipped' then return new; end if;
    action_name := 'post';
    limit_count := 3;
    window_size := 60;
  elsif tg_table_name = 'social_comments' then
    action_name := 'comment';
    limit_count := 5;
    window_size := 60;
  elsif tg_table_name = 'order_messages' then
    action_name := 'message';
    limit_count := 20;
    window_size := 60;
  elsif tg_table_name = 'social_reports' then
    action_name := 'report';
    limit_count := 5;
    window_size := 3600;
  else
    raise exception 'Unsupported social rate-limit target';
  end if;

  select result.allowed into request_allowed
  from consume_social_rate_limit(action_name, limit_count, window_size) as result;

  if not coalesce(request_allowed, false) then
    raise exception using errcode = 'P0001', message = 'Rate limit exceeded';
  end if;
  return new;
end;
$$;
revoke all on function enforce_social_write_rate_limit() from public, anon, authenticated;

drop trigger if exists social_posts_enforce_rate_limit on social_posts;
create trigger social_posts_enforce_rate_limit
before insert on social_posts
for each row execute function enforce_social_write_rate_limit();
drop trigger if exists social_comments_enforce_rate_limit on social_comments;
create trigger social_comments_enforce_rate_limit
before insert on social_comments
for each row execute function enforce_social_write_rate_limit();
drop trigger if exists order_messages_enforce_rate_limit on order_messages;
create trigger order_messages_enforce_rate_limit
before insert on order_messages
for each row execute function enforce_social_write_rate_limit();
drop trigger if exists social_reports_enforce_rate_limit on social_reports;
create trigger social_reports_enforce_rate_limit
before insert on social_reports
for each row execute function enforce_social_write_rate_limit();

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
alter table order_conversations enable row level security;
alter table order_messages enable row level security;
alter table purchase_reviews enable row level security;
alter table social_reports enable row level security;
alter table support_payments enable row level security;
alter table creator_memberships enable row level security;

drop policy if exists "social_posts_public_read" on social_posts;
create policy "social_posts_public_read" on social_posts for select
  using (not is_hidden or auth.uid() = vendor_id or is_kivo_moderator());
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
create policy "social_comments_public_read" on social_comments for select
  using (not is_hidden or auth.uid() = author_id or is_kivo_moderator());
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
  using (
    privacy = 'public' or auth.uid() = owner_id or exists (
      select 1 from creator_memberships m
      where m.vendor_id = owner_id and m.supporter_id = auth.uid() and m.expires_at > now()
    )
  );
drop policy if exists "vendor_spaces_owner_write" on vendor_spaces;
create policy "vendor_spaces_owner_write" on vendor_spaces for all
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "creator_support_private" on creator_support;
drop policy if exists "creator_support_private_read" on creator_support;
create policy "creator_support_private_read" on creator_support for select
  using (auth.uid() = supporter_id or auth.uid() = vendor_id);
-- Inserts must come from a verified payment webhook using the service role.
-- No authenticated client insert/update/delete policy is intentionally provided.

drop policy if exists "orders_buyer_read" on orders;
create policy "orders_buyer_read" on orders for select using (auth.uid() = buyer_id);

drop policy if exists "order_conversations_participant_read" on order_conversations;
create policy "order_conversations_participant_read" on order_conversations for select
  using (auth.uid() = buyer_id or auth.uid() = vendor_id);
drop policy if exists "order_messages_participant_read" on order_messages;
create policy "order_messages_participant_read" on order_messages for select
  using (exists (
    select 1 from order_conversations c
    where c.id = conversation_id and (auth.uid() = c.buyer_id or auth.uid() = c.vendor_id)
  ));
drop policy if exists "order_messages_participant_insert" on order_messages;
create policy "order_messages_participant_insert" on order_messages for insert
  with check (
    auth.uid() = sender_id and exists (
      select 1 from order_conversations c
      where c.id = conversation_id and (auth.uid() = c.buyer_id or auth.uid() = c.vendor_id)
    )
  );

drop policy if exists "purchase_reviews_public_read" on purchase_reviews;
create policy "purchase_reviews_public_read" on purchase_reviews for select using (true);
drop policy if exists "purchase_reviews_verified_buyer_insert" on purchase_reviews;
create policy "purchase_reviews_verified_buyer_insert" on purchase_reviews for insert
  with check (auth.uid() = buyer_id);

drop policy if exists "social_reports_reporter_read" on social_reports;
create policy "social_reports_reporter_read" on social_reports for select using (auth.uid() = reporter_id);
drop policy if exists "social_reports_authenticated_insert" on social_reports;
create policy "social_reports_authenticated_insert" on social_reports for insert
  with check (auth.uid() = reporter_id);
drop policy if exists "social_reports_moderator_read" on social_reports;
create policy "social_reports_moderator_read" on social_reports for select using (is_kivo_moderator());
drop policy if exists "social_reports_moderator_update" on social_reports;
create policy "social_reports_moderator_update" on social_reports for update
  using (is_kivo_moderator()) with check (is_kivo_moderator() and moderator_id = auth.uid());

drop policy if exists "support_payments_private_read" on support_payments;
create policy "support_payments_private_read" on support_payments for select
  using (auth.uid() = supporter_id or auth.uid() = vendor_id);
drop policy if exists "creator_memberships_participant_read" on creator_memberships;
create policy "creator_memberships_participant_read" on creator_memberships for select
  using (auth.uid() = supporter_id or auth.uid() = vendor_id);
