-- Run this script in the Supabase SQL Editor before using the client or admin features.
-- Never expose a service-role key in the static website.
-- After creating Icare's auth account, assign its trusted app_metadata role in the SQL Editor:
-- update auth.users
-- set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
-- where email = 'icare@example.com';
-- Replace the example email with the administrator account; do not use user_metadata for admin roles.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Client',
  email text not null default '',
  created_at timestamptz not null default now()
);
alter table public.profiles add column if not exists email text not null default '';

create or replace function public.create_profile_for_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, email)
  values (new.id, coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), 'Client'), coalesce(new.email, ''))
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute function public.create_profile_for_user();

drop trigger if exists on_auth_user_email_updated_profile on auth.users;
create trigger on_auth_user_email_updated_profile
  after update of email on auth.users
  for each row execute function public.create_profile_for_user();
update public.profiles p set email = u.email
from auth.users u where p.id = u.id and p.email is distinct from coalesce(u.email, '');

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('roblox', 'discord', 'graphisme', 'coaching', 'strategy')),
  description text not null,
  price text not null,
  stock_status text not null default 'available' check (stock_status in ('available', 'soldout', 'upcoming')),
  release_at timestamptz,
  promo text,
  original_price text,
  is_featured boolean not null default false,
  is_promo boolean not null default false,
  images jsonb not null default '[]'::jsonb check (jsonb_typeof(images) = 'array'),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.products add column if not exists original_price text;
alter table public.products add column if not exists is_featured boolean not null default false;
alter table public.products add column if not exists is_promo boolean not null default false;
alter table public.products add column if not exists images jsonb not null default '[]'::jsonb;

create table if not exists public.site_stats (
  key text primary key check (key ~ '^[a-z][a-z0-9_-]{0,39}$'),
  value text not null,
  suffix text not null default '',
  label_fr text not null,
  label_en text not null,
  sort_order integer not null default 0
);
delete from public.site_stats
where (key, value, suffix, label_fr, label_en, sort_order) in (
  ('servers', '50', '+', 'serveurs accompagnés', 'servers supported', 1),
  ('community', '10', 'k+', 'membres touchés', 'community members reached', 2),
  ('expertise', '4', '', 'pôles d''expertise', 'areas of expertise', 3),
  ('curiosity', '∞', '', 'curiosité en stock', 'curiosity in stock', 4)
);

create table if not exists public.portfolio_projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  tags text[] not null default '{}',
  images text[] not null default '{}',
  project_value text not null default '',
  project_cost text not null default '',
  duration text not null default '',
  challenges text not null default '',
  solutions text not null default '',
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.portfolio_projects add column if not exists tags text[] not null default '{}';
alter table public.portfolio_projects add column if not exists id uuid default gen_random_uuid();
alter table public.portfolio_projects add column if not exists title text not null default '';
alter table public.portfolio_projects add column if not exists description text not null default '';
alter table public.portfolio_projects add column if not exists images text[] not null default '{}';
alter table public.portfolio_projects add column if not exists project_value text not null default '';
alter table public.portfolio_projects add column if not exists project_cost text not null default '';
alter table public.portfolio_projects add column if not exists duration text not null default '';
alter table public.portfolio_projects add column if not exists challenges text not null default '';
alter table public.portfolio_projects add column if not exists solutions text not null default '';
alter table public.portfolio_projects add column if not exists demo_url text;
alter table public.portfolio_projects add column if not exists source_url text;
alter table public.portfolio_projects add column if not exists sort_order integer not null default 0;
alter table public.portfolio_projects add column if not exists active boolean not null default true;
alter table public.portfolio_projects add column if not exists created_at timestamptz not null default now();
alter table public.portfolio_projects add column if not exists updated_at timestamptz not null default now();
create index if not exists portfolio_projects_order_idx on public.portfolio_projects (sort_order, created_at desc);

