-- Run this in Supabase SQL Editor to add the alerts log table
-- This prevents duplicate big-move alerts being sent multiple times per day

create table if not exists sent_alerts_log (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  ticker text not null,
  type text not null,
  sent_at timestamptz default now()
);

-- Index for fast lookups
create index if not exists sent_alerts_log_lookup
  on sent_alerts_log(user_id, ticker, type, sent_at);

-- Auto-clean logs older than 30 days (keeps table small)
create or replace function cleanup_old_alert_logs()
returns void language sql as $$
  delete from sent_alerts_log where sent_at < now() - interval '30 days';
$$;
