import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { COMPANIES_SCORED, TECH_COMPANIES } from '../lib/data'
import EducationalMacroTab from '../components/EducationalMacroTab'

const PROXY = 'https://api.allorigins.win/get?url='

// Fetch a single Yahoo Finance ticker — returns { price, prevClose, change1d }
async function fetchYahooAsset(ticker) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=35d`
  const res = await fetch(`${PROXY}${encodeURIComponent(url)}`)
  if (!res.ok) throw new Error(`Yahoo ${ticker}: ${res.status}`)
  const json = await res.json()
  const data = JSON.parse(json.contents)
  const result = data?.chart?.result?.[0]
  if (!result) throw new Error(`No data for ${ticker}`)
  const meta = result.meta
  const closes = result.indicators?.quote?.[0]?.close?.filter(v => v != null) || []
  const price = meta.regularMarketPrice ?? closes[closes.length - 1]
  const prev = meta.previousClose ?? meta.chartPreviousClose ?? closes[closes.length - 2]
  const price30d = closes.length >= 22 ? closes[closes.length - 22] : null
  return {
    price: price ? parseFloat(price.toFixed(4)) : null,
    change1d: price && prev ? parseFloat((((price - prev) / prev) * 100).toFixed(2)) : null,
    change30d: price && price30d ? parseFloat((((price - price30d) / price30d) * 100).toFixed(2)) : null,
    fetchedAt: new Date().toISOString(),
  }
}

// ─── Regime config ─────────────────────────────────────────────────────────────
const REGIMES = {
  goldilocks: {
    label: 'Goldilocks', desc: 'Rising growth · Falling inflation',
    color: '#1D9E75', bg: 'rgba(29,158,117,0.08)', border: 'rgba(29,158,117,0.25)', icon: '▲',
    favoredSectors: ['Technology', 'Consumer Discretionary', 'Financials', 'Industrials', 'Communication'],
  },
  inflationary_growth: {
    label: 'Inflationary growth', desc: 'Rising growth · Rising inflation',
    color: '#E24B4A', bg: 'rgba(226,75,74,0.08)', border: 'rgba(226,75,74,0.25)', icon: '◆',
    favoredSectors: ['Energy', 'Materials', 'Financials', 'Real Estate', 'Commodities'],
  },
  stagflation: {
    label: 'Stagflation', desc: 'Falling growth · Rising inflation',
    color: '#BA7517', bg: 'rgba(186,117,23,0.08)', border: 'rgba(186,117,23,0.25)', icon: '▼',
    favoredSectors: ['Energy', 'Materials', 'Consumer Staples', 'Utilities', 'Gold'],
  },
  deflationary_slowdown: {
    label: 'Deflationary slowdown', desc: 'Falling growth · Falling inflation',
    color: '#378ADD', bg: 'rgba(55,138,221,0.08)', border: 'rgba(55,138,221,0.25)', icon: '◈',
    favoredSectors: ['Consumer Staples', 'Healthcare', 'Utilities', 'Long Bonds', 'Quality Equities'],
  },
}

const FEAR_GREED_COLORS = {
  'extreme fear': '#E24B4A', 'fear': '#f4a724',
  'neutral': '#888780', 'greed': '#1D9E75', 'extreme greed': '#0F6E56',
}

// ─── Baseline macro data — always shown, upgraded to live FRED when key is set ──
const BASELINE = {
  regime: 'inflationary_growth', confidence: 62,
  description: 'Economy growing above trend, inflation above Fed target — favors real assets, energy, and financials. Fed paused cuts waiting for data clarity.',
  growth_score: 0.42, inflation_score: 0.38, stress_score: -0.15,
  favored_sectors: ['Energy', 'Financials', 'Materials', 'Healthcare'],
  adverse_sectors: ['Utilities', 'Consumer Discretionary', 'Long-Duration Tech'],
  cpi: 2.4, ppi: 3.2, fed_funds: 4.33, yield_10y: 4.28, yield_2y: 3.97,
  spread_2s10s: 0.31, spread_3m10y: -0.12, breakeven_5y: 2.61,
  pmi_mfg: 52.4, unemployment: 4.4, jobless_claims: 223000,
  hy_spread: 3.2, ig_spread: 0.94, fin_stress: 0.12,
  consumer_sent: 57.9, savings_rate: 4.6,
  vix: 21.8, sp500_change: -0.4,
  fear_greed_score: 22, fear_greed_rating: 'fear',
  yield_curve: {
    date: '2026-03-21', m1: 4.32, m3: 4.31, m6: 4.23, y1: 4.08,
    y2: 3.97, y3: 3.97, y5: 4.03, y7: 4.15, y10: 4.28, y20: 4.58, y30: 4.61,
    spread_2s10s: 0.31, spread_3m10y: -0.12,
  },
  yield_inverted: false,
  fetched_at: '2026-03-24T00:00:00Z',
  _isBaseline: true,
}

const ECONOMIC_CONTEXT = {
  summary: "Economy resilient, inflation sticky above Fed's 2% target. Fed paused rate cuts in Jan 2026. Manufacturing PMI back above 50. Consumer sentiment weak. AI productivity gains showing in corporate earnings.",
  keyDevelopments: [
    "CPI 2.4% YoY (Feb 2026) — above Fed's 2% target, decelerating slowly",
    "Fed funds rate 4.25–4.50% — paused. Market expects 2–3 cuts in 2026",
    "Manufacturing PMI 52.4 (Feb 2026) — back in expansion territory",
    "Unemployment 4.4% — at natural rate, labor market stable",
    "Yield curve normalizing — 2s10s spread slightly positive (+0.31%)",
    "AI capex driving productivity: nonfarm productivity +4.9% in Q3 2025",
  ],
  sources: "BLS CPI (Mar 11 2026), FOMC SEP (Mar 2026), ISM PMI (Mar 2026), Treasury TBAC (Feb 2026)",
}

// ─── Asset class definitions — now regime-aware ────────────────────────────────
const ASSETS = [
  {
    id: 'gold', name: 'Gold', type: 'Real asset', color: '#BA7517',
    ticker: 'GLD', altTickers: ['IAU', '^XAUUSD'],
    what: "The world's oldest store of value. Gold has no cash flow — its value rests entirely on trust, inflation fear, and currency distrust. When real rates turn negative and dollar confidence erodes, gold rises.",
    signals: "Gold + oil rising → inflationary regime. Gold rising, stocks falling → risk-off flight to safety. Gold flat when stocks fall → valuation correction, not systemic fear.",
    buffett: "Buffett doesn't hold gold — it produces nothing. But he uses it as a confidence signal. When gold surges, business valuations become harder to anchor.",
    dalio: "Core All Weather holding at ~7.5%. Outperforms in stagflation and deflationary crises. Gold is the alternative to fiat currency — the older the debt cycle, the more it matters.",
    regimeFavored: ['stagflation', 'deflationary_slowdown', 'inflationary_growth'],
    regimeAdverse: ['goldilocks'],
    baseline: { price: 3050, change30d: 8.2, change1d: 0.4 }, unit: '$',
  },
  {
    id: 'treasuries', name: 'US 20yr Treasury (TLT)', type: 'Fixed income', color: '#378ADD',
    ticker: 'TLT', altTickers: ['IEF', '^TNX'],
    what: "The world's safest asset. When the economy weakens, investors flee here — prices rise, yields fall. Long bonds are the direct anti-equity hedge. The 10-year yield is also how all future cash flows everywhere get discounted.",
    signals: "TLT rallying while stocks fall → genuine fear. Yields rising sharply → inflation fears or Fed hawkishness. TLT and stocks both falling → stagflation, the worst environment.",
    buffett: "Buffett calls the 10yr yield 'gravity for stock prices.' He literally uses Treasury rates to discount future earnings. Every 1% rise in the 10yr compresses fair P/E multiples significantly.",
    dalio: "Long bonds are the growth hedge in All Weather — they rally hardest when growth collapses. Dalio holds ~40% bonds to offset equity risk. Duration matters enormously.",
    regimeFavored: ['deflationary_slowdown'],
    regimeAdverse: ['stagflation', 'inflationary_growth'],
    regimeNeutral: ['goldilocks'],
    baseline: { price: 88.4, change30d: -2.1, change1d: 0.3 }, unit: '$',
  },
  {
    id: 'oil', name: 'Crude Oil (WTI)', type: 'Commodity', color: '#E24B4A',
    ticker: 'CL=F', altTickers: ['XLE', 'USO'],
    what: "Oil is the price of economic activity — demand tracks global growth almost perfectly. But it's also a direct cost input, so when it spikes, inflation follows across the supply chain within 2–3 months.",
    signals: "Oil + stocks rising → genuine demand-driven growth. Oil rising, stocks flat → margin pressure coming. Oil falling sharply → demand destruction, recession fear, or supply glut.",
    buffett: "Tracks input costs for Berkshire's manufacturing and BNSF railroad. Bought heavily into OXY and CVX at $50–60 oil, betting on sustained energy demand from AI infrastructure buildout.",
    dalio: "Oil is a key determinant of which inflation regime we're in. Supply shocks can trigger inflationary growth or stagflation almost overnight regardless of demand fundamentals.",
    regimeFavored: ['inflationary_growth', 'stagflation'],
    regimeAdverse: ['deflationary_slowdown'],
    baseline: { price: 68.5, change30d: -5.4, change1d: -0.8 }, unit: '$',
  },
  {
    id: 'dollar', name: 'US Dollar Index (DXY)', type: 'Currency', color: '#1D9E75',
    ticker: 'DX-Y.NYB', altTickers: ['UUP'],
    what: "The world's reserve currency. A strong dollar crushes emerging markets, hurts US multinationals' overseas earnings, and suppresses commodity prices. Dollar direction is the global risk-on/risk-off barometer.",
    signals: "Dollar rising → global risk-off, tighter financial conditions, commodities under pressure. Dollar falling → global risk appetite rising, commodities rally, EM outperforms.",
    buffett: "Strong dollar directly impacts S&P 500 earnings — ~40% of revenues come from overseas. Every 5% DXY rise reduces S&P 500 earnings by roughly 2–3%.",
    dalio: "Dalio's long-term debt cycle thesis is fundamentally about the dollar's reserve status eroding over decades. Weak dollar = time to hold commodities, gold, and EM.",
    regimeFavored: ['deflationary_slowdown'],
    regimeAdverse: ['goldilocks', 'inflationary_growth'],
    baseline: { price: 104.2, change30d: 1.8, change1d: 0.2 }, unit: '',
  },
  {
    id: 'credit', name: 'High Yield Bonds (HYG)', type: 'Credit', color: '#7F77DD',
    ticker: 'HYG', altTickers: ['JNK', 'LQD'],
    what: "Junk bonds sit between equities and investment-grade bonds in the risk hierarchy. Credit markets detect corporate stress before stock prices do — they're closer to default risk.",
    signals: "HYG falling while stocks hold → early warning. HYG + stocks both falling → confirmed risk-off. Spreads tightening while stocks stall → credit says relax, equity fear overdone.",
    buffett: "Wide spreads = Buffett's opportunity clock ticking. His biggest deployments (Goldman 2008, BofA 2011) both happened when HY spreads were blowing out. He waits for credit panic, then acts.",
    dalio: "HY spreads are the most important single indicator of credit cycle health. A sustained spread above 600bps has preceded every major deleveraging event.",
    regimeFavored: ['goldilocks'],
    regimeAdverse: ['stagflation', 'deflationary_slowdown'],
    baseline: { price: 79.8, change30d: -3.2, change1d: -0.4 }, unit: '$',
    note: 'Spread ~3.2% above Treasuries',
  },
  {
    id: 'copper', name: "Copper — Dr. Copper", type: 'Commodity', color: '#D85A30',
    ticker: 'HG=F', altTickers: ['CPER', 'COPX'],
    what: "Copper goes into everything that represents real economic activity — construction, electronics, EVs, power grids, data centers. It earned its honorary doctorate by turning before GDP data does.",
    signals: "Copper rising → global factories ordering, real industrial growth. Copper falling → demand destruction, slowdown ahead. Copper + oil rising together = the most bullish broad macro signal available.",
    buffett: "Berkshire's industrial holdings (BNSF, energy, manufacturing) move with copper. The AI infrastructure buildout thesis — data centers requiring massive copper for power — is partly why he's interested in energy and utilities.",
    dalio: "Copper is Dalio's preferred real-time growth gauge, more reliable than PMI surveys because it's priced by actual purchasing decisions in liquid global markets, not survey responses.",
    regimeFavored: ['goldilocks', 'inflationary_growth'],
    regimeAdverse: ['deflationary_slowdown', 'stagflation'],
    baseline: { price: 4.52, change30d: -3.8, change1d: -0.5 }, unit: '$', unitAfter: '/lb',
  },
  {
    id: 'intl', name: 'International Equities (EEM)', type: 'Equities', color: '#639922',
    ticker: 'EEM', altTickers: ['EFA', 'VGK', 'EWJ'],
    what: "US stocks don't always lead the world. When the dollar weakens, emerging market equities often dramatically outperform. Tracks whether global growth is broadening beyond the US.",
    signals: "EEM outperforming SPY → dollar weakening, global growth broadening, risk appetite rising. US-only outperformance → dollar strength, US exceptionalism, often a late-cycle signal.",
    buffett: "Buffett rarely invests internationally — he stays in his circle of competence. His recent Japanese trading house investments are the exception, driven by valuation and commodity exposure.",
    dalio: "Bridgewater explicitly shifts between US, European, and EM equities based on where each country is in its debt cycle. When US late-cycle signals accumulate, Dalio tilts toward markets earlier in their cycle.",
    regimeFavored: ['goldilocks', 'inflationary_growth'],
    regimeAdverse: ['deflationary_slowdown'],
    baseline: { price: 41.2, change30d: -4.1, change1d: -0.9 }, unit: '$',
  },
]

// ─── Risk score — accepts merged (live) assets array ─────────────────────────
function computeRiskScore(assets) {
  const get = (id) => assets.find(a => a.id === id)?.baseline.change30d ?? 0
  const signals = [
    get('copper')     > 0 ? 1 : -1,
    get('oil')        > 0 ? 1 : -1,
    get('intl')       > 0 ? 1 : -1,
    get('credit')     > 0 ? 1 : -1,
    get('gold')       < 0 ? 1 : -1,
    get('treasuries') < 0 ? 1 : -1,
    get('dollar')     < 0 ? 1 : -1,
  ]
  return Math.round(((signals.reduce((a, b) => a + b, 0) + 7) / 14) * 10)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (v, dec = 1) => v != null ? Number(v).toFixed(dec) : '—'
const fmtPct = (v) => v != null ? `${Number(v).toFixed(1)}%` : '—'
const chgColor = (v) => v > 0 ? 'var(--green)' : v < 0 ? 'var(--red)' : 'var(--muted)'
const chgArrow = (v) => v > 0 ? '▲' : v < 0 ? '▼' : '—'

function assetAlignment(asset, regimeKey) {
  if (asset.regimeFavored?.includes(regimeKey)) return 'favored'
  if (asset.regimeAdverse?.includes(regimeKey)) return 'adverse'
  return 'neutral'
}

// ─── Shared UI components ─────────────────────────────────────────────────────
function StatCard({ label, value, sub, color }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '12px 14px' }}>
      <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)', color: color || 'var(--text)' }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function RegimeBadge({ regimeKey, size = 'md' }) {
  const r = REGIMES[regimeKey]
  if (!r) return null
  return (
    <span style={{
      background: r.bg, color: r.color, border: `1px solid ${r.border}`,
      padding: size === 'sm' ? '2px 8px' : '4px 12px',
      borderRadius: 20, fontSize: size === 'sm' ? 10 : 12,
      fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5,
    }}>
      <span style={{ fontSize: size === 'sm' ? 8 : 10 }}>{r.icon}</span>
      {r.label}
    </span>
  )
}

function AlignBadge({ alignment }) {
  const c = {
    favored: { bg: 'rgba(32,200,120,0.12)', color: 'var(--green)', label: 'Favored' },
    adverse: { bg: 'rgba(240,82,82,0.12)', color: 'var(--red)', label: 'Adverse' },
    neutral: { bg: 'rgba(84,88,120,0.18)', color: 'var(--muted)', label: 'Neutral' },
  }[alignment]
  return (
    <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: c.bg, color: c.color, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
      {c.label}
    </span>
  )
}

function ScoreBar({ label, value, positiveLabel, negativeLabel }) {
  const color = value > 0.3 ? '#1D9E75' : value < -0.3 ? '#E24B4A' : '#BA7517'
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: 'var(--text2)' }}>{label}</span>
        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color }}>{value > 0 ? `+${value.toFixed(2)}` : value.toFixed(2)}</span>
      </div>
      <div style={{ height: 6, background: 'var(--border2)', borderRadius: 3, position: 'relative' }}>
        <div style={{ position: 'absolute', left: '50%', top: 0, width: 1, height: '100%', background: 'var(--border2)' }} />
        <div style={{ position: 'absolute', left: value >= 0 ? '50%' : `${((value + 1) / 2) * 100}%`, width: `${Math.abs(value) * 50}%`, height: '100%', background: color, borderRadius: 3 }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
        <span style={{ fontSize: 9, color: 'var(--muted)' }}>{negativeLabel}</span>
        <span style={{ fontSize: 9, color: 'var(--muted)' }}>{positiveLabel}</span>
      </div>
    </div>
  )
}

// ─── Asset card — expandable, regime-aware ────────────────────────────────────
function AssetCard({ asset, regimeKey }) {
  const [expanded, setExpanded] = useState(false)
  const alignment = assetAlignment(asset, regimeKey)
  const { price, change30d, change1d } = asset.baseline
  const displayPrice = `${asset.unit}${price >= 100 ? price.toFixed(2) : price.toFixed(2)}${asset.unitAfter || ''}`

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderTop: `3px solid ${asset.color}`, borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 8 }}>
      <div onClick={() => setExpanded(v => !v)} style={{ padding: '13px 16px', cursor: 'pointer', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{asset.name}</span>
            <span style={{ fontSize: 9, fontWeight: 500, padding: '1px 7px', borderRadius: 3, background: `${asset.color}20`, color: asset.color, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{asset.type}</span>
            <AlignBadge alignment={alignment} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 5 }}>{asset.what}</div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 9, color: 'var(--muted)' }}>Track:</span>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', padding: '1px 6px', borderRadius: 3, background: `${asset.color}18`, color: asset.color }}>{asset.ticker}</span>
            {asset.altTickers.map(t => <span key={t} style={{ fontSize: 10, fontFamily: 'var(--font-mono)', padding: '1px 6px', borderRadius: 3, background: 'var(--surface2)', color: 'var(--muted)', border: '1px solid var(--border)' }}>{t}</span>)}
            {asset.note && <span style={{ fontSize: 10, color: 'var(--muted)', fontStyle: 'italic' }}>{asset.note}</span>}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)', color: asset.color, lineHeight: 1 }}>{displayPrice}</div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 5 }}>
            <div><div style={{ fontSize: 9, color: 'var(--muted)' }}>1d</div><div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: chgColor(change1d), fontWeight: 600 }}>{chgArrow(change1d)} {Math.abs(change1d).toFixed(1)}%</div></div>
            <div><div style={{ fontSize: 9, color: 'var(--muted)' }}>30d</div><div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: chgColor(change30d), fontWeight: 600 }}>{chgArrow(change30d)} {Math.abs(change30d).toFixed(1)}%</div></div>
          </div>
          <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginTop: 6 }}>{expanded ? '▲ collapse' : '▼ learn more'}</div>
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid var(--border)', background: 'var(--surface2)', padding: '13px 16px 15px' }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 5 }}>What it signals</div>
            <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.75 }}>{asset.signals}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            <div style={{ padding: '9px 12px', borderRadius: 'var(--radius)', background: 'rgba(186,117,23,0.06)', border: '1px solid rgba(186,117,23,0.15)' }}>
              <div style={{ fontSize: 9, fontWeight: 600, color: '#BA7517', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>Buffett lens</div>
              <div style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.7 }}>{asset.buffett}</div>
            </div>
            <div style={{ padding: '9px 12px', borderRadius: 'var(--radius)', background: 'rgba(91,138,240,0.06)', border: '1px solid rgba(91,138,240,0.15)' }}>
              <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>Dalio lens</div>
              <div style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.7 }}>{asset.dalio}</div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>Regime performance</div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {asset.regimeFavored?.map(k => <span key={k} style={{ fontSize: 10, padding: '2px 9px', borderRadius: 10, background: 'rgba(32,200,120,0.1)', color: 'var(--green)', border: '1px solid rgba(32,200,120,0.2)', fontFamily: 'var(--font-mono)' }}>▲ {REGIMES[k]?.label}</span>)}
              {asset.regimeNeutral?.map(k => <span key={k} style={{ fontSize: 10, padding: '2px 9px', borderRadius: 10, background: 'var(--surface3)', color: 'var(--muted)', border: '1px solid var(--border)', fontFamily: 'var(--font-mono)' }}>— {REGIMES[k]?.label}</span>)}
              {asset.regimeAdverse?.map(k => <span key={k} style={{ fontSize: 10, padding: '2px 9px', borderRadius: 10, background: 'rgba(240,82,82,0.1)', color: 'var(--red)', border: '1px solid rgba(240,82,82,0.2)', fontFamily: 'var(--font-mono)' }}>▼ {REGIMES[k]?.label}</span>)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Risk appetite score panel ────────────────────────────────────────────────
function RiskScore({ score }) {
  const label = score >= 8 ? 'Risk-on' : score >= 6 ? 'Mild risk-on' : score >= 5 ? 'Neutral' : score >= 3 ? 'Mild risk-off' : 'Risk-off'
  const color = score >= 7 ? 'var(--green)' : score >= 4 ? 'var(--amber)' : 'var(--red)'
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '13px 16px', marginBottom: 14 }}>
      <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>Cross-asset risk appetite</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
        {/* Score pill — compact, not enormous */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, flexShrink: 0 }}>
          <span style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-mono)', color, lineHeight: 1 }}>{score}</span>
          <span style={{ fontSize: 11, color: 'var(--muted)' }}>/10</span>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color, marginBottom: 2 }}>{label}</div>
          <div style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.5 }}>Synthesized from 7 asset classes. Risk-on = equities, oil, copper rising. Risk-off = gold, bonds, dollar rising.</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 2 }}>
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} style={{ flex: 1, height: 6, borderRadius: 2, background: i < score ? (i >= 7 ? 'var(--green)' : i >= 4 ? 'var(--amber)' : 'var(--red)') : 'var(--border2)' }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
        <span style={{ fontSize: 9, color: 'var(--muted)' }}>Risk-off (0)</span>
        <span style={{ fontSize: 9, color: 'var(--muted)' }}>Risk-on (10)</span>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function EconomicPulse() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [watchlistImpact, setWatchlistImpact] = useState(null)
  const [assetPrices, setAssetPrices] = useState({})       // live prices keyed by asset id
  const [assetLoading, setAssetLoading] = useState(false)
  const [assetFetchedAt, setAssetFetchedAt] = useState(null)

  // Merge live price into an asset definition — falls back to baseline if fetch failed
  const mergedAsset = useCallback((asset) => {
    const live = assetPrices[asset.id]
    if (!live) return asset
    return { ...asset, baseline: { price: live.price ?? asset.baseline.price, change1d: live.change1d ?? asset.baseline.change1d, change30d: live.change30d ?? asset.baseline.change30d } }
  }, [assetPrices])

  // Compute risk score from merged (live when available) asset data
  const mergedAssets = ASSETS.map(a => mergedAsset(a))
  const riskScore = computeRiskScore(mergedAssets)

  useEffect(() => { load(); fetchAssets() }, [])

  const fetchAssets = async () => {
    setAssetLoading(true)
    const ASSET_TICKERS = [
      { id: 'gold',        ticker: 'GLD' },
      { id: 'treasuries',  ticker: 'TLT' },
      { id: 'oil',         ticker: 'CL=F' },
      { id: 'dollar',      ticker: 'DX-Y.NYB' },
      { id: 'credit',      ticker: 'HYG' },
      { id: 'copper',      ticker: 'HG=F' },
      { id: 'intl',        ticker: 'EEM' },
      { id: 'spy',         ticker: '^GSPC' },   // for relative performance baseline
    ]
    const results = await Promise.allSettled(
      ASSET_TICKERS.map(async ({ id, ticker }) => ({ id, ...(await fetchYahooAsset(ticker)) }))
    )
    const prices = {}
    results.forEach(r => {
      if (r.status === 'fulfilled') prices[r.value.id] = r.value
    })
    if (Object.keys(prices).length > 0) {
      setAssetPrices(prices)
      setAssetFetchedAt(new Date().toISOString())
    }
    setAssetLoading(false)
  }

  const load = async () => {
    setLoading(true)
    setData(BASELINE)
    computeImpact(BASELINE)
    try {
      const { data: rows } = await supabase.from('market_conditions').select('*').order('fetched_at', { ascending: false }).limit(1)
      if (rows?.length) { setData(rows[0]); computeImpact(rows[0]) }
    } catch (_) {}
    setLoading(false)
  }

  const refresh = async () => {
    setFetching(true); setError(null)
    try {
      const res = await fetch('/api/fetch-macro')
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      const row = {
        regime: json.regime?.regime, confidence: json.regime?.confidence,
        description: json.regime?.description,
        growth_score: json.regime?.scores?.growth, inflation_score: json.regime?.scores?.inflation, stress_score: json.regime?.scores?.stress,
        favored_sectors: json.regime?.favoredSectors, adverse_sectors: json.regime?.adverseSectors,
        cpi: json.fred?.CPIAUCSL?.value, ppi: json.fred?.PPIACO?.value,
        fed_funds: json.fred?.FEDFUNDS?.value, yield_10y: json.fred?.DGS10?.value, yield_2y: json.fred?.DGS2?.value,
        spread_2s10s: json.fred?.T10Y2Y?.value ?? json.treasuryYieldCurve?.spread_2s10s,
        breakeven_5y: json.fred?.T5YIE?.value, pmi_mfg: json.fred?.NAPM?.value,
        unemployment: json.fred?.UNRATE?.value, jobless_claims: json.fred?.ICSA?.value,
        hy_spread: json.fred?.BAMLH0A0HYM2?.value, fin_stress: json.fred?.STLFSI2?.value,
        consumer_sent: json.fred?.UMCSENT?.value, savings_rate: json.fred?.PSAVERT?.value,
        vix: json.yahoo?.['%5EVIX']?.price,
        fear_greed_score: json.fearGreed?.score, fear_greed_rating: json.fearGreed?.rating,
        yield_curve: json.treasuryYieldCurve, yield_inverted: json.treasuryYieldCurve?.inverted,
        raw_data: json,
      }
      const { data: saved, error: saveErr } = await supabase.from('market_conditions').insert(row).select().single()
      if (saveErr) throw saveErr
      setData(saved); computeImpact(saved)
    } catch (e) { setError(e.message) }
    setFetching(false)
  }

  const computeImpact = (mc) => {
    if (!mc?.regime) return
    const all = [...COMPANIES_SCORED, ...TECH_COMPANIES.map(t => ({ ...t, sector: t.industry }))]
    const fav = mc.favored_sectors || [], adv = mc.adverse_sectors || []
    const tagged = all.map(co => ({
      ...co,
      align: fav.some(s => co.sector?.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(co.sector?.toLowerCase())) ? 'favored'
           : adv.some(s => co.sector?.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(co.sector?.toLowerCase())) ? 'adverse'
           : 'neutral',
    }))
    setWatchlistImpact({
      favored: tagged.filter(c => c.align === 'favored').length,
      adverse: tagged.filter(c => c.align === 'adverse').length,
      neutral: tagged.filter(c => c.align === 'neutral').length,
      topFavored: tagged.filter(c => c.align === 'favored').sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 5),
      topAdverse: tagged.filter(c => c.align === 'adverse').sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 5),
    })
  }

  if (loading) return <div style={{ padding: 40, color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>Loading economic pulse…</div>

  const regime = data?.regime ? REGIMES[data.regime] : null
  const spyBaseline30d = -3.5

  const TABS = [
    { id: 'overview',  label: '◎ Overview' },
    { id: 'assets',    label: '◈ Asset classes' },
    { id: 'risk',      label: '△ Risk appetite' },
    { id: 'macro',     label: '▦ Macro indicators' },
    { id: 'sectors',   label: '◆ Sector rotation' },
    { id: 'impact',    label: '★ Company impact' },
  ]

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', flexDirection: 'column' }}>

      {/* ── Header ── */}
      <div style={{ padding: '13px 24px 11px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 3, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 20 }}>Economic Pulse</span>
              {regime && <RegimeBadge regimeKey={data.regime} />}
              {data?.yield_inverted && (
                <span style={{ fontSize: 10, background: 'rgba(226,75,74,0.1)', color: '#E24B4A', border: '1px solid rgba(226,75,74,0.25)', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>⚠ Yield curve inverted</span>
              )}
              <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: riskScore >= 7 ? 'var(--green)' : riskScore >= 4 ? 'var(--amber)' : 'var(--red)', background: 'var(--surface2)', padding: '2px 9px', borderRadius: 10, border: '1px solid var(--border)' }}>
                Risk appetite {riskScore}/10
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', display:'flex', gap:12, flexWrap:'wrap' }}>
              <span>{data?._isBaseline ? 'Macro: baseline Mar 2026 · Add FRED_API_KEY for live' : `Macro: updated ${new Date(data.fetched_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`}{data?.confidence ? ` · ${data.confidence}% confidence` : ''}</span>
              {assetFetchedAt && <span style={{color:'var(--green)'}}>Asset prices: live · {new Date(assetFetchedAt).toLocaleTimeString('en-US', {hour:'2-digit',minute:'2-digit'})}</span>}
              {assetLoading && <span style={{color:'var(--amber)'}}>Asset prices: fetching…</span>}
              {!assetFetchedAt && !assetLoading && <span style={{color:'var(--muted)'}}>Asset prices: loading…</span>}
            </div>
          </div>
          <button onClick={refresh} disabled={fetching} style={{ padding: '8px 16px', background: fetching ? 'var(--border2)' : 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', fontSize: 12, fontWeight: 600, cursor: fetching ? 'not-allowed' : 'pointer', flexShrink: 0 }}>
            {fetching ? 'Fetching…' : '↻ Refresh'}
          </button>
        </div>
        {error && !error.includes('FRED_API_KEY') && (
          <div style={{ marginTop: 7, padding: '5px 12px', background: 'rgba(240,82,82,0.06)', border: '1px solid rgba(240,82,82,0.2)', borderRadius: 'var(--radius)', fontSize: 11, color: 'var(--red)' }}>{error}</div>
        )}
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--surface)', padding: '0 20px', flexShrink: 0, overflowX: 'auto' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: '10px 14px', background: 'none', border: 'none', flexShrink: 0,
            borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
            color: activeTab === tab.id ? 'var(--accent)' : 'var(--text2)',
            fontSize: 12, fontWeight: 600, cursor: 'pointer', marginBottom: -1, whiteSpace: 'nowrap',
          }}>{tab.label}</button>
        ))}
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

        {/* OVERVIEW */}
        {activeTab === 'overview' && data && (
          <div>
            {/* Regime card */}
            {regime && (
              <div style={{ background: regime.bg, border: `1px solid ${regime.border}`, borderRadius: 'var(--radius-lg)', padding: '16px 20px', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 11, color: regime.color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>Current regime · {data.confidence}% confidence</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: regime.color, marginBottom: 5 }}>{regime.label}</div>
                    <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7 }}>{data.description}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 20 }}>
                    <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 5 }}>Dalio's four regimes</div>
                    {Object.entries(REGIMES).map(([key, r]) => (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end', marginBottom: 3 }}>
                        <span style={{ fontSize: 11, color: data.regime === key ? r.color : 'var(--muted)', fontWeight: data.regime === key ? 600 : 400 }}>{r.label}</span>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: data.regime === key ? r.color : 'var(--border2)' }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Regime scores + risk score side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              {data.growth_score != null && (
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px 16px' }}>
                  <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Macro regime scores</div>
                  <ScoreBar label="Growth momentum" value={data.growth_score} positiveLabel="Expanding" negativeLabel="Contracting" />
                  <ScoreBar label="Inflation pressure" value={data.inflation_score} positiveLabel="Rising" negativeLabel="Falling" />
                  <ScoreBar label="Financial stress" value={data.stress_score} positiveLabel="High stress" negativeLabel="Low stress" />
                </div>
              )}
              <RiskScore score={riskScore} />
            </div>

            {/* Key stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 16 }}>
              <StatCard label="CPI inflation" value={fmtPct(data.cpi)} sub="YoY · Feb 2026" color={data.cpi > 3 ? '#E24B4A' : data.cpi > 2 ? '#BA7517' : '#1D9E75'} />
              <StatCard label="Fed funds rate" value={fmtPct(data.fed_funds)} sub="Paused" />
              <StatCard label="2s10s spread" value={data.spread_2s10s != null ? `${data.spread_2s10s > 0 ? '+' : ''}${fmt(data.spread_2s10s, 2)}%` : '—'} sub={data.yield_inverted ? '⚠ Inverted' : 'Normal'} color={data.yield_inverted ? '#E24B4A' : '#1D9E75'} />
              <StatCard label="VIX" value={fmt(data.vix, 1)} sub={data.vix > 30 ? 'High fear' : data.vix > 20 ? 'Elevated' : 'Calm'} color={data.vix > 30 ? '#E24B4A' : data.vix > 20 ? '#BA7517' : '#1D9E75'} />
              <StatCard label="Mfg PMI" value={fmt(data.pmi_mfg, 1)} sub={data.pmi_mfg > 50 ? 'Expanding' : 'Contracting'} color={data.pmi_mfg > 50 ? '#1D9E75' : '#E24B4A'} />
              <StatCard label="HY credit spread" value={data.hy_spread ? `${fmt(data.hy_spread, 2)}%` : '—'} sub={data.hy_spread > 5 ? 'Stress elevated' : 'Normal'} color={data.hy_spread > 5 ? '#E24B4A' : 'var(--text)'} />
              <StatCard label="Fear & greed" value={fmt(data.fear_greed_score, 0)} sub={data.fear_greed_rating} color={FEAR_GREED_COLORS[data.fear_greed_rating] || 'var(--text)'} />
              <StatCard label="Unemployment" value={fmtPct(data.unemployment)} sub="UNRATE" />
            </div>

            {/* Economic context */}
            {data._isBaseline && (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '13px 16px', marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 7 }}>Economic context · Mar 2026</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.75, marginBottom: 8 }}>{ECONOMIC_CONTEXT.summary}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
                  {ECONOMIC_CONTEXT.keyDevelopments.map((d, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, fontSize: 11, color: 'var(--text2)' }}>
                      <span style={{ color: 'var(--accent)', flexShrink: 0 }}>▸</span>{d}
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>Sources: {ECONOMIC_CONTEXT.sources}</div>
              </div>
            )}

            {/* Sector alignment */}
            {data.favored_sectors?.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ background: 'rgba(29,158,117,0.06)', border: '1px solid rgba(29,158,117,0.2)', borderRadius: 'var(--radius-lg)', padding: '12px 14px' }}>
                  <div style={{ fontSize: 10, color: '#1D9E75', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 7 }}>Regime-favored sectors</div>
                  {data.favored_sectors.map(s => <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}><div style={{ width: 5, height: 5, borderRadius: '50%', background: '#1D9E75', flexShrink: 0 }} /><span style={{ fontSize: 12 }}>{s}</span></div>)}
                </div>
                <div style={{ background: 'rgba(226,75,74,0.06)', border: '1px solid rgba(226,75,74,0.2)', borderRadius: 'var(--radius-lg)', padding: '12px 14px' }}>
                  <div style={{ fontSize: 10, color: '#E24B4A', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 7 }}>Regime-adverse sectors</div>
                  {data.adverse_sectors?.map(s => <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}><div style={{ width: 5, height: 5, borderRadius: '50%', background: '#E24B4A', flexShrink: 0 }} /><span style={{ fontSize: 12 }}>{s}</span></div>)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ASSET CLASSES */}
        {activeTab === 'assets' && (
          <div>
            <div style={{ marginBottom: 12, fontSize: 11, color: 'var(--text2)', lineHeight: 1.7 }}>
              7 asset classes tracked as economic signals, not investments. Each card shows regime alignment with the current
              <span style={{ color: regime?.color, fontWeight: 600 }}> {regime?.label}</span> regime.
              Expand any card for the full signal interpretation, Buffett lens, and Dalio lens.
            </div>
            {/* Sort: favored → neutral → adverse */}
            {/* Live fetch status */}
            {assetLoading && <div style={{fontSize:11,color:'var(--muted)',marginBottom:8,fontFamily:'var(--font-mono)'}}>Fetching live prices…</div>}
            {assetFetchedAt && !assetLoading && (
              <div style={{fontSize:10,color:'var(--muted)',marginBottom:8,fontFamily:'var(--font-mono)'}}>
                Live prices · Updated {new Date(assetFetchedAt).toLocaleTimeString('en-US', {hour:'2-digit',minute:'2-digit'})}
                <button onClick={fetchAssets} style={{marginLeft:10,fontSize:10,background:'none',border:'none',color:'var(--accent)',cursor:'pointer',fontFamily:'var(--font-mono)'}}>↻ refresh</button>
              </div>
            )}
            {['favored', 'neutral', 'adverse'].flatMap(align =>
              mergedAssets.filter(a => assetAlignment(a, data?.regime) === align)
                    .map(a => <AssetCard key={a.id} asset={a} regimeKey={data?.regime} />)
            )}
          </div>
        )}

        {/* RISK APPETITE */}
        {activeTab === 'risk' && (
          <div>
            <RiskScore score={riskScore} />
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px 16px', marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10 }}>Signal-by-signal breakdown</div>
              {[
                { a: ASSETS.find(a => a.id === 'copper'), riskOn: true,  interp: c => c > 0 ? 'Industrial demand rising — growth signal' : 'Industrial demand falling — slowdown signal' },
                { a: ASSETS.find(a => a.id === 'oil'),    riskOn: true,  interp: c => c > 0 ? 'Economic activity expanding' : 'Demand contracting — risk-off' },
                { a: ASSETS.find(a => a.id === 'intl'),   riskOn: true,  interp: c => c > 0 ? 'Global risk appetite rising' : 'Investors retreating to home markets' },
                { a: ASSETS.find(a => a.id === 'credit'), riskOn: true,  interp: c => c > 0 ? 'Credit markets confident' : 'Credit markets tightening — warning' },
                { a: ASSETS.find(a => a.id === 'gold'),   riskOn: false, interp: c => c > 0 ? 'Fear elevated — safety seeking' : 'Fear receding — risk-on' },
                { a: ASSETS.find(a => a.id === 'treasuries'), riskOn: false, interp: c => c > 0 ? 'Flight to safety — growth concerns' : 'Safety trade unwinding — risk-on' },
                { a: ASSETS.find(a => a.id === 'dollar'), riskOn: false, interp: c => c > 0 ? 'Global risk aversion rising' : 'Dollar weakening — global risk appetite' },
              // Use live prices when available
              ].map(({ a: rawA, riskOn, interp }) => {
                const a = mergedAssets.find(x => x.id === rawA.id) || rawA
                const chg = a.baseline.change30d
                const isOn = (riskOn && chg > 0) || (!riskOn && chg < 0)
                return (
                  <div key={a.id} style={{ display: 'grid', gridTemplateColumns: '140px 70px 1fr', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 'var(--radius)', background: isOn ? 'rgba(32,200,120,0.04)' : 'rgba(240,82,82,0.04)', border: `1px solid ${isOn ? 'rgba(32,200,120,0.15)' : 'rgba(240,82,82,0.12)'}`, marginBottom: 5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: a.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, fontWeight: 500 }}>{a.name.split(' ')[0] === 'US' || a.name.split(' ')[0] === 'High' ? a.name.split('(')[0].trim() : a.name.split(' (')[0]}</span>
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: chgColor(chg), fontWeight: 600 }}>{chgArrow(chg)} {Math.abs(chg).toFixed(1)}%</div>
                    <div style={{ fontSize: 11, color: isOn ? 'var(--green)' : 'var(--red)' }}>{isOn ? '▲' : '▼'} {interp(chg)}</div>
                  </div>
                )
              })}
            </div>
            {/* Relative vs SPY */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>Relative performance vs S&P 500 — 30 days</div>
                <div style={{ fontSize: 11, color: 'var(--text2)' }}>Relative performance strips the bull/bear factor to isolate what each asset is actually signaling.</div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: 'var(--surface2)' }}>
                    {['Asset', '30d', 'vs SPY', 'Regime', 'Reading'].map(h => (
                      <th key={h} style={{ padding: '7px 14px', textAlign: 'left', fontSize: 9, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...mergedAssets].sort((a, b) => (b.baseline.change30d - spyBaseline30d) - (a.baseline.change30d - spyBaseline30d)).map(a => {
                    const vsspy = a.baseline.change30d - spyBaseline30d
                    const align = assetAlignment(a, data?.regime)
                    const contradiction = (align === 'favored' && vsspy < -3) || (align === 'adverse' && vsspy > 3)
                    return (
                      <tr key={a.id} style={{ borderTop: '1px solid var(--border)', background: contradiction ? 'rgba(244,167,36,0.04)' : 'transparent' }}>
                        <td style={{ padding: '9px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <div style={{ width: 7, height: 7, borderRadius: '50%', background: a.color, flexShrink: 0 }} />
                            <span style={{ fontWeight: 500 }}>{a.name.split(' (')[0]}</span>
                          </div>
                        </td>
                        <td style={{ padding: '9px 14px', fontFamily: 'var(--font-mono)', color: chgColor(a.baseline.change30d), fontSize: 11 }}>{chgArrow(a.baseline.change30d)} {Math.abs(a.baseline.change30d).toFixed(1)}%</td>
                        <td style={{ padding: '9px 14px', fontFamily: 'var(--font-mono)', color: chgColor(vsspy), fontWeight: 600, fontSize: 12 }}>{vsspy > 0 ? '+' : ''}{vsspy.toFixed(1)}%</td>
                        <td style={{ padding: '9px 14px' }}><AlignBadge alignment={align} /></td>
                        <td style={{ padding: '9px 14px', fontSize: 11, color: contradiction ? 'var(--amber)' : 'var(--text2)' }}>
                          {contradiction ? '⚠ Contradicts regime — worth investigating' : align === 'favored' && vsspy > 2 ? 'Regime tailwind working' : align === 'adverse' && vsspy < -2 ? 'Headwind confirmed' : 'In line with expectations'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MACRO INDICATORS */}
        {activeTab === 'macro' && data && (
          <EducationalMacroTab
            data={data}
            fmt={(v, dec = 1) => v != null ? Number(v).toFixed(dec) : '—'}
            fmtPct={(v) => v != null ? Number(v).toFixed(1) + '%' : '—'}
          />
        )}

        {/* SECTOR ROTATION */}
        {activeTab === 'sectors' && data && (
          <div>
            <div style={{ marginBottom: 14, fontSize: 12, color: 'var(--text2)', lineHeight: 1.7 }}>
              In a <strong style={{ color: regime?.color }}>{regime?.label}</strong> regime, capital historically rotates toward certain sectors and away from others. This maps Dalio's four environments to their historical equity winners and losers.
            </div>
            {/* Yield curve */}
            {data.yield_curve && (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px 16px', marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>
                  Treasury yield curve · {data.yield_curve.date}
                  {data.yield_inverted && <span style={{ marginLeft: 10, color: '#E24B4A', fontWeight: 600 }}>⚠ INVERTED</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
                  {[['1m', data.yield_curve.m1], ['3m', data.yield_curve.m3], ['6m', data.yield_curve.m6], ['1y', data.yield_curve.y1], ['2y', data.yield_curve.y2], ['3y', data.yield_curve.y3], ['5y', data.yield_curve.y5], ['7y', data.yield_curve.y7], ['10y', data.yield_curve.y10], ['20y', data.yield_curve.y20], ['30y', data.yield_curve.y30]].filter(([, v]) => v != null).map(([lbl, val]) => {
                    const h = Math.max(4, (val / 8) * 70)
                    const inv = data.yield_inverted && ['2y', '3y', '5y'].includes(lbl)
                    return (
                      <div key={lbl} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                        <div style={{ fontSize: 9, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{Number(val).toFixed(2)}</div>
                        <div style={{ width: '100%', height: h, background: inv ? '#E24B4A' : 'var(--accent)', borderRadius: '2px 2px 0 0', opacity: 0.8 }} />
                        <div style={{ fontSize: 9, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{lbl}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
              {Object.entries(REGIMES).map(([key, r]) => (
                <div key={key} style={{ background: data.regime === key ? r.bg : 'var(--surface)', border: `1px solid ${data.regime === key ? r.border : 'var(--border)'}`, borderRadius: 'var(--radius-lg)', padding: '13px 15px', borderTop: `3px solid ${r.color}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: r.color }}>{r.label}</span>
                    {data.regime === key && <span style={{ fontSize: 9, padding: '1px 7px', borderRadius: 3, background: r.bg, color: r.color, fontWeight: 600 }}>current</span>}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 8 }}>{r.desc}</div>
                  {r.favoredSectors.map(s => (
                    <div key={s} style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ color: r.color, fontSize: 8 }}>▸</span>{s}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* COMPANY IMPACT */}
        {activeTab === 'impact' && watchlistImpact && (
          <div>
            <div style={{ marginBottom: 14, fontSize: 12, color: 'var(--text2)', lineHeight: 1.7 }}>
              How the current <strong style={{ color: regime?.color }}>{regime?.label}</strong> regime maps across all 110 companies in the research universe. Based on sector alignment with the regime's historical winners and losers.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
              <StatCard label="Regime-favored" value={watchlistImpact.favored} sub="of 110 companies" color="#1D9E75" />
              <StatCard label="Regime-adverse" value={watchlistImpact.adverse} sub="swimming against current" color="#E24B4A" />
              <StatCard label="Regime-neutral" value={watchlistImpact.neutral} sub="unaffected" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#1D9E75', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Top favored — regime tailwind</div>
                {watchlistImpact.topFavored.map(co => (
                  <div key={co.ticker} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'rgba(29,158,117,0.06)', border: '1px solid rgba(29,158,117,0.15)', borderRadius: 'var(--radius)', marginBottom: 6 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent)', width: 50 }}>{co.ticker}</span>
                    <span style={{ fontSize: 12, flex: 1, color: 'var(--text2)' }}>{co.name}</span>
                    <span style={{ fontSize: 10, color: '#1D9E75', fontFamily: 'var(--font-mono)' }}>{co.score}/5</span>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#E24B4A', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Top adverse — regime headwind</div>
                {watchlistImpact.topAdverse.map(co => (
                  <div key={co.ticker} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'rgba(226,75,74,0.06)', border: '1px solid rgba(226,75,74,0.15)', borderRadius: 'var(--radius)', marginBottom: 6 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent)', width: 50 }}>{co.ticker}</span>
                    <span style={{ fontSize: 12, flex: 1, color: 'var(--text2)' }}>{co.name}</span>
                    <span style={{ fontSize: 10, color: '#E24B4A', fontFamily: 'var(--font-mono)' }}>{co.score}/5</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
