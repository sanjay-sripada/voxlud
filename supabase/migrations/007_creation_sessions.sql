-- Live creation chat sessions (draft, before publish)
create table if not exists public.creation_sessions (
  id text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  messages jsonb not null default '[]'::jsonb,
  current_config jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists creation_sessions_user_id_idx on public.creation_sessions(user_id);
create index if not exists creation_sessions_updated_at_idx on public.creation_sessions(updated_at desc);

alter table public.creation_sessions enable row level security;

create policy "Users can view own creation sessions"
  on public.creation_sessions for select
  using (auth.uid() = user_id);

create policy "Users can create own creation sessions"
  on public.creation_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own creation sessions"
  on public.creation_sessions for update
  using (auth.uid() = user_id);

create policy "Users can delete own creation sessions"
  on public.creation_sessions for delete
  using (auth.uid() = user_id);

-- Persist chat on published games
alter table public.games
  add column if not exists chat_history jsonb not null default '[]'::jsonb;
