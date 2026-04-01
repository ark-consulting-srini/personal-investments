-- Research notes table — captures insights from Claude research sessions
-- Populated via: email-to-apex bridge, manual entry in app, or weekly digest capture

CREATE TABLE IF NOT EXISTS research_notes (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at    timestamptz DEFAULT now(),
  user_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE,

  -- What this note is about
  tickers       text[],           -- e.g. ['EOG', 'COP'] — can tag multiple
  title         text NOT NULL,    -- short headline
  content       text NOT NULL,    -- full research note / thesis
  note_type     text DEFAULT 'thesis',  -- thesis | signal | warning | question | observation

  -- Source tracking
  source        text DEFAULT 'manual', -- manual | email | weekly_digest | chat
  source_ref    text,            -- email message ID, chat session ID, etc.

  -- Structure extracted by Claude
  sentiment     text,            -- bullish | bearish | neutral | watching
  conviction    integer,         -- 1-5
  time_horizon  text,            -- short | medium | long

  -- Searchable
  tags          text[]           -- free-form tags: ['AI', 'energy', 'moat', etc.]
);

-- Index for per-user queries
CREATE INDEX IF NOT EXISTS research_notes_user_idx ON research_notes (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS research_notes_ticker_idx ON research_notes USING GIN (tickers);

-- RLS
ALTER TABLE research_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own research notes"
  ON research_notes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
