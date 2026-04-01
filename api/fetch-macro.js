/**
 * /api/fetch-macro
 * 
 * Fetches economic pulse data from multiple free sources:
 *  - FRED API (25 series: inflation, yields, credit, growth, sentiment)
 *  - Yahoo Finance (19 tickers: VIX, sector ETFs, gold, oil, dollar)
 *  - CNN Fear & Greed Index (7 sub-indicators)
 *  - US Treasury Yield Curve (XML feed, no key needed)
 * 
 * Called by:
 *  - Weekly cron (Vercel) to store snapshot in Supabase
 *  - Market Intelligence page (on demand, fresh data)
 * 
 * Returns structured JSON ready for Claude regime analysis.
 */

// ─── FRED: fetch latest value for a series ────────────────────────────────────
async function fetchFredSeries(seriesId, apiKey, limit = 3) {
  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=${limit}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`FRED ${seriesId}: ${res.status}`)
  const data = await res.json()
  const obs = (data.observations || []).filter(o => o.value !== '.')
  if (!obs.length) return null
  return {
    series: seriesId,
    value: parseFloat(obs[0].value),
    date: obs[0].date,
    prev: obs[1] ? parseFloat(obs[1].value) : null,
    change: obs[1] ? parseFloat(obs[0].value) - parseFloat(obs[1].value) : null,
  }
}

// ─── Yahoo Finance: fetch latest price & change ───────────────────────────────
async function fetchYahooTicker(ticker) {
  const proxy = 'https://api.allorigins.win/get?url='
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=5d`
  const res = await fetch(`${proxy}${encodeURIComponent(url)}`)
  if (!res.ok) throw new Error(`Yahoo ${ticker}: ${res.status}`)
  const json = await res.json()
  const data = JSON.parse(json.contents)
  const meta = data?.chart?.result?.[0]?.meta
  if (!meta) throw new Error(`Yahoo ${ticker}: no data`)
  return {
    ticker,
    price: meta.regularMarketPrice,
    change: meta.regularMarketChangePercent,
    prev: meta.previousClose || meta.chartPreviousClose,
  }
}

// ─── CNN Fear & Greed ─────────────────────────────────────────────────────────
async function fetchFearGreed() {
  const proxy = 'https://api.allorigins.win/get?url='
  const url = 'https://production.dataviz.cnn.io/index/fearandgreed/graphdata'
  const res = await fetch(`${proxy}${encodeURIComponent(url)}`)
  if (!res.ok) throw new Error(`Fear & Greed: ${res.status}`)
  const json = await res.json()
  const data = JSON.parse(json.contents)
  const fg = data?.fear_and_greed
  const hist = data?.fear_and_greed_historical?.data || []
  
  // Get sub-indicators from latest data point  
  const indicators = {}
  if (data?.score) {
    Object.entries(data.score).forEach(([k, v]) => {
      if (k !== 'fear_and_greed') indicators[k] = v
    })
  }

  return {
    score: fg?.score,
    rating: fg?.rating,
    timestamp: fg?.timestamp,
    previous_close: fg?.previous_close,
    previous_1_week: fg?.previous_1_week,
    previous_1_month: fg?.previous_1_month,
    previous_1_year: fg?.previous_1_year,
    indicators,
  }
}

// ─── US Treasury Yield Curve ──────────────────────────────────────────────────
async function fetchYieldCurve() {
  const proxy = 'https://api.allorigins.win/get?url='
  const year = new Date().getFullYear()
  const url = `https://home.treasury.gov/resource-center/data-chart-center/interest-rates/pages/xml?data=daily_treasury_yield_curve&field_tdr_date_value=${year}`
  const res = await fetch(`${proxy}${encodeURIComponent(url)}`)
  if (!res.ok) throw new Error(`Treasury: ${res.status}`)
  const json = await res.json()
  const xml = json.contents

  // Parse XML to extract latest yield curve entry
  const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) || []
  if (!entries.length) return null

  // Get the last entry (most recent)
  const lastEntry = entries[entries.length - 1]
  const extract = (tag) => {
    const match = lastEntry.match(new RegExp(`<d:${tag}[^>]*>([^<]+)<`))
    return match ? parseFloat(match[1]) : null
  }
  const dateMatch = lastEntry.match(/<d:NEW_DATE>([^<]+)</)
  
  const curve = {
    date: dateMatch ? dateMatch[1].split('T')[0] : null,
    m1:  extract('BC_1MONTH'),
    m3:  extract('BC_3MONTH'),
    m6:  extract('BC_6MONTH'),
    y1:  extract('BC_1YEAR'),
    y2:  extract('BC_2YEAR'),
    y3:  extract('BC_3YEAR'),
    y5:  extract('BC_5YEAR'),
    y7:  extract('BC_7YEAR'),
    y10: extract('BC_10YEAR'),
    y20: extract('BC_20YEAR'),
    y30: extract('BC_30YEAR'),
  }
  
  // Compute key spreads
  curve.spread_2s10s = curve.y10 !== null && curve.y2 !== null ? 
    parseFloat((curve.y10 - curve.y2).toFixed(3)) : null
  curve.spread_3m10y = curve.y10 !== null && curve.m3 !== null ? 
    parseFloat((curve.y10 - curve.m3).toFixed(3)) : null
  curve.inverted = curve.spread_2s10s !== null ? curve.spread_2s10s < 0 : null

  return curve
}

