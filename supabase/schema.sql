-- Execute no SQL Editor do seu projeto Supabase.
create table if not exists public.study_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint valid_state check (jsonb_typeof(state) = 'object')
);
alter table public.study_progress enable row level security;
revoke all on public.study_progress from anon;
grant select, insert, update on public.study_progress to authenticated;
drop policy if exists "Read own progress" on public.study_progress;
create policy "Read own progress" on public.study_progress for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Insert own progress" on public.study_progress;
create policy "Insert own progress" on public.study_progress for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Update own progress" on public.study_progress;
create policy "Update own progress" on public.study_progress for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
