-- Run this in Supabase SQL Editor

-- Risk profile table
create table if not exists risk_profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  answers jsonb default '{}',
  goals text[] default '{}',
  additional_context text default '',
  updated_at timestamptz default now(),
  unique(user_id)
);

-- AI insights / briefing history table
create table if not exists ai_insights (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  type text default 'briefing',
  created_at timestamptz default now()
);

-- RLS
alter table risk_profiles enable row level security;
alter table ai_insights enable row level security;

create policy "Users manage own risk profile" on risk_profiles
  for all using (auth.uid() = user_id);

create policy "Users manage own ai insights" on ai_insights
  for all using (auth.uid() = user_id);

-- Add unique constraint for chat history upsert (run this if not already present)
-- This allows the chat history to be saved/updated per user
ALTER TABLE ai_insights ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS ai_insights_user_type_unique 
ON ai_insights (user_id, type) 
WHERE type = 'chat_history';