create table if not exists public.promo_codes (
  code text primary key check (code ~ '^[A-Z0-9_-]{1,32}$'),
  discount_percent smallint not null check (discount_percent between 1 and 100),
  active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  id integer primary key default 1 check (id = 1),
  maintenance_enabled boolean not null default false,
  maintenance_title text not null default 'On peaufine quelque chose.',
  maintenance_message text not null default 'Icare Studio revient très bientôt. Merci pour votre patience.',
  maintenance_end timestamptz,
  accent_color text not null default '#94baff' check (accent_color ~ '^#[0-9A-Fa-f]{6}$'),
  availability text not null default 'open' check (availability in ('open', 'limited', 'closed')),
  meta_title text,
  meta_description text,
  keywords text,
  og_image text,
  site_url text not null default 'https://icare.dev',
  legal_updated_at date,
  legal_notice text,
  legal_terms text,
  legal_sales text,
  legal_privacy text,
  profile_banner_mode text not null default 'discord' check (profile_banner_mode in ('discord', 'custom')),
  profile_banner_url text,
  updated_at timestamptz not null default now()
);
alter table public.site_settings add column if not exists meta_title text;
alter table public.site_settings add column if not exists meta_description text;
alter table public.site_settings add column if not exists keywords text;
alter table public.site_settings add column if not exists og_image text;
alter table public.site_settings add column if not exists site_url text not null default 'https://icare.dev';
alter table public.site_settings add column if not exists legal_updated_at date;
alter table public.site_settings add column if not exists legal_notice text;
alter table public.site_settings add column if not exists legal_terms text;
alter table public.site_settings add column if not exists legal_sales text;
alter table public.site_settings add column if not exists legal_privacy text;
alter table public.site_settings add column if not exists legal_business_status text;
alter table public.site_settings add column if not exists legal_registration text;
alter table public.site_settings add column if not exists legal_address text;
alter table public.site_settings add column if not exists legal_email text;
alter table public.site_settings add column if not exists legal_director text;
alter table public.site_settings add column if not exists legal_mediator text;
alter table public.site_settings add column if not exists profile_banner_mode text not null default 'discord';
alter table public.site_settings add column if not exists profile_banner_url text;
insert into public.site_settings (id) values (1) on conflict (id) do nothing;

create table if not exists public.changelog (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'open' check (status in ('open', 'closed')),
  subject text not null default 'other' check (subject in ('discord', 'roblox', 'coaching', 'other')),
  order_status text not null default 'requested' check (order_status in ('requested', 'discussion', 'awaiting_payment', 'in_progress', 'testing', 'delivered')),
  order_consent_at timestamptz,
  order_consent_product text,
  order_details text,
  order_terms_accepted_at timestamptz,
  order_start_early_at timestamptz,
  paypal_payment_url text,
  order_price text,
  order_eta text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.conversations add column if not exists order_status text not null default 'requested';
alter table public.conversations add column if not exists order_consent_at timestamptz;
alter table public.conversations add column if not exists order_consent_product text;
alter table public.conversations add column if not exists order_details text;
alter table public.conversations add column if not exists order_terms_accepted_at timestamptz;
alter table public.conversations add column if not exists order_start_early_at timestamptz;
alter table public.conversations add column if not exists paypal_payment_url text;
alter table public.conversations add column if not exists order_price text;
alter table public.conversations add column if not exists order_eta text;
alter table public.conversations add column if not exists subject text not null default 'other';
alter table public.conversations drop constraint if exists conversations_order_status_check;
alter table public.conversations add constraint conversations_order_status_check
  check (order_status in ('requested', 'discussion', 'awaiting_payment', 'in_progress', 'testing', 'delivered'));
alter table public.conversations drop constraint if exists conversations_subject_check;
alter table public.conversations add constraint conversations_subject_check
  check (subject in ('discord', 'roblox', 'coaching', 'other'));
create index if not exists conversations_user_id_created_at_idx on public.conversations (user_id, created_at desc);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 2000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.messages add column if not exists read_at timestamptz;
create index if not exists messages_conversation_id_created_at_idx on public.messages (conversation_id, created_at);

create or replace function public.touch_conversation_on_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.conversations set updated_at = now() where id = new.conversation_id;
  return new;
end;
$$;
drop trigger if exists on_message_update_conversation on public.messages;
create trigger on_message_update_conversation
  after insert on public.messages
  for each row execute function public.touch_conversation_on_message();

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  body text not null check (char_length(body) between 1 and 600),
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  endpoint text not null unique,
  subscription jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'completed', 'rejected')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index if not exists account_deletion_requests_user_created_idx
  on public.account_deletion_requests (user_id, created_at desc);

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.site_settings enable row level security;
alter table public.changelog enable row level security;
alter table public.site_stats enable row level security;
alter table public.portfolio_projects enable row level security;
alter table public.promo_codes enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.reviews enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.account_deletion_requests enable row level security;

