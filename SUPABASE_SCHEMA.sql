-- Run this in your Supabase SQL Editor (supabase.com → your project → SQL Editor)

-- Watchlist table
create table if not exists watchlist (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  ticker text not null,
  name text not null,
  sector text,
  created_at timestamptz default now(),
  unique(user_id, ticker)
);

-- Notes table (one note per ticker per user)
create table if not exists notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  ticker text not null,
  content text default '',
  updated_at timestamptz default now(),
  unique(user_id, ticker)
);

-- Price alerts table
create table if not exists alerts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  ticker text not null,
  type text not null check (type in ('above', 'below')),
  target_price numeric not null,
  triggered boolean default false,
  triggered_at timestamptz,
  created_at timestamptz default now()
);

-- Row Level Security (RLS) — users only see their own data
alter table watchlist enable row level security;
alter table notes enable row level security;
alter table alerts enable row level security;

create policy "Users manage own watchlist" on watchlist
  for all using (auth.uid() = user_id);

create policy "Users manage own notes" on notes
  for all using (auth.uid() = user_id);

create policy "Users manage own alerts" on alerts
  for all using (auth.uid() = user_id);
