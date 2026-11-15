-- =====================================================================
-- TrialOfDebris: accounts, profiles, passkeys, game progress, admin
-- Run after player_progress.sql. Safe to re-run (idempotent).
-- =====================================================================

create extension if not exists citext with schema extensions;

-- ---------------------------------------------------------------------
-- PROFILES: one row per auth user (guests included, username null)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username extensions.citext unique
    check (username is null or username ~ '^[A-Za-z0-9_]{3,20}$'),
  email text,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin')),
  is_guest boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Admin check used by policies and RPCs. SECURITY DEFINER so it can read
-- profiles without recursing through RLS.
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

drop policy if exists "Profiles: read own" on public.profiles;
drop policy if exists "Profiles: admins read all" on public.profiles;
drop policy if exists "Profiles: update own" on public.profiles;
create policy "Profiles: read own" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "Profiles: admins read all" on public.profiles
  for select to authenticated using ((select public.is_admin()));
create policy "Profiles: update own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Users may only change username and avatar_url. role/email/is_guest are
-- written only by triggers and server-side code.
revoke insert, update, delete on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (username, avatar_url) on public.profiles to authenticated;

-- updated_at helper (also created by player_progress.sql)
create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end; $$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- Automatic profile creation / sync from auth.users
-- Username comes from sign-up metadata. If it is missing, invalid or
-- already taken, the profile is still created (username null) so sign-up
-- never fails here; the app then asks the user to pick one.
-- ---------------------------------------------------------------------
create or replace function public.handle_auth_user_change() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  wanted text := nullif(trim(new.raw_user_meta_data ->> 'username'), '');
  final_name text := null;
begin
  if wanted is not null and wanted ~ '^[A-Za-z0-9_]{3,20}$'
     and not exists (select 1 from public.profiles p
                     where p.username = wanted::extensions.citext and p.id <> new.id) then
    final_name := wanted;
  end if;

  insert into public.profiles (id, username, email, is_guest)
  values (new.id, final_name, new.email, coalesce(new.is_anonymous, false))
  on conflict (id) do update
    set email = excluded.email,
        is_guest = excluded.is_guest,
        username = coalesce(public.profiles.username, excluded.username);
  return new;
exception when others then
  -- Never block auth on a profile problem.
  raise warning 'profile sync failed for %: %', new.id, sqlerrm;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_auth_user_change();

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
  after update of email, is_anonymous, raw_user_meta_data on auth.users
  for each row execute function public.handle_auth_user_change();

-- Backfill profiles for users that already exist (guests from cloud save).
insert into public.profiles (id, username, email, is_guest)
select u.id, null, u.email, coalesce(u.is_anonymous, false)
from auth.users u
on conflict (id) do nothing;

-- Username availability check for the sign-up form (no data leak: boolean only).
create or replace function public.username_available(name text) returns boolean
language sql stable security definer set search_path = '' as $$
  select name ~ '^[A-Za-z0-9_]{3,20}$'
     and not exists (select 1 from public.profiles where username = name::extensions.citext);
$$;
revoke all on function public.username_available(text) from public;
grant execute on function public.username_available(text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- PASSKEY CREDENTIALS: public-key metadata only. No biometric data ever.
-- Inserted/updated only by the Edge Function (service role).
-- ---------------------------------------------------------------------
create table if not exists public.passkey_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  credential_id text not null unique,          -- base64url
  public_key text not null,                    -- base64url COSE public key
  counter bigint not null default 0,
  transports text[] not null default '{}',
  device_type text,                            -- singleDevice | multiDevice
  backed_up boolean not null default false,
  nickname text,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);
create index if not exists passkey_credentials_user_idx on public.passkey_credentials (user_id);

alter table public.passkey_credentials enable row level security;
drop policy if exists "Passkeys: read own" on public.passkey_credentials;
drop policy if exists "Passkeys: delete own" on public.passkey_credentials;
create policy "Passkeys: read own" on public.passkey_credentials
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Passkeys: delete own" on public.passkey_credentials
  for delete to authenticated using ((select auth.uid()) = user_id);
revoke insert, update on public.passkey_credentials from anon, authenticated;
revoke all on public.passkey_credentials from anon;
grant select, delete on public.passkey_credentials to authenticated;

