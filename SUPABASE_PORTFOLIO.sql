-- Run this in Supabase SQL Editor to add the portfolio tracking table

create table if not exists portfolio (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  ticker text not null,
  owned boolean default false,
  shares numeric,
  purchase_date date,
  purchase_price numeric,
  tracking_date date,
  tracking_price numeric,
  updated_at timestamptz default now(),
  unique(user_id, ticker)
);

alter table portfolio enable row level security;

create policy "Users manage own portfolio" on portfolio
  for all using (auth.uid() = user_id);

-- Index for fast lookups
create index if not exists portfolio_user_idx on portfolio(user_id);