drop policy if exists "Profiles readable by owner or admin" on public.profiles;
create policy "Profiles readable by owner or admin" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));
drop policy if exists "Profiles updatable by owner" on public.profiles;
create policy "Profiles updatable by owner" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists "Active products are public" on public.products;
create policy "Active products are public" on public.products for select to anon, authenticated
  using (active or (select public.is_admin()));
drop policy if exists "Admins manage products" on public.products;
create policy "Admins manage products" on public.products for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "Settings are public to read" on public.site_settings;
create policy "Settings are public to read" on public.site_settings for select to anon, authenticated using (true);
drop policy if exists "Admins manage settings" on public.site_settings;
create policy "Admins manage settings" on public.site_settings for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "Changelog is public" on public.changelog; 
create policy "Changelog is public" on public.changelog for select to anon, authenticated using (true);
drop policy if exists "Admins manage changelog" on public.changelog;
create policy "Admins manage changelog" on public.changelog for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "Site statistics are public" on public.site_stats;
create policy "Site statistics are public" on public.site_stats for select to anon, authenticated using (true);
drop policy if exists "Admins manage site statistics" on public.site_stats;
create policy "Admins manage site statistics" on public.site_stats for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "Published portfolio projects are public" on public.portfolio_projects;
create policy "Published portfolio projects are public" on public.portfolio_projects for select to anon, authenticated
  using (active or (select public.is_admin()));
drop policy if exists "Admins manage portfolio projects" on public.portfolio_projects;
create policy "Admins manage portfolio projects" on public.portfolio_projects for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "Active promo codes are public" on public.promo_codes;
create policy "Active promo codes are public" on public.promo_codes for select to anon, authenticated
  using (active and (expires_at is null or expires_at > now()) or (select public.is_admin()));
drop policy if exists "Admins manage promo codes" on public.promo_codes;
create policy "Admins manage promo codes" on public.promo_codes for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "Owners and admins read conversations" on public.conversations;
create policy "Owners and admins read conversations" on public.conversations for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
drop policy if exists "Users create own conversations" on public.conversations;
create policy "Users create own conversations" on public.conversations for insert to authenticated
  with check (user_id = (select auth.uid()));
drop policy if exists "Admins update conversations" on public.conversations;
create policy "Admins update conversations" on public.conversations for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "Owners and admins delete conversations" on public.conversations;
create policy "Owners and admins delete conversations" on public.conversations for delete to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "Participants read messages" on public.messages;
create policy "Participants read messages" on public.messages for select to authenticated
  using (
    (select public.is_admin()) or exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.user_id = (select auth.uid())
    )
  );
drop policy if exists "Participants send messages" on public.messages;
create policy "Participants send messages" on public.messages for insert to authenticated
  with check (
    sender_id = (select auth.uid()) and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.user_id = (select auth.uid()) or (select public.is_admin()))
        and (c.status = 'open' or (select public.is_admin()))
    )
  );
drop policy if exists "Participants mark received messages read" on public.messages;
create policy "Participants mark received messages read" on public.messages for update to authenticated
  using (
    (select public.is_admin()) or exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.user_id = (select auth.uid()) and sender_id <> (select auth.uid())
    )
  )
  with check (
    (select public.is_admin()) or exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.user_id = (select auth.uid()) and sender_id <> (select auth.uid())
    )
  );

drop policy if exists "Approved reviews are public" on public.reviews;
create policy "Approved reviews are public" on public.reviews for select to anon, authenticated
  using (approved or (select public.is_admin()));
drop policy if exists "Authenticated users submit own reviews" on public.reviews;
create policy "Authenticated users submit own reviews" on public.reviews for insert to authenticated
  with check (user_id = (select auth.uid()) and approved = false);
drop policy if exists "Admins moderate reviews" on public.reviews;
create policy "Admins moderate reviews" on public.reviews for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "Users manage own push subscriptions" on public.push_subscriptions;
create policy "Users manage own push subscriptions" on public.push_subscriptions for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists "Admins read push subscriptions" on public.push_subscriptions;
create policy "Admins read push subscriptions" on public.push_subscriptions for select to authenticated
  using ((select public.is_admin()));