-- ---------------------------------------------------------------------
-- WEBAUTHN CHALLENGES: single-use, short-lived. Service role only.
-- ---------------------------------------------------------------------
create table if not exists public.webauthn_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  kind text not null check (kind in ('registration', 'authentication')),
  challenge text not null,
  rp_id text not null,
  client_ip text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '5 minutes',
  used_at timestamptz
);
create index if not exists webauthn_challenges_ip_idx on public.webauthn_challenges (client_ip, created_at);
alter table public.webauthn_challenges enable row level security;
revoke all on public.webauthn_challenges from anon, authenticated;

-- ---------------------------------------------------------------------
-- GAME PROGRESS: extend the existing player_progress table (keeps all
-- saved guest progress and the live cloud-save code working).
-- ---------------------------------------------------------------------
alter table public.player_progress add column if not exists achievements jsonb not null default '[]'::jsonb;
alter table public.player_progress add column if not exists scores jsonb not null default '{}'::jsonb;
alter table public.player_progress add column if not exists preferences jsonb not null default '{}'::jsonb;

drop policy if exists "Admins read all progress" on public.player_progress;
create policy "Admins read all progress" on public.player_progress
  for select to authenticated using ((select public.is_admin()));

-- ---------------------------------------------------------------------
-- ADMIN RPCs (aggregate stats + user list). Never expose passwords,
-- keys or credentials. Role changes happen only via SQL by the owner:
--   update public.profiles set role = 'admin' where email = 'you@example.com';
-- ---------------------------------------------------------------------
create or replace function public.admin_stats() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare result jsonb;
begin
  if not public.is_admin() then raise exception 'not authorized' using errcode = '42501'; end if;
  select jsonb_build_object(
    'total_users', (select count(*) from auth.users),
    'registered_users', (select count(*) from auth.users where not coalesce(is_anonymous, false)),
    'guest_players', (select count(*) from auth.users where coalesce(is_anonymous, false)),
    'verified_users', (select count(*) from auth.users where email_confirmed_at is not null and not coalesce(is_anonymous, false)),
    'users_with_passkeys', (select count(distinct user_id) from public.passkey_credentials),
    'passkeys', (select count(*) from public.passkey_credentials),
    'active_last_7_days', (select count(*) from auth.users where last_sign_in_at > now() - interval '7 days'),
    'players_with_progress', (select count(*) from public.player_progress where solved_count > 0),
    'cases_solved_total', (select coalesce(sum(solved_count), 0) from public.player_progress),
    'signups_by_day', (
      select coalesce(jsonb_agg(jsonb_build_object('day', d.day, 'registered', d.registered, 'guests', d.guests) order by d.day), '[]'::jsonb)
      from (
        select date_trunc('day', created_at)::date as day,
               count(*) filter (where not coalesce(is_anonymous, false)) as registered,
               count(*) filter (where coalesce(is_anonymous, false)) as guests
        from auth.users where created_at > now() - interval '14 days'
        group by 1
      ) d)
  ) into result;
  return result;
end; $$;
revoke all on function public.admin_stats() from public, anon;
grant execute on function public.admin_stats() to authenticated;

create or replace function public.admin_list_users(include_guests boolean default false, max_rows int default 200)
returns table (id uuid, username text, email text, role text, is_guest boolean, email_verified boolean,
               banned boolean, passkeys bigint, solved_count int, created_at timestamptz, last_sign_in_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'not authorized' using errcode = '42501'; end if;
  return query
    select u.id, p.username::text, u.email::text, coalesce(p.role, 'user'), coalesce(u.is_anonymous, false),
           (u.email_confirmed_at is not null), (u.banned_until is not null and u.banned_until > now()),
           (select count(*) from public.passkey_credentials c where c.user_id = u.id),
           coalesce(pp.solved_count, 0)::int, u.created_at, u.last_sign_in_at
    from auth.users u
    left join public.profiles p on p.id = u.id
    left join public.player_progress pp on pp.user_id = u.id
    where include_guests or not coalesce(u.is_anonymous, false)
    order by u.created_at desc
    limit least(greatest(max_rows, 1), 1000);
end; $$;
revoke all on function public.admin_list_users(boolean, int) from public, anon;
grant execute on function public.admin_list_users(boolean, int) to authenticated;

-- Housekeeping: drop expired challenges (called by the Edge Function).
create or replace function public.purge_webauthn_challenges() returns void
language sql security definer set search_path = '' as $$
  delete from public.webauthn_challenges where expires_at < now() - interval '1 hour';
$$;
revoke all on function public.purge_webauthn_challenges() from public, anon, authenticated;