// ─── Regime classifier ────────────────────────────────────────────────────────
function classifyRegime(data) {
  const signals = {
    growth: [],    // positive = growth improving
    inflation: [], // positive = inflation rising
    stress: [],    // positive = stress rising
    sentiment: [], // positive = sentiment improving
  }

  // Growth signals
  const pmi = data.fred?.NAPM?.value
  if (pmi) {
    signals.growth.push({ indicator: 'PMI', value: pmi, signal: pmi > 50 ? 1 : -1, weight: 3 })
  }
  const lei = data.fred?.USSLIND?.change
  if (lei !== null && lei !== undefined) {
    signals.growth.push({ indicator: 'LEI', value: lei, signal: lei > 0 ? 1 : -1, weight: 3 })
  }
  const jobless = data.fred?.ICSA?.change
  if (jobless !== null && jobless !== undefined) {
    signals.growth.push({ indicator: 'Jobless claims', value: jobless, signal: jobless < 0 ? 1 : -1, weight: 2 })
  }

  // Inflation signals
  const cpi = data.fred?.CPIAUCSL?.change
  if (cpi !== null && cpi !== undefined) {
    signals.inflation.push({ indicator: 'CPI MoM', value: cpi, signal: cpi > 0 ? 1 : -1, weight: 3 })
  }
  const breakeven = data.fred?.T5YIE?.value
  if (breakeven) {
    signals.inflation.push({ indicator: '5yr breakeven', value: breakeven, signal: breakeven > 2.5 ? 1 : -1, weight: 2 })
  }

  // Stress signals
  const hy = data.fred?.BAMLH0A0HYM2?.value
  if (hy) {
    signals.stress.push({ indicator: 'HY spread', value: hy, signal: hy > 4 ? 1 : -1, weight: 3 })
  }
  const vix = data.yahoo?.['%5EVIX']?.price || data.yahoo?.['%5EVIX']?.price
  const vixData = Object.values(data.yahoo || {}).find(t => t.ticker?.includes('VIX'))
  if (vixData?.price) {
    signals.stress.push({ indicator: 'VIX', value: vixData.price, signal: vixData.price > 25 ? 1 : -1, weight: 2 })
  }
  const yieldInverted = data.treasuryYieldCurve?.inverted
  if (yieldInverted !== null && yieldInverted !== undefined) {
    signals.stress.push({ indicator: 'Yield curve', value: yieldInverted, signal: yieldInverted ? 1 : -1, weight: 3 })
  }

  // Sentiment
  const fg = data.fearGreed?.score
  if (fg) {
    signals.sentiment.push({ indicator: 'Fear & Greed', value: fg, signal: fg < 40 ? -1 : fg > 60 ? 1 : 0, weight: 1 })
  }

  // Score each dimension
  const score = (arr) => {
    if (!arr.length) return 0
    const total = arr.reduce((s, x) => s + x.signal * x.weight, 0)
    const maxWeight = arr.reduce((s, x) => s + x.weight, 0)
    return total / maxWeight // -1 to +1
  }

  const growthScore = score(signals.growth)
  const inflationScore = score(signals.inflation)
  const stressScore = score(signals.stress)

  // Map to Dalio's four regimes
  let regime, confidence, description

  if (growthScore > 0 && inflationScore < 0) {
    regime = 'goldilocks'
    description = 'Rising growth, falling inflation — the best environment for equities broadly'
    confidence = Math.min(Math.abs(growthScore) * 50 + Math.abs(inflationScore) * 50, 95)
  } else if (growthScore > 0 && inflationScore > 0) {
    regime = 'inflationary_growth'
    description = 'Rising growth, rising inflation — favors real assets, energy, commodities, financials'
    confidence = Math.min(Math.abs(growthScore) * 50 + Math.abs(inflationScore) * 50, 95)
  } else if (growthScore < 0 && inflationScore > 0) {
    regime = 'stagflation'
    description = 'Falling growth, rising inflation — the hardest environment. Cash and commodities best'
    confidence = Math.min(Math.abs(growthScore) * 50 + Math.abs(inflationScore) * 50, 95)
  } else {
    regime = 'deflationary_slowdown'
    description = 'Falling growth, falling inflation — long bonds and quality equities hold up best'
    confidence = Math.min(Math.abs(growthScore) * 50 + Math.abs(inflationScore) * 50, 95)
  }

  return {
    regime,
    description,
    confidence: Math.round(confidence),
    scores: {
      growth: parseFloat(growthScore.toFixed(2)),
      inflation: parseFloat(inflationScore.toFixed(2)),
      stress: parseFloat(stressScore.toFixed(2)),
    },
    signals,
    favoredSectors: REGIME_SECTORS[regime],
    adverseSectors: REGIME_ADVERSE[regime],
  }
}

