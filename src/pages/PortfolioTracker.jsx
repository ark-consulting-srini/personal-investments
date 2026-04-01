import { useState, useEffect, useCallback } from 'react'
import { useMarketData } from '../hooks/useMarketData'
import { supabase } from '../lib/supabase'
import { DISPLACEMENT_STOCKS, DISPLACEMENT_TIERS, getDisplacement, getTierConfig, getQualityData } from '../lib/aiDisplacement'
import { COMPANIES_SCORED, TECH_COMPANIES } from '../lib/data'
import { getTL, getMoVerdict, getDarioVerdict, getTLOverlap, TL_VERDICTS, TL_OVERLAPS } from '../lib/thoughtLeaders'

// ─── Regime baseline (reads from Supabase, falls back to March 2026 hardcoded) ─
const REGIME_BASELINE = {
  regime: 'inflationary_growth',
  favored_sectors: ['Energy', 'Financials', 'Materials', 'Healthcare'],
  adverse_sectors: ['Utilities', 'Consumer Discretionary', 'Long-Duration Tech'],
}

// ─── Verdict logic ─────────────────────────────────────────────────────────────
// Combines: displacement risk (40%) + quality score (35%) + regime alignment (25%)
function computeVerdict(stock, qualityScore, regimeAlignment) {
  const d = getDisplacement(stock.ticker)
  if (!d) return null

  // Displacement: lower composite = better (invert to 0–5 scale where 5 = no risk)
  const dispScore = 6 - d.composite  // 1.1 RESILIENT → 4.9, 4.3 CRITICAL → 1.7

  // Quality: 1–5 as-is
  const qualScore = qualityScore || 3

  // Regime: favored=5, neutral=3, adverse=1
  const regScore = regimeAlignment === 'favored' ? 5 : regimeAlignment === 'adverse' ? 1 : 3

  // Weighted composite
  const weighted = (dispScore * 0.40) + (qualScore * 0.35) + (regScore * 0.25)
  // weighted range: ~1.0 (worst) to ~5.0 (best)

  if (weighted >= 3.8) return { verdict: 'BUY',  color: '#1D9E75', bg: 'rgba(29,158,117,0.1)',  border: 'rgba(29,158,117,0.25)', score: weighted }
  if (weighted >= 2.8) return { verdict: 'HOLD', color: '#BA7517', bg: 'rgba(186,117,23,0.1)',  border: 'rgba(186,117,23,0.25)', score: weighted }
  return                       { verdict: 'SELL', color: '#E24B4A', bg: 'rgba(226,75,74,0.1)',   border: 'rgba(226,75,74,0.25)', score: weighted }
}

