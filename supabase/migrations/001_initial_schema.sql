-- Voxlud production schema
-- Run in Supabase SQL Editor or via: supabase db push

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Games
create table if not exists public.games (
  id text primary key,
  user_id uuid references public.profiles(id) on delete set null,
  prompt text not null,
  config jsonb not null,
  author text not null,
  plays integer not null default 0,
  likes integer not null default 0,
  featured boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists games_user_id_idx on public.games(user_id);
create index if not exists games_created_at_idx on public.games(created_at desc);
create index if not exists games_featured_idx on public.games(featured) where featured = true;

alter table public.games enable row level security;

create policy "Games are viewable by everyone"
  on public.games for select using (true);

create policy "Authenticated users can create games"
  on public.games for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own games"
  on public.games for delete
  using (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1),
      'Player'
    ),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Atomic play/like counters (avoids open update policies)
create or replace function public.increment_game_plays(game_id text)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.games set plays = plays + 1 where id = game_id;
end;
$$;

create or replace function public.increment_game_likes(game_id text)
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  new_likes integer;
begin
  update public.games set likes = likes + 1 where id = game_id
  returning likes into new_likes;
  return coalesce(new_likes, 0);
end;
$$;

grant execute on function public.increment_game_plays(text) to anon, authenticated;
grant execute on function public.increment_game_likes(text) to anon, authenticated;

-- Seed demo games (idempotent)
insert into public.games (id, user_id, prompt, config, author, plays, likes, featured, created_at)
values
  (
    'demo-pong', null,
    'A two-player pong game where paddles shrink after every point',
    '{"type":"pong","mode":"local-multiplayer","title":"Shrinking Pong","description":"Classic paddle battle — paddles shrink after every point!","theme":{"primary":"#6366f1","secondary":"#818cf8","background":"#0f0f23","accent":"#f472b6"},"settings":{"shrinkPaddles":true,"speed":1,"ballSize":1}}'::jsonb,
    'Voxlud', 1247, 89, true, '2026-01-15T10:00:00Z'
  ),
  (
    'demo-runner', null,
    'A solo mobile runner where every tap flips gravity',
    '{"type":"runner","mode":"solo","title":"Gravity Flip Runner","description":"Dodge obstacles by flipping gravity on tap!","theme":{"primary":"#10b981","secondary":"#34d399","background":"#0a1a14","accent":"#fbbf24"},"settings":{"gravityFlip":true,"obstacleSpeed":1.2,"theme":"neon"}}'::jsonb,
    'Voxlud', 892, 67, true, '2026-01-20T14:30:00Z'
  ),
  (
    'demo-clicker', null,
    'A cozy cat cafe tycoon with upgrades and outfits',
    '{"type":"clicker","mode":"solo","title":"Cozy Cat Cafe","description":"Tap, upgrade, and build your purrfect cafe empire.","theme":{"primary":"#f97316","secondary":"#fb923c","background":"#1a1008","accent":"#a3e635"},"settings":{"upgrades":true,"autoClick":true,"theme":"cafe"}}'::jsonb,
    'Voxlud', 634, 52, true, '2026-02-01T09:00:00Z'
  ),
  (
    'demo-snake', null,
    'A puzzle game where snakes connect matching colors',
    '{"type":"snake","mode":"solo","title":"Color Connect Snake","description":"Grow your snake and match colors to score big.","theme":{"primary":"#8b5cf6","secondary":"#a78bfa","background":"#120a1f","accent":"#22d3ee"},"settings":{"colorMatch":true,"gridSize":16,"speed":150}}'::jsonb,
    'Voxlud', 445, 38, false, '2026-02-10T16:00:00Z'
  ),
  (
    'demo-breakout', null,
    'A fast brick breaker with power-ups and 3 lives',
    '{"type":"breakout","mode":"solo","title":"Power Brick Breaker","description":"Smash every brick and chase the high score.","theme":{"primary":"#f43f5e","secondary":"#fb7185","background":"#1a0a0f","accent":"#38bdf8"},"settings":{"rows":5,"powerUps":true,"lives":3}}'::jsonb,
    'Voxlud', 723, 61, true, '2026-02-15T11:00:00Z'
  )
on conflict (id) do nothing;
