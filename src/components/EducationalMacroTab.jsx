import { useState } from 'react'
import { INDICATORS } from '../lib/indicators'

function IndicatorRow({ indicatorKey, value, displayValue, color, isAlert }) {
  const [expanded, setExpanded] = useState(false)
  const ind = INDICATORS[indicatorKey]
  if (!ind) return null
  const reading = ind.read ? ind.read(value) : null

  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <div
        onClick={() => setExpanded(v => !v)}
        style={{
          display: 'grid', gridTemplateColumns: '220px 1fr 90px 60px',
          alignItems: 'center', gap: 12, padding: '8px 12px', cursor: 'pointer',
          background: expanded ? 'var(--surface2)' : 'transparent',
          borderLeft: `2px solid ${isAlert ? '#E24B4A' : expanded ? color : 'transparent'}`,
          transition: 'background 0.1s',
        }}
        onMouseEnter={e => { if (!expanded) e.currentTarget.style.background = 'var(--surface2)' }}
        onMouseLeave={e => { if (!expanded) e.currentTarget.style.background = 'transparent' }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {ind.name}
          </div>
          <div style={{ fontSize: 9, color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginTop: 1 }}>
            {ind.series.split(' · ').slice(0, 2).join(' · ')}
          </div>
        </div>
        <div style={{ fontSize: 11, color: color || 'var(--text2)', lineHeight: 1.4 }}>
          {reading || '—'}
        </div>
        <div style={{ textAlign: 'right', fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)', color: color || 'var(--text)' }}>
          {displayValue}
        </div>
        <div style={{ textAlign: 'right', fontSize: 9, color: 'var(--muted)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
          {expanded ? '▲ less' : '▼ detail'}
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '14px 14px 16px', background: 'var(--surface2)', borderLeft: `2px solid ${color}` }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>What it measures</div>
              <div style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.7 }}>{ind.what}</div>
            </div>
            <div>
              <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>Why markets care</div>
              <div style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.7 }}>{ind.why}</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ padding: '8px 12px', borderRadius: 'var(--radius)', background: 'rgba(186,117,23,0.06)', border: '1px solid rgba(186,117,23,0.15)' }}>
              <div style={{ fontSize: 9, fontWeight: 600, color: '#BA7517', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Buffett lens</div>
              <div style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.65 }}>{ind.buffett}</div>
            </div>
            <div style={{ padding: '8px 12px', borderRadius: 'var(--radius)', background: 'rgba(91,138,240,0.06)', border: '1px solid rgba(91,138,240,0.15)' }}>
              <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Dalio lens</div>
              <div style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.65 }}>{ind.dalio}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function IndicatorGroup({ title, color, children, alertCount = 0 }) {
  const [open, setOpen] = useState(true)
  const childCount = Array.isArray(children) ? children.length : 1
  return (
    <div style={{ marginBottom: 6, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      <div
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 12px', cursor: 'pointer', background: 'var(--surface2)',
          borderBottom: open ? '1px solid var(--border)' : 'none',
        }}
      >
        <div style={{ width: 3, height: 12, background: color, borderRadius: 2, flexShrink: 0 }} />
        <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.6px', flex: 1 }}>{title}</span>
        <span style={{ fontSize: 9, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{childCount} indicator{childCount > 1 ? 's' : ''}</span>
        {alertCount > 0 && (
          <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 7px', borderRadius: 10, background: 'rgba(240,82,82,0.12)', color: 'var(--red)', border: '1px solid rgba(240,82,82,0.2)' }}>
            ⚠ {alertCount}
          </span>
        )}
        <span style={{ fontSize: 9, color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginLeft: 4 }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 90px 60px', gap: 12, padding: '5px 12px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)' }}>
            {['Indicator', 'Current reading', 'Value', ''].map((h, i) => (
              <div key={h} style={{ fontSize: 9, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: i === 2 ? 'right' : 'left' }}>{h}</div>
            ))}
          </div>
          {children}
        </>
      )}
    </div>
  )
}