// ─── Radar sparkline — compact 44x44 pentagon replacing wide bar charts ─────────
function RadarSparkline({ dims }) {
  const SIZE = 44
  const cx = SIZE / 2
  const cy = SIZE / 2
  const maxR = 18
  const angles = [-90, -18, 54, 126, 198].map(a => (a * Math.PI) / 180)
  const scores = [dims.intermediation, dims.arrSeat, dims.customerBase, dims.infrastructure, dims.policySystemic]
  const gridPts = angles.map(a => `${(cx + maxR * Math.cos(a)).toFixed(1)},${(cy + maxR * Math.sin(a)).toFixed(1)}`).join(' ')
  const dataPts = angles.map((a, i) => {
    const r = (scores[i] / 5) * maxR
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`
  }).join(' ')
  const avg = scores.reduce((s, v) => s + v, 0) / scores.length
  const fillColor = avg >= 3.5 ? '#E24B4A' : avg >= 2.5 ? '#BA7517' : '#1D9E75'
  const labels = ['Int', 'ARR', 'Cust', 'Infra', 'Pol']
  const tip = scores.map((s, i) => `${labels[i]}:${s}`).join(' · ')
  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} title={tip} style={{ display: 'block', flexShrink: 0 }}>
      {angles.map((a, i) => (
        <line key={i} x1={cx} y1={cy}
          x2={(cx + maxR * Math.cos(a)).toFixed(1)} y2={(cy + maxR * Math.sin(a)).toFixed(1)}
          stroke="rgba(128,128,128,0.2)" strokeWidth="0.5" />
      ))}
      <polygon points={gridPts} fill="none" stroke="rgba(128,128,128,0.2)" strokeWidth="0.5" />
      <polygon points={dataPts} fill={fillColor} fillOpacity="0.22" stroke={fillColor} strokeWidth="1.2" strokeLinejoin="round" />
      {angles.map((a, i) => {
        const r = (scores[i] / 5) * maxR
        const dc = scores[i] >= 4 ? '#E24B4A' : scores[i] >= 3 ? '#BA7517' : '#1D9E75'
        return <circle key={i} cx={(cx + r * Math.cos(a)).toFixed(1)} cy={(cy + r * Math.sin(a)).toFixed(1)} r="2" fill={dc} />
      })}
    </svg>
  )
}

// ─── Verdict badge ─────────────────────────────────────────────────────────────
function VerdictBadge({ verdict }) {
  if (!verdict) return null
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 5,
      background: verdict.bg, color: verdict.color, border: `1px solid ${verdict.border}`,
      fontFamily: 'var(--font-mono)', letterSpacing: '0.5px',
    }}>
      {verdict.verdict}
    </span>
  )
}

// ─── Thinker dots — compact overlap indicator for table column ─────────────────
function ThinkerDots({ ticker }) {
  const mo    = getMoVerdict(ticker)
  const dario = getDarioVerdict(ticker)
  if (!mo && !dario) return <span style={{ color: 'var(--muted)', fontSize: 10 }}>—</span>

  const moColor    = mo    ? TL_VERDICTS[mo.verdict]?.color    : 'var(--border)'
  const darioColor = dario ? TL_VERDICTS[dario.verdict]?.color : 'var(--border)'
  const moFill     = mo    && (mo.verdict === 'strong-hold' || mo.verdict === 'hold')
  const darioFill  = dario && (dario.verdict === 'strong-hold' || dario.verdict === 'hold')

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'center' }}>
      {/* Mo dot */}
      <div title={`Mo: ${mo?.verdict || '—'} — ${mo?.lens || ''}`} style={{
        width: 9, height: 9, borderRadius: '50%',
        background: moFill ? moColor : 'transparent',
        border: `1.5px solid ${mo ? moColor : 'var(--border)'}`,
        flexShrink: 0,
      }} />
      {/* Dario dot */}
      <div title={`Dario: ${dario?.verdict || '—'} — ${dario?.lens || ''}`} style={{
        width: 9, height: 9, borderRadius: '50%',
        background: darioFill ? darioColor : 'transparent',
        border: `1.5px solid ${dario ? darioColor : 'var(--border)'}`,
        flexShrink: 0,
      }} />
    </div>
  )
}

// ─── Stock detail drawer ────────────────────────────────────────────────────────
function StockDrawer({ stock, price, verdict, regime, onClose }) {
  const d = getDisplacement(stock.ticker)
  const t = d ? getTierConfig(d.tier) : null
  const up = price ? price.changePct >= 0 : true

  return (
    <div style={{
      position: 'fixed', right: 0, top: 0, bottom: 0, width: 420,
      background: 'var(--surface)', borderLeft: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', zIndex: 50, overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface2)', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontWeight: 700, fontSize: 15 }}>{stock.ticker}</span>
              {d && <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 7px', borderRadius: 4, background: t?.bg, color: t?.color, border: `1px solid ${t?.border}`, fontFamily: 'var(--font-mono)' }}>{d.tier}</span>}
              {verdict && <VerdictBadge verdict={verdict} />}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{stock.name}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{stock.sector}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', color: 'var(--muted)', fontSize: 22, lineHeight: 1, cursor: 'pointer' }}>×</button>
        </div>
        {price && (
          <div style={{ marginTop: 10 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 700, lineHeight: 1 }}>${price.price.toFixed(2)}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: up ? 'var(--green)' : 'var(--red)', marginTop: 3 }}>
              {up ? '▲' : '▼'} {Math.abs(price.change).toFixed(2)} ({Math.abs(price.changePct).toFixed(2)}%) today
            </div>
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
        {/* Verdict breakdown */}
        {verdict && (
          <div style={{ padding: '12px 14px', background: verdict.bg, border: `1px solid ${verdict.border}`, borderRadius: 'var(--radius-lg)', marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: verdict.color, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, marginBottom: 8 }}>
              Apex Verdict — {verdict.verdict}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[
                { label: 'Displacement', val: `${(6 - (d?.composite || 3)).toFixed(1)}/5`, note: 'lower risk = higher score' },
                { label: 'Quality', val: `${stock.qualityScore || '—'}/5`, note: 'Buffett metrics' },
                { label: 'Regime', val: regime === 'favored' ? '5/5' : regime === 'adverse' ? '1/5' : '3/5', note: regime || 'neutral' },
              ].map(s => (
                <div key={s.label} style={{ background: 'rgba(0,0,0,0.06)', borderRadius: 'var(--radius)', padding: '8px 10px', textAlign: 'center' }}>
                  <div style={{ fontSize: 9, color: verdict.color, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 3 }}>{s.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-mono)', color: verdict.color }}>{s.val}</div>
                  <div style={{ fontSize: 9, color: verdict.color, opacity: 0.7, marginTop: 2 }}>{s.note}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.7, marginTop: 10 }}>
              Verdict score: <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: verdict.color }}>{verdict.score.toFixed(2)}/5.0</span>
              {' — '}{verdict.verdict === 'BUY' ? 'Strong fundamentals + displacement resilience + regime tailwind' : verdict.verdict === 'HOLD' ? 'Mixed signals — monitor triggers before adding or reducing' : 'Structural displacement risk outweighs quality or regime factors'}
            </div>
          </div>
        )}

        {/* Key metrics if available */}
        {selected.metrics && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8, fontWeight: 600 }}>Quality Metrics</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
              {[
                { label: 'ROIC-WACC', val: `${selected.metrics.roic?.toFixed(1)}%`, good: selected.metrics.roic > 4 },
                { label: 'FCF Yield', val: `${selected.metrics.fcf?.toFixed(1)}%`, good: selected.metrics.fcf > 4 },
                { label: 'EV/EBITDA', val: `${selected.metrics.evebitda?.toFixed(1)}×`, good: selected.metrics.evebitda < 15 },
                { label: 'PEG Ratio', val: selected.metrics.peg?.toFixed(1), good: selected.metrics.peg < 2 },
                { label: 'Debt/EBITDA', val: `${selected.metrics.debt?.toFixed(1)}×`, good: selected.metrics.debt < 2 },
                { label: 'Quality', val: `${selected.qualityScore}/5`, good: selected.qualityScore >= 4 },
              ].map(m => (
                <div key={m.label} style={{ background: 'var(--surface2)', borderRadius: 'var(--radius)', padding: '7px 9px' }}>
                  <div style={{ fontSize: 9, color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginBottom: 2 }}>{m.label}</div>
                  <div style={{ fontSize: 14, fontFamily: 'var(--font-mono)', fontWeight: 700, color: m.good ? 'var(--green)' : 'var(--red)' }}>{m.val}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {d && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8, fontWeight: 600 }}>AI Displacement Risk — {d.composite.toFixed(2)}/5.0</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 }}>
              {[
                { key: 'intermediation', label: 'Intermediation exposure', weight: '25%' },
                { key: 'arrSeat',        label: 'ARR / seat dependency',  weight: '20%' },
                { key: 'customerBase',   label: 'White-collar customer base', weight: '25%' },
                { key: 'infrastructure', label: 'Infrastructure position', weight: '20%' },
                { key: 'policySystemic', label: 'Policy & systemic risk',  weight: '10%' },
              ].map(dim => {
                const score = d.dims[dim.key]
                const color = score >= 4 ? 'var(--red)' : score >= 3 ? 'var(--amber)' : 'var(--green)'
                const reasoning = d.reasoning?.[dim.key]
                return (
                  <div key={dim.key} style={{ background: 'var(--surface2)', borderRadius: 'var(--radius)', padding: '9px 11px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 500 }}>{dim.label}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 9, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{dim.weight}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)', color }}>{score}/5</span>
                      </div>
                    </div>
                    <div style={{ height: 4, background: 'var(--border2)', borderRadius: 2, marginBottom: reasoning ? 5 : 0 }}>
                      <div style={{ height: '100%', width: `${(score/5)*100}%`, background: color, borderRadius: 2 }} />
                    </div>
                    {reasoning && <div style={{ fontSize: 10, color: 'var(--text2)', lineHeight: 1.6, marginTop: 4 }}>{reasoning}</div>}
                  </div>
                )
              })}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.7, padding: '9px 11px', background: 'var(--surface2)', borderRadius: 'var(--radius)', borderLeft: `3px solid ${t?.color}` }}>
              <strong style={{ color: 'var(--text)', fontWeight: 500 }}>Apex Verdict:</strong> {d.verdict}
            </div>
          </div>
        )}

        {/* Monitoring triggers */}
        {d?.monitoring?.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8, fontWeight: 600 }}>Monitoring triggers</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {d.monitoring.map((trigger, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, padding: '7px 10px', background: 'var(--surface2)', borderRadius: 'var(--radius)', fontSize: 11, color: 'var(--text2)', lineHeight: 1.6 }}>
                  <span style={{ color: 'var(--accent)', flexShrink: 0, fontFamily: 'var(--font-mono)' }}>{i + 1}.</span>
                  {trigger}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Thought Leaders */}
        {(() => {
          const tl = getTL(stock.ticker)
          if (!tl) return null
          const mo    = getMoVerdict(stock.ticker)
          const dario = getDarioVerdict(stock.ticker)
          const ov    = getTLOverlap(stock.ticker)
          return (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8, fontWeight: 600 }}>
                Thought Leaders
              </div>

              {/* Overlap badge */}
              <div style={{ marginBottom: 10 }}>
                <span style={{
                  fontSize: 9, fontWeight: 700, padding: '2px 9px', borderRadius: 10,
                  background: ov.bg, color: ov.color, border: `1px solid ${ov.border}`,
                  fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.5px',
                }}>
                  {ov.label}
                </span>
              </div>

              {/* Mo card */}
              <div style={{ padding: '10px 12px', background: 'var(--surface2)', borderRadius: 'var(--radius)', borderLeft: `3px solid ${mo.color}`, marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)' }}>Mo Gawdat</span>
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: '1px 7px', borderRadius: 4,
                    background: mo.bg, color: mo.color, border: `1px solid ${mo.border}`,
                    fontFamily: 'var(--font-mono)',
                  }}>{mo.label}</span>
                </div>
                <div style={{ fontSize: 10, color: mo.color, fontFamily: 'var(--font-mono)', marginBottom: 5, opacity: 0.85 }}>
                  {mo.lens}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.6 }}>
                  {mo.rationale}
                </div>
              </div>

              {/* Dario card */}
              <div style={{ padding: '10px 12px', background: 'var(--surface2)', borderRadius: 'var(--radius)', borderLeft: `3px solid ${dario.color}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)' }}>Dario Amodei</span>
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: '1px 7px', borderRadius: 4,
                    background: dario.bg, color: dario.color, border: `1px solid ${dario.border}`,
                    fontFamily: 'var(--font-mono)',
                  }}>{dario.label}</span>
                </div>
                <div style={{ fontSize: 10, color: dario.color, fontFamily: 'var(--font-mono)', marginBottom: 5, opacity: 0.85 }}>
                  {dario.lens}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.6 }}>
                  {dario.rationale}
                </div>
              </div>
            </div>
          )
        })()}

        <div style={{ fontSize: 9, color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginTop: 8, lineHeight: 1.6 }}>
          Framework: Citrini 2028 scenario · Tail risk reference, not base case · Not financial advice
        </div>
      </div>
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function PortfolioTracker() {
  const { prices, fetchPrices, loading: priceLoading } = useMarketData()
  const [regime, setRegime] = useState(REGIME_BASELINE)
  const [selected, setSelected] = useState(null)
  const [activeTab, setActiveTab] = useState('all')
  const [sortField, setSortField] = useState('verdict')
  const [sortDir, setSortDir] = useState('desc')
  const [search, setSearch] = useState('')
  const [verdictFilter, setVerdictFilter] = useState('')
  const [tierFilter, setTierFilter] = useState('')
  const [thinkerFilter, setThinkerFilter] = useState('')
  const [loadingPrices, setLoadingPrices] = useState(false)

  // All 44 displacement stocks, enriched with quality data where available
  const ALL_STOCKS = DISPLACEMENT_STOCKS.map(d => {
    // First check COMPANIES_SCORED (has 100 S&P stocks), then TECH_COMPANIES, then DISPLACEMENT_QUALITY
    const co = [...COMPANIES_SCORED, ...TECH_COMPANIES].find(c => c.ticker === d.ticker)
    const ext = !co ? getQualityData(d.ticker) : null
    const qualityScore = co?.score ?? ext?.score ?? null
    return {
      ...d,
      qualityScore,
      metrics: co
        ? { roic: co.roic, fcf: co.fcf, evebitda: co.evebitda, peg: co.peg, debt: co.debt }
        : ext
        ? { roic: ext.roic, fcf: ext.fcf, evebitda: ext.evebitda, peg: ext.peg, debt: ext.debt }
        : null,
    }
  })

  // Load regime from Supabase
  useEffect(() => {
    supabase.from('market_conditions').select('regime,favored_sectors,adverse_sectors')
      .order('fetched_at', { ascending: false }).limit(1)
      .then(({ data }) => { if (data?.[0]) setRegime(data[0]) })
  }, [])

  // Fetch all prices on mount
  useEffect(() => {
    const tickers = ALL_STOCKS.map(s => s.ticker)
    // Batch into groups of 15 to avoid rate limits
    const batches = []
    for (let i = 0; i < tickers.length; i += 15) batches.push(tickers.slice(i, i + 15))
    const fetchAll = async () => {
      setLoadingPrices(true)
      for (const batch of batches) {
        await fetchPrices(batch)
        await new Promise(r => setTimeout(r, 300))
      }
      setLoadingPrices(false)
    }
    fetchAll()
  }, [])

  // Compute regime alignment per stock
  const getRegimeAlignment = useCallback((stock) => {
    const fav = regime.favored_sectors || []
    const adv = regime.adverse_sectors || []
    const isFav = fav.some(s => stock.sector?.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(stock.sector?.toLowerCase()))
    const isAdv = adv.some(s => stock.sector?.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(stock.sector?.toLowerCase()))
    return isFav ? 'favored' : isAdv ? 'adverse' : 'neutral'
  }, [regime])

  // Compute final enriched stock list
  const enriched = ALL_STOCKS.map(stock => {
    const regimeAlign = getRegimeAlignment(stock)
    const verdict = computeVerdict(stock, stock.qualityScore, regimeAlign)
    return { ...stock, regimeAlignment: regimeAlign, verdict }
  })

  // Filter + sort
  const filtered = enriched
    .filter(s => {
      if (search && !s.ticker.toLowerCase().includes(search.toLowerCase()) &&
          !s.name.toLowerCase().includes(search.toLowerCase())) return false
      if (verdictFilter && s.verdict?.verdict !== verdictFilter) return false
      if (tierFilter && s.tier !== tierFilter) return false
      if (activeTab === 'buy'  && s.verdict?.verdict !== 'BUY')  return false
      if (activeTab === 'hold' && s.verdict?.verdict !== 'HOLD') return false
      if (activeTab === 'sell' && s.verdict?.verdict !== 'SELL') return false
      if (activeTab === 'mo' || thinkerFilter === 'mo') {
        const mo = getMoVerdict(s.ticker)
        if (!mo || (mo.verdict !== 'strong-hold' && mo.verdict !== 'hold')) return false
      }
      if (activeTab === 'dario' || thinkerFilter === 'dario') {
        const dario = getDarioVerdict(s.ticker)
        if (!dario || (dario.verdict !== 'strong-hold' && dario.verdict !== 'hold')) return false
      }
      return true
    })
    .sort((a, b) => {
      if (sortField === 'verdict') {
        const order = { BUY: 3, HOLD: 2, SELL: 1 }
        return sortDir === 'desc'
          ? (order[b.verdict?.verdict] || 0) - (order[a.verdict?.verdict] || 0)
          : (order[a.verdict?.verdict] || 0) - (order[b.verdict?.verdict] || 0)
      }
      if (sortField === 'displacement') return sortDir === 'desc' ? b.composite - a.composite : a.composite - b.composite
      if (sortField === 'quality') return sortDir === 'desc' ? (b.qualityScore||0) - (a.qualityScore||0) : (a.qualityScore||0) - (b.qualityScore||0)
      if (sortField === 'price') {
        const ap = prices[a.ticker]?.price || 0, bp = prices[b.ticker]?.price || 0
        return sortDir === 'desc' ? bp - ap : ap - bp
      }
      if (sortField === 'change') {
        const ac = prices[a.ticker]?.changePct || 0, bc = prices[b.ticker]?.changePct || 0
        return sortDir === 'desc' ? bc - ac : ac - bc
      }
      return 0
    })

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('desc') }
  }

  // Summary counts
  const buys  = enriched.filter(s => s.verdict?.verdict === 'BUY').length
  const holds = enriched.filter(s => s.verdict?.verdict === 'HOLD').length
  const sells = enriched.filter(s => s.verdict?.verdict === 'SELL').length
  const resilient = enriched.filter(s => s.tier === 'RESILIENT' || s.tier === 'LOW').length
  const atRisk    = enriched.filter(s => s.tier === 'HIGH' || s.tier === 'CRITICAL').length

  const TABS = [
    { id: 'all',   label: `All ${enriched.length}` },
    { id: 'buy',   label: `Buy ${buys}`,   color: '#1D9E75' },
    { id: 'hold',  label: `Hold ${holds}`, color: '#BA7517' },
    { id: 'sell',  label: `Sell ${sells}`, color: '#E24B4A' },
    { id: 'mo',    label: 'Mo ✓',          color: '#1D9E75' },
    { id: 'dario', label: 'Dario ✓',       color: '#378ADD' },
  ]

  const SortHeader = ({ field, label, align = 'left' }) => (
    <th onClick={() => handleSort(field)} style={{
      padding: '7px 10px', textAlign: align,
      fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 600,
      textTransform: 'uppercase', letterSpacing: '0.5px', cursor: 'pointer',
      color: sortField === field ? 'var(--accent)' : 'var(--muted)', userSelect: 'none', whiteSpace: 'nowrap',
    }}>
      {label}{sortField === field && <span style={{ marginLeft: 3 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>}
    </th>
  )

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ padding: '13px 24px 0', borderBottom: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 6 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 20 }}>Portfolio Tracker</span>
          <span style={{ fontSize: 11, color: 'var(--muted)' }}>44 stocks · AI displacement · buy / hold / sell · Mo Gawdat · Dario Amodei</span>
          {loadingPrices && <span style={{ fontSize: 10, color: 'var(--amber)', fontFamily: 'var(--font-mono)' }}>Fetching prices…</span>}
        </div>

        {/* Summary row */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
          {[
            { label: 'Buy', val: buys,  color: '#1D9E75', bg: 'rgba(29,158,117,0.08)',  border: 'rgba(29,158,117,0.2)' },
            { label: 'Hold', val: holds, color: '#BA7517', bg: 'rgba(186,117,23,0.08)',  border: 'rgba(186,117,23,0.2)' },
            { label: 'Sell', val: sells, color: '#E24B4A', bg: 'rgba(226,75,74,0.08)',   border: 'rgba(226,75,74,0.2)' },
            { label: 'Resilient / Low risk', val: resilient, color: '#378ADD', bg: 'rgba(55,138,221,0.08)', border: 'rgba(55,138,221,0.2)' },
            { label: 'High / Critical risk', val: atRisk,    color: '#E24B4A', bg: 'rgba(226,75,74,0.04)', border: 'rgba(226,75,74,0.15)' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6, fontSize: 11 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: s.color, fontSize: 14 }}>{s.val}</span>
              <span style={{ color: 'var(--muted)' }}>{s.label}</span>
            </div>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
            Regime: <span style={{ color: '#E24B4A', fontWeight: 600 }}>{regime.regime?.replace('_', ' ')}</span>
          </div>
        </div>

        {/* Tabs + filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
                color: activeTab === tab.id ? 'var(--accent)' : 'var(--text2)',
                fontSize: 12, fontWeight: 600, marginBottom: -1,
                ...(tab.color && activeTab === tab.id ? { borderBottomColor: tab.color, color: tab.color } : {}),
              }}>
              {tab.label}
            </button>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, paddingBottom: 1 }}>
            <input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)}
              style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text)', padding: '5px 10px', fontSize: 11, outline: 'none', width: 130 }} />
            <select value={tierFilter} onChange={e => setTierFilter(e.target.value)}
              style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text)', padding: '5px 8px', fontSize: 11 }}>
              <option value=''>All tiers</option>
              {['RESILIENT','LOW','MEDIUM','HIGH','CRITICAL'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <button onClick={() => fetchPrices(ALL_STOCKS.map(s => s.ticker))} disabled={priceLoading}
              style={{ padding: '5px 12px', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', color: 'var(--accent)', borderRadius: 'var(--radius)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-mono)' }}>
              ↻ Prices
            </button>
          </div>
        </div>
      </div>

      {/* Portfolio heat map — visual risk distribution */}
      <div style={{ padding: '10px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg)', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 2, height: 24, borderRadius: 6, overflow: 'hidden', marginBottom: 4 }}>
          {enriched
            .sort((a, b) => b.composite - a.composite)
            .map(s => {
              const t = getTierConfig(s.tier)
              const v = s.verdict
              return (
                <div
                  key={s.ticker}
                  title={`${s.ticker}: ${s.tier} (${s.composite.toFixed(1)}) — ${v?.verdict || '?'}`}
                  onClick={() => setSelected(selected?.ticker === s.ticker ? null : s)}
                  style={{
                    flex: 1, background: t.color, opacity: selected?.ticker === s.ticker ? 1 : 0.65,
                    cursor: 'pointer', transition: 'opacity 0.1s',
                    outline: selected?.ticker === s.ticker ? `2px solid white` : 'none',
                    outlineOffset: -1,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '1' }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = selected?.ticker === s.ticker ? '1' : '0.65' }}
                />
              )
            })}
        </div>
        <div style={{ display: 'flex', gap: 12, fontSize: 9, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
          <span>← Higher displacement risk</span>
          <span style={{ marginLeft: 'auto' }}>Lower displacement risk →</span>
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: 'auto', paddingRight: selected ? 440 : 0, transition: 'padding-right 0.2s' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 10 }}>
              <SortHeader field="ticker"  label="Ticker" />
              <th style={{ padding: '7px 10px', textAlign: 'left', fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--muted)' }}>Company</th>
              <th style={{ padding: '7px 10px', textAlign: 'left', fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--muted)' }}>Sector</th>
              <SortHeader field="price"       label="Price"      align="right" />
              <SortHeader field="change"      label="1d"         align="right" />
              <SortHeader field="displacement" label="Disp. risk" align="center" />
              <th style={{ padding: '7px 8px', textAlign: 'center', fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--muted)', width: 52 }}>5D</th>
              <SortHeader field="quality" label="Quality"  align="center" />
              <th style={{ padding: '7px 10px', textAlign: 'center', fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--muted)' }}>Regime</th>
              <SortHeader field="verdict" label="Verdict"  align="center" />
              <th style={{ padding: '7px 10px', textAlign: 'center', fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--muted)' }}>
                M · D
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((stock, i) => {
              const pr = prices[stock.ticker]
              const t = getTierConfig(stock.tier)
              const up = pr ? pr.changePct >= 0 : null
              const isSel = selected?.ticker === stock.ticker
              return (
                <tr key={stock.ticker}
                  onClick={() => setSelected(isSel ? null : stock)}
                  style={{
                    borderBottom: '1px solid var(--border)', cursor: 'pointer',
                    background: isSel ? 'rgba(91,138,240,0.05)' : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                  }}
                  onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = 'var(--surface2)' }}
                  onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}
                >
                  {/* Ticker */}
                  <td style={{ padding: '5px 8px', fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap' }}>
                    {stock.ticker}
                  </td>
                  {/* Name */}
                  <td style={{ padding: '5px 8px', fontSize: 11, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text2)' }}>
                    {stock.name}
                  </td>
                  {/* Sector */}
                  <td style={{ padding: '5px 8px', fontSize: 10, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                    {stock.sector}
                  </td>
                  {/* Price */}
                  <td style={{ padding: '5px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {pr ? `$${pr.price.toFixed(2)}` : <span style={{ color: 'var(--muted)' }}>—</span>}
                  </td>
                  {/* 1d change */}
                  <td style={{ padding: '5px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 11, color: up === null ? 'var(--muted)' : up ? 'var(--green)' : 'var(--red)', whiteSpace: 'nowrap' }}>
                    {pr ? `${up ? '▲' : '▼'} ${Math.abs(pr.changePct).toFixed(2)}%` : '—'}
                  </td>
                  {/* Displacement tier */}
                  <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: t.bg, color: t.color, border: `1px solid ${t.border}`, fontFamily: 'var(--font-mono)' }}>
                        {stock.tier.slice(0, 3) === 'RES' ? 'RES' : stock.tier.slice(0, 4)}
                      </span>
                      <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: t.color }}>{stock.composite.toFixed(1)}</span>
                    </div>
                  </td>
                  {/* 5 dimensions — radar sparkline */}
                  <td style={{ padding: '4px 8px', textAlign: 'center', width: 52 }}>
                    <RadarSparkline dims={stock.dims} />
                  </td>
                  {/* Quality score */}
                  <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                    {stock.qualityScore != null
                      ? <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, color: stock.qualityScore >= 4 ? 'var(--green)' : stock.qualityScore === 3 ? 'var(--amber)' : 'var(--red)' }}>{stock.qualityScore}/5</span>
                      : <span style={{ fontSize: 10, color: 'var(--muted)' }}>—</span>
                    }
                  </td>
                  {/* Regime alignment */}
                  <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                    <span style={{
                      fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 10,
                      background: stock.regimeAlignment === 'favored' ? 'rgba(29,158,117,0.1)' : stock.regimeAlignment === 'adverse' ? 'rgba(226,75,74,0.1)' : 'rgba(136,135,128,0.15)',
                      color: stock.regimeAlignment === 'favored' ? 'var(--green)' : stock.regimeAlignment === 'adverse' ? 'var(--red)' : 'var(--muted)',
                      border: `1px solid ${stock.regimeAlignment === 'favored' ? 'rgba(29,158,117,0.2)' : stock.regimeAlignment === 'adverse' ? 'rgba(226,75,74,0.2)' : 'var(--border)'}`,
                      textTransform: 'uppercase', letterSpacing: '0.4px', fontFamily: 'var(--font-mono)',
                    }}>
                      {stock.regimeAlignment.slice(0, 3).toUpperCase()}
                    </span>
                  </td>
                  {/* Verdict */}
                  <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                    {stock.verdict ? <VerdictBadge verdict={stock.verdict} /> : '—'}
                  </td>
                  {/* Thinker dots */}
                  <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                    <ThinkerDots ticker={stock.ticker} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>
            No stocks match the current filter.
          </div>
        )}
        <div style={{ padding: '10px 16px', fontSize: 9, color: 'var(--muted)', fontFamily: 'var(--font-mono)', lineHeight: 1.6 }}>
          Verdict = displacement risk (40%) + quality score (35%) + regime alignment (25%) · M = Mo Gawdat lens · D = Dario Amodei lens · dot filled = endorsed · Framework: Citrini 2028 tail risk scenario · Not financial advice
        </div>
      </div>

      {/* Detail drawer */}
      {selected && (
        <StockDrawer
          stock={selected}
          price={prices[selected.ticker]}
          verdict={selected.verdict}
          regime={selected.regimeAlignment}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
