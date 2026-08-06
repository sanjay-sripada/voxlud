-- Games are only visible after the creator publishes them
alter table public.games
  add column if not exists published boolean not null default false;

-- Existing seed / demo games stay public
update public.games set published = true where published = false;

create index if not exists games_published_idx on public.games(published) where published = true;
