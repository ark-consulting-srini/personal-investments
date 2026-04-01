-- ============================================================
-- Market Intelligence Schema
-- Run this in Supabase SQL Editor before deploying
-- ============================================================

-- 1. Market conditions snapshots (weekly automated + on-demand)
CREATE TABLE IF NOT EXISTS market_conditions (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  fetched_at    timestamptz NOT NULL DEFAULT now(),
  
  -- Regime assessment
  regime        text NOT NULL, -- goldilocks | inflationary_growth | stagflation | deflationary_slowdown
  confidence    integer,       -- 0-100
  description   text,
  growth_score  float,         -- -1 to +1
  inflation_score float,
  stress_score  float,
  favored_sectors text[],
  adverse_sectors text[],

  -- Key FRED indicators (latest values)
  cpi           float,         -- CPIAUCSL YoY
  ppi           float,         -- PPIACO
  fed_funds     float,         -- FEDFUNDS
  yield_10y     float,         -- DGS10
  yield_2y      float,         -- DGS2
  spread_2s10s  float,         -- T10Y2Y (negative = inverted)
  spread_3m10y  float,         -- T10Y3M
  breakeven_5y  float,         -- T5YIE inflation expectation
  pmi_mfg       float,         -- NAPM manufacturing PMI
  unemployment  float,         -- UNRATE
  jobless_claims float,        -- ICSA weekly
  hy_spread     float,         -- BAMLH0A0HYM2 high yield spread
  ig_spread     float,         -- BAMLC0A0CM investment grade spread
  fin_stress    float,         -- STLFSI2 financial stress index
  consumer_sent float,         -- UMCSENT Michigan sentiment
  savings_rate  float,         -- PSAVERT personal savings
  lei_change    float,         -- USSLIND change (leading indicator)
  m2_change     float,         -- M2SL money supply change

  -- Market indicators (Yahoo Finance)
  vix           float,         -- ^VIX
  sp500_change  float,         -- ^GSPC day change %
  gold_change   float,         -- GLD day change %
  oil_change    float,         -- CL=F day change %
  dollar_change float,         -- DX-Y.NYB day change %
  
  -- Sector ETF performance vs SPY (relative strength)
  xlf_vs_spy    float,         -- Financials relative performance
  xle_vs_spy    float,         -- Energy
  xlk_vs_spy    float,         -- Technology
  xlv_vs_spy    float,         -- Healthcare
  xli_vs_spy    float,         -- Industrials
  xlp_vs_spy    float,         -- Staples (defensive)
  xlu_vs_spy    float,         -- Utilities (defensive)

  -- Sentiment
  fear_greed_score  float,     -- CNN F&G 0-100
  fear_greed_rating text,      -- extreme fear | fear | neutral | greed | extreme greed

  -- Yield curve shape
  yield_curve   jsonb,         -- full curve: {m1, m3, m6, y1, y2, y5, y10, y30}
  yield_inverted boolean,

  -- Claude's written analysis (generated separately)
  claude_analysis text,        -- narrative regime assessment
  claude_watchlist_impact text, -- how it affects user's watchlist specifically

  -- Full raw data for debugging
  raw_data      jsonb
);

-- Index for time-series queries
CREATE INDEX IF NOT EXISTS market_conditions_fetched_at_idx 
  ON market_conditions (fetched_at DESC);

-- 2. Macro alerts — when a key threshold is crossed
CREATE TABLE IF NOT EXISTS macro_alerts (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  timestamptz DEFAULT now(),
  alert_type  text NOT NULL,  -- regime_change | yield_inversion | vix_spike | credit_stress | fear_extreme
  severity    text NOT NULL,  -- info | warning | critical
  title       text NOT NULL,
  body        text,
  data        jsonb,
  acknowledged boolean DEFAULT false
);

-- Enable RLS
ALTER TABLE market_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE macro_alerts ENABLE ROW LEVEL SECURITY;

-- Public read (no personal data in these tables)
CREATE POLICY "Anyone can read market conditions"
  ON market_conditions FOR SELECT USING (true);

CREATE POLICY "Anyone can read macro alerts"
  ON macro_alerts FOR SELECT USING (true);

-- Service role can write (cron job uses service key)
CREATE POLICY "Service role can insert market conditions"
  ON market_conditions FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can insert macro alerts"
  ON macro_alerts FOR INSERT WITH CHECK (true);

