import { scoreMetric } from '../lib/data'

const SCORE_CONFIG = {
  5: { bg: 'rgba(32,200,120,0.15)', color: '#20c878', label: '★★★★★' },
  4: { bg: 'rgba(32,200,120,0.08)', color: '#72d9a8', label: '★★★★' },
  3: { bg: 'rgba(244,167,36,0.12)', color: '#f4a724', label: '★★★' },
  2: { bg: 'rgba(240,82,82,0.08)', color: '#f08080', label: '★★' },
  1: { bg: 'rgba(240,82,82,0.15)', color: '#f05252', label: '★' },
}

export function ScoreBadge({ score, size = 'md' }) {
  const cfg = SCORE_CONFIG[score] || SCORE_CONFIG[3]
  const sizes = { sm: { padding: '2px 6px', fontSize: 10 }, md: { padding: '3px 8px', fontSize: 11 }, lg: { padding: '5px 12px', fontSize: 13 } }
  const s = sizes[size]
  return (
    <span style={{
      background: cfg.bg, color: cfg.color,
      padding: s.padding, borderRadius: 4,
      fontFamily: 'var(--font-mono)', fontSize: s.fontSize, fontWeight: 500,
      display: 'inline-block', letterSpacing: '0.5px',
    }}>
      {score}/5
    </span>
  )
}

export function MetricCell({ value, metric, suffix = '' }) {
  const s = scoreMetric(value, metric)
  const color = s >= 4 ? 'var(--green)' : s === 3 ? 'var(--amber)' : 'var(--red)'
  const sign = ['oplev','revpemp'].includes(metric) && value > 0 ? '+' : ''
  return (
    <span style={{ color, fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500 }}>
      {sign}{typeof value === 'number' ? value.toFixed(1) : value}{suffix}
    </span>
  )
}

export function SectorBadge({ sector }) {
  const colors = {
    Financials: { bg:'rgba(91,138,240,0.12)', color:'#7ab3fc' },
    Healthcare: { bg:'rgba(32,200,120,0.1)',  color:'#5de0a0' },
    Consumer:   { bg:'rgba(244,167,36,0.1)',  color:'#f5c06a' },
    Industrials:{ bg:'rgba(167,139,250,0.12)',color:'#c4b5fd' },
    Energy:     { bg:'rgba(45,212,191,0.1)',  color:'#5dddd0' },
  }
  const cfg = colors[sector] || { bg:'rgba(255,255,255,0.06)', color:'var(--text2)' }
  return (
    <span style={{
      background: cfg.bg, color: cfg.color,
      padding: '2px 7px', borderRadius: 3,
      fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 600,
      textTransform: 'uppercase', letterSpacing: '0.5px',
    }}>
      {sector}
    </span>
  )
}

export function PriceChange({ change, pct }) {
  const up = change >= 0
  return (
    <span style={{ color: up ? 'var(--green)' : 'var(--red)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
      {up ? '▲' : '▼'} {Math.abs(pct).toFixed(2)}%
    </span>
  )
}
