-- Run this once in Supabase: Project → SQL Editor → New query.
create table if not exists public.question_bank_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_key text not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, storage_key)
);

alter table public.question_bank_progress enable row level security;

create policy "Users can read their own progress"
  on public.question_bank_progress for select using ((select auth.uid()) = user_id);
create policy "Users can create their own progress"
  on public.question_bank_progress for insert with check ((select auth.uid()) = user_id);
create policy "Users can update their own progress"
  on public.question_bank_progress for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