drop policy if exists "Users request own account deletion" on public.account_deletion_requests;
create policy "Users request own account deletion" on public.account_deletion_requests for insert to authenticated
  with check (user_id = (select auth.uid()));
drop policy if exists "Users read own account deletion requests" on public.account_deletion_requests;
create policy "Users read own account deletion requests" on public.account_deletion_requests for select to authenticated
  using (user_id = (select auth.uid()));
drop policy if exists "Admins manage account deletion requests" on public.account_deletion_requests;
create policy "Admins manage account deletion requests" on public.account_deletion_requests for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('banners', 'banners', true, 8388608, array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']),
  ('products', 'products', true, 8388608, array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']),
  ('portfolio', 'portfolio', true, 8388608, array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public reads site images" on storage.objects;
create policy "Public reads site images" on storage.objects for select to anon, authenticated
  using (bucket_id in ('banners', 'products', 'portfolio'));
drop policy if exists "Users upload own site images" on storage.objects;
drop policy if exists "Admins manage site images" on storage.objects;
create policy "Admins manage site images" on storage.objects for all to authenticated
  using (bucket_id in ('banners', 'products', 'portfolio') and (select public.is_admin()))
  with check (bucket_id in ('banners', 'products', 'portfolio') and (select public.is_admin()));

grant usage on schema public to anon, authenticated;
grant select on public.products, public.site_settings, public.changelog to anon, authenticated;
grant select, insert, update, delete on public.products, public.site_settings, public.changelog to authenticated;
grant select on public.site_stats to anon, authenticated;
grant select, insert, update, delete on public.site_stats to authenticated;
grant select on public.portfolio_projects to anon, authenticated;
grant select, insert, update, delete on public.portfolio_projects to authenticated;
grant select on public.promo_codes to anon, authenticated;
grant select, insert, update, delete on public.promo_codes to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select on public.profiles to authenticated;
grant select, insert, update on public.conversations to authenticated;
grant select, insert on public.messages to authenticated;
grant update (read_at) on public.messages to authenticated;
grant select, insert, update on public.reviews to authenticated;
grant select, insert, update on public.push_subscriptions to authenticated;
grant select, insert, update on public.account_deletion_requests to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'conversations'
  ) then
    alter publication supabase_realtime add table public.conversations;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'changelog'
  ) then
    alter publication supabase_realtime add table public.changelog;
  end if;
end
$$;


-- Partners + extended settings
create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  image_url text,
  theme_color text not null default '#94baff' check (theme_color ~ '^#[0-9A-Fa-f]{6}$'),
  links jsonb not null default '[]'::jsonb check (jsonb_typeof(links) = 'array'),
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists partners_order_idx on public.partners (sort_order, created_at desc);
alter table public.products drop constraint if exists products_category_check;
alter table public.products add constraint products_category_check
  check (category in ('roblox', 'discord', 'graphisme', 'coaching', 'strategy'));
alter table public.site_settings add column if not exists hero_banner_url text;
alter table public.site_settings add column if not exists language_flags jsonb not null default '{}'::jsonb;
alter table public.partners enable row level security;
drop policy if exists "Published partners are public" on public.partners;
create policy "Published partners are public" on public.partners for select to anon, authenticated
  using (active or (select public.is_admin()));
drop policy if exists "Admins manage partners" on public.partners;
create policy "Admins manage partners" on public.partners for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('partners', 'partners', true, 8388608, array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']),
  ('flags', 'flags', true, 2097152, array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'image/avif'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists "Public reads site images" on storage.objects;
create policy "Public reads site images" on storage.objects for select to anon, authenticated
  using (bucket_id in ('banners', 'products', 'portfolio', 'partners', 'flags'));
drop policy if exists "Admins manage site images" on storage.objects;
create policy "Admins manage site images" on storage.objects for all to authenticated
  using (bucket_id in ('banners', 'products', 'portfolio', 'partners', 'flags') and (select public.is_admin()))
  with check (bucket_id in ('banners', 'products', 'portfolio', 'partners', 'flags') and (select public.is_admin()));
grant select on public.partners to anon, authenticated;
grant select, insert, update, delete on public.partners to authenticated;
