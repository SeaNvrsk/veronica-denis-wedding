-- Tables for wedding-site

-- Guestbook entries
create table if not exists public.guestbook (
  id uuid primary key default gen_random_uuid(),
  author text not null,
  message text not null,
  emoji text,
  image_url text,
  video_url text,
  created_at timestamptz not null default now()
);

-- Quiz results (each submission)
create table if not exists public.quiz_results (
  id uuid primary key default gen_random_uuid(),
  score int not null,
  total int not null,
  answers jsonb not null,
  created_at timestamptz not null default now()
);

-- Minimal RLS suggestions (adjust as needed):
-- Enable RLS
alter table public.guestbook enable row level security;
alter table public.quiz_results enable row level security;

-- Allow public read
create policy if not exists "guestbook_read" on public.guestbook
  for select using (true);
create policy if not exists "quiz_results_read" on public.quiz_results
  for select using (true);

-- Allow public insert (you can restrict later with captcha / rate limit)
create policy if not exists "guestbook_insert" on public.guestbook
  for insert with check (true);
create policy if not exists "quiz_results_insert" on public.quiz_results
  for insert with check (true);

