-- TrialOfDebris cloud save: one row per anonymous player, readable/writable only by that player.
-- Run in the Supabase SQL Editor. Also requires Authentication > Sign In / Providers >
-- "Allow anonymous sign-ins" to be on.
create table if not exists public.player_progress (
  user_id uuid primary key references auth.users (id) on delete cascade default auth.uid(),
  progress jsonb not null default '{}'::jsonb,
  solved_count smallint not null default 0 check (solved_count between 0 and 24),
  updated_at timestamptz not null default now()
);

alter table public.player_progress enable row level security;

drop policy if exists "Players read own progress" on public.player_progress;
drop policy if exists "Players insert own progress" on public.player_progress;
drop policy if exists "Players update own progress" on public.player_progress;
create policy "Players read own progress" on public.player_progress
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Players insert own progress" on public.player_progress
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Players update own progress" on public.player_progress
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end; $$;

drop trigger if exists player_progress_touch on public.player_progress;
create trigger player_progress_touch before update on public.player_progress
  for each row execute function public.touch_updated_at();