const REGIME_SECTORS = {
  goldilocks:          ['Technology', 'Consumer Discretionary', 'Financials', 'Industrials'],
  inflationary_growth: ['Energy', 'Materials', 'Financials', 'Real Estate'],
  stagflation:         ['Energy', 'Materials', 'Consumer Staples', 'Utilities'],
  deflationary_slowdown: ['Consumer Staples', 'Healthcare', 'Utilities', 'Quality Equities'],
}

const REGIME_ADVERSE = {
  goldilocks:          ['Utilities', 'Consumer Staples'],
  inflationary_growth: ['Technology', 'Consumer Discretionary', 'Utilities'],
  stagflation:         ['Technology', 'Consumer Discretionary', 'Financials'],
  deflationary_slowdown: ['Energy', 'Financials', 'Materials', 'Industrials'],
}

// ─── Main handler ─────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  // Allow both GET (from browser) and POST (from cron)
  const apiKey = process.env.FRED_API_KEY
  if (!apiKey) {
    return res.status(500).json({ 
      error: 'FRED_API_KEY not set in Vercel environment variables',
      setup: 'Get a free key at https://fred.stlouisfed.org/docs/api/api_key.html'
    })
  }

  try {
    const startTime = Date.now()
    const errors = []
    const results = { fred: {}, yahoo: {}, fearGreed: null, treasuryYieldCurve: null }

    // ── FRED: fetch all series in parallel (with error isolation) ─────────────
    const FRED_SERIES = [
      'CPIAUCSL', 'PPIACO', 'T5YIE',           // inflation
      'FEDFUNDS', 'DGS10', 'DGS2',             // rates
      'T10Y2Y', 'T10Y3M',                       // yield curve spreads
      'GDPC1', 'INDPRO', 'NAPM',               // growth
      'UNRATE', 'ICSA', 'JTSJOL',              // employment
      'BAMLH0A0HYM2', 'BAMLC0A0CM', 'STLFSI2', // credit & stress
      'UMCSENT', 'PSAVERT',                     // consumer
      'USSLIND', 'M2SL',                        // leading indicators
    ]

    const fredResults = await Promise.allSettled(
      FRED_SERIES.map(s => fetchFredSeries(s, apiKey))
    )
    fredResults.forEach((r, i) => {
      if (r.status === 'fulfilled' && r.value) {
        results.fred[FRED_SERIES[i]] = r.value
      } else {
        errors.push(`FRED ${FRED_SERIES[i]}: ${r.reason?.message || 'failed'}`)
      }
    })

    // ── Yahoo Finance: market indicators ──────────────────────────────────────
    const YAHOO_TICKERS = [
      '^VIX', '^TNX', '^GSPC', 'GLD', 'CL=F',
      'DX-Y.NYB', 'HYG', 'TLT',
      'XLF', 'XLE', 'XLK', 'XLV', 'XLI', 'XLP', 'XLY', 'XLU',
    ]

    const yahooResults = await Promise.allSettled(
      YAHOO_TICKERS.map(t => fetchYahooTicker(t))
    )
    yahooResults.forEach((r, i) => {
      if (r.status === 'fulfilled') {
        results.yahoo[YAHOO_TICKERS[i]] = r.value
      } else {
        errors.push(`Yahoo ${YAHOO_TICKERS[i]}: ${r.reason?.message || 'failed'}`)
      }
    })

    // ── CNN Fear & Greed ──────────────────────────────────────────────────────
    const fgResult = await fetchFearGreed().catch(e => { 
      errors.push(`Fear & Greed: ${e.message}`); return null 
    })
    results.fearGreed = fgResult

    // ── Treasury Yield Curve ──────────────────────────────────────────────────
    const yieldResult = await fetchYieldCurve().catch(e => {
      errors.push(`Treasury curve: ${e.message}`); return null
    })
    results.treasuryYieldCurve = yieldResult

    // ── Regime classification ─────────────────────────────────────────────────
    results.regime = classifyRegime(results)
    results.meta = {
      fetchedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      fredSeriesFetched: Object.keys(results.fred).length,
      yahooTickersFetched: Object.keys(results.yahoo).length,
      errors: errors.length ? errors : undefined,
      triggeredBy: req.headers['x-vercel-cron'] ? 'cron' : 'manual',
    }

    // ── Auto-save to Supabase when called by Vercel cron ─────────────────────
    const isCron = req.headers['x-vercel-cron'] === '1'
    if (isCron && process.env.VITE_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const { createClient } = await import('@supabase/supabase-js')
        const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
        const r = results
        await sb.from('market_conditions').insert({
          regime:           r.regime?.regime,
          confidence:       r.regime?.confidence,
          description:      r.regime?.description,
          growth_score:     r.regime?.scores?.growth,
          inflation_score:  r.regime?.scores?.inflation,
          stress_score:     r.regime?.scores?.stress,
          favored_sectors:  r.regime?.favoredSectors,
          adverse_sectors:  r.regime?.adverseSectors,
          cpi:              r.fred?.CPIAUCSL?.value,
          ppi:              r.fred?.PPIACO?.value,
          fed_funds:        r.fred?.FEDFUNDS?.value,
          yield_10y:        r.fred?.DGS10?.value,
          yield_2y:         r.fred?.DGS2?.value,
          spread_2s10s:     r.fred?.T10Y2Y?.value ?? r.treasuryYieldCurve?.spread_2s10s,
          breakeven_5y:     r.fred?.T5YIE?.value,
          pmi_mfg:          r.fred?.NAPM?.value,
          unemployment:     r.fred?.UNRATE?.value,
          jobless_claims:   r.fred?.ICSA?.value,
          hy_spread:        r.fred?.BAMLH0A0HYM2?.value,
          fin_stress:       r.fred?.STLFSI2?.value,
          consumer_sent:    r.fred?.UMCSENT?.value,
          savings_rate:     r.fred?.PSAVERT?.value,
          vix:              r.yahoo?.['%5EVIX']?.price,
          fear_greed_score: r.fearGreed?.score,
          fear_greed_rating: r.fearGreed?.rating,
          yield_curve:      r.treasuryYieldCurve,
          yield_inverted:   r.treasuryYieldCurve?.inverted,
          raw_data:         r,
        })
        results.meta.savedToSupabase = true
      } catch (saveErr) {
        results.meta.supabaseError = saveErr.message
      }
    }

    return res.status(200).json(results)
  } catch (err) {
    console.error('fetch-macro error:', err)
    return res.status(500).json({ error: err.message })
  }
}