export default function EducationalMacroTab({ data, fmt, fmtPct }) {
  const fmtSpread = (v) => v != null ? `${v > 0 ? '+' : ''}${Number(v).toFixed(2)}%` : '—'

  const inflationAlerts = [data.cpi > 3].filter(Boolean).length
  const ratesAlerts     = [data.yield_inverted].filter(Boolean).length
  const growthAlerts    = [data.pmi_mfg < 48, data.jobless_claims > 300000].filter(Boolean).length
  const creditAlerts    = [data.hy_spread > 5, data.fin_stress > 1].filter(Boolean).length
  const consumerAlerts  = [data.consumer_sent < 60].filter(Boolean).length
  const sentimentAlerts = [data.vix > 30].filter(Boolean).length

  return (
    <div>
      <div style={{ marginBottom: 12, fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>
        13 indicators · 6 groups. Each row shows the current reading in plain English. Click any row to expand the full educational breakdown — what it measures, why markets care, and how Buffett and Dalio each interpret it. Click the group header to collapse.
      </div>

      <IndicatorGroup title="Inflation" color="#E24B4A" alertCount={inflationAlerts}>
        <IndicatorRow indicatorKey="cpi" value={data.cpi} displayValue={data.cpi ? `${data.cpi.toFixed(1)}%` : '—'} color={data.cpi > 3 ? '#E24B4A' : data.cpi > 2 ? '#BA7517' : '#1D9E75'} isAlert={data.cpi > 3} />
        <IndicatorRow indicatorKey="ppi" value={data.ppi} displayValue={data.ppi ? `${data.ppi.toFixed(1)}%` : '—'} color={data.ppi > 4 ? '#E24B4A' : data.ppi > 2 ? '#BA7517' : '#1D9E75'} />
        <IndicatorRow indicatorKey="breakeven_5y" value={data.breakeven_5y} displayValue={data.breakeven_5y ? `${data.breakeven_5y.toFixed(2)}%` : '—'} color={data.breakeven_5y > 2.8 ? '#E24B4A' : data.breakeven_5y > 2.2 ? '#BA7517' : '#1D9E75'} />
      </IndicatorGroup>

      <IndicatorGroup title="Interest Rates & Yield Curve" color="#378ADD" alertCount={ratesAlerts}>
        <IndicatorRow indicatorKey="fed_funds" value={data.fed_funds} displayValue={data.fed_funds ? `${Number(data.fed_funds).toFixed(2)}%` : '—'} color={data.fed_funds > 4.5 ? '#E24B4A' : data.fed_funds > 3 ? '#BA7517' : '#1D9E75'} />
        <IndicatorRow indicatorKey="spread_2s10s" value={data.spread_2s10s} displayValue={fmtSpread(data.spread_2s10s)} color={data.yield_inverted ? '#E24B4A' : data.spread_2s10s < 0.3 ? '#BA7517' : '#1D9E75'} isAlert={data.yield_inverted} />
        <IndicatorRow indicatorKey="yield_10y" value={data.yield_10y} displayValue={data.yield_10y ? `${Number(data.yield_10y).toFixed(2)}%` : '—'} color={data.yield_10y > 5 ? '#E24B4A' : data.yield_10y > 4 ? '#BA7517' : '#1D9E75'} />
      </IndicatorGroup>

      <IndicatorGroup title="Growth & Economic Activity" color="#1D9E75" alertCount={growthAlerts}>
        <IndicatorRow indicatorKey="pmi_mfg" value={data.pmi_mfg} displayValue={data.pmi_mfg ? data.pmi_mfg.toFixed(1) : '—'} color={data.pmi_mfg > 52 ? '#1D9E75' : data.pmi_mfg > 50 ? '#BA7517' : '#E24B4A'} isAlert={data.pmi_mfg < 48} />
        <IndicatorRow indicatorKey="unemployment" value={data.unemployment} displayValue={data.unemployment ? `${data.unemployment.toFixed(1)}%` : '—'} color={data.unemployment < 4.5 ? '#1D9E75' : data.unemployment < 6 ? '#BA7517' : '#E24B4A'} />
        <IndicatorRow indicatorKey="jobless_claims" value={data.jobless_claims} displayValue={data.jobless_claims ? data.jobless_claims.toLocaleString() : '—'} color={data.jobless_claims < 250000 ? '#1D9E75' : data.jobless_claims < 300000 ? '#BA7517' : '#E24B4A'} isAlert={data.jobless_claims > 300000} />
      </IndicatorGroup>

      <IndicatorGroup title="Credit & Financial Stress" color="#BA7517" alertCount={creditAlerts}>
        <IndicatorRow indicatorKey="hy_spread" value={data.hy_spread} displayValue={data.hy_spread ? `${data.hy_spread.toFixed(2)}%` : '—'} color={data.hy_spread > 5 ? '#E24B4A' : data.hy_spread > 3.5 ? '#BA7517' : '#1D9E75'} isAlert={data.hy_spread > 5} />
        <IndicatorRow indicatorKey="fin_stress" value={data.fin_stress} displayValue={data.fin_stress != null ? data.fin_stress.toFixed(2) : '—'} color={data.fin_stress > 1 ? '#E24B4A' : data.fin_stress > 0 ? '#BA7517' : '#1D9E75'} isAlert={data.fin_stress > 1} />
      </IndicatorGroup>

      <IndicatorGroup title="Consumer Health" color="#7F77DD" alertCount={consumerAlerts}>
        <IndicatorRow indicatorKey="consumer_sent" value={data.consumer_sent} displayValue={data.consumer_sent ? data.consumer_sent.toFixed(1) : '—'} color={data.consumer_sent > 85 ? '#1D9E75' : data.consumer_sent > 65 ? '#BA7517' : '#E24B4A'} isAlert={data.consumer_sent < 60} />
        <IndicatorRow indicatorKey="savings_rate" value={data.savings_rate} displayValue={data.savings_rate ? `${data.savings_rate.toFixed(1)}%` : '—'} color={data.savings_rate > 6 ? '#1D9E75' : data.savings_rate > 4 ? '#BA7517' : '#E24B4A'} />
      </IndicatorGroup>

      <IndicatorGroup title="Market Sentiment" color="#888780" alertCount={sentimentAlerts}>
        <IndicatorRow indicatorKey="fear_greed_score" value={data.fear_greed_score} displayValue={data.fear_greed_score ? `${Math.round(data.fear_greed_score)} · ${data.fear_greed_rating || ''}` : '—'} color={data.fear_greed_score < 25 ? '#1D9E75' : data.fear_greed_score < 40 ? '#BA7517' : data.fear_greed_score > 75 ? '#E24B4A' : 'var(--text)'} />
        <IndicatorRow indicatorKey="vix" value={data.vix} displayValue={data.vix ? data.vix.toFixed(1) : '—'} color={data.vix > 30 ? '#E24B4A' : data.vix > 20 ? '#BA7517' : '#1D9E75'} isAlert={data.vix > 30} />
      </IndicatorGroup>

      <div style={{ fontSize: 9, color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginTop: 8, lineHeight: 1.6 }}>
        Educational content reflects established economic frameworks. Not financial advice. Buffett and Dalio interpretations based on their published writings.
      </div>
    </div>
  )
}
