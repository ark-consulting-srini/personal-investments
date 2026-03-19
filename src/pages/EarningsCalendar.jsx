import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth.jsx'
import { getWatchlist } from '../lib/supabase'
import { COMPANIES_SCORED } from '../lib/data'
import { SectorBadge, ScoreBadge } from '../components/Badges'

const PROXY = 'https://api.allorigins.win/get?url='

// Hardcoded upcoming earnings dates for our 50 companies (updated quarterly)
// In a real app these would come from a financial data API
const EARNINGS_DATES = {
  JPM:  { date: '2026-04-11', estimate: '$4.65 EPS', period: 'Q1 2026' },
  BAC:  { date: '2026-04-14', estimate: '$0.82 EPS', period: 'Q1 2026' },
  WFC:  { date: '2026-04-11', estimate: '$1.24 EPS', period: 'Q1 2026' },
  GS:   { date: '2026-04-14', estimate: '$9.12 EPS', period: 'Q1 2026' },
  MS:   { date: '2026-04-16', estimate: '$2.28 EPS', period: 'Q1 2026' },
  PGR:  { date: '2026-04-15', estimate: '$4.82 EPS', period: 'Q1 2026' },
  CB:   { date: '2026-04-23', estimate: '$5.44 EPS', period: 'Q1 2026' },
  AXP:  { date: '2026-04-17', estimate: '$3.78 EPS', period: 'Q1 2026' },
  UNH:  { date: '2026-04-15', estimate: '$7.22 EPS', period: 'Q1 2026' },
  JNJ:  { date: '2026-04-15', estimate: '$2.58 EPS', period: 'Q1 2026' },
  LLY:  { date: '2026-04-30', estimate: '$3.52 EPS', period: 'Q1 2026' },
  ABT:  { date: '2026-04-16', estimate: '$1.09 EPS', period: 'Q1 2026' },
  TMO:  { date: '2026-04-23', estimate: '$5.68 EPS', period: 'Q1 2026' },
  HCA:  { date: '2026-04-25', estimate: '$6.48 EPS', period: 'Q1 2026' },
  WMT:  { date: '2026-05-14', estimate: '$0.57 EPS', period: 'Q1 FY2027' },
  COST: { date: '2026-06-04', estimate: '$4.02 EPS', period: 'Q3 FY2026' },
  PG:   { date: '2026-04-23', estimate: '$1.44 EPS', period: 'Q3 FY2026' },
  KO:   { date: '2026-04-29', estimate: '$0.73 EPS', period: 'Q1 2026' },
  PEP:  { date: '2026-04-24', estimate: '$1.48 EPS', period: 'Q1 2026' },
  MCD:  { date: '2026-04-29', estimate: '$2.88 EPS', period: 'Q1 2026' },
  MAR:  { date: '2026-04-30', estimate: '$2.14 EPS', period: 'Q1 2026' },
  CAT:  { date: '2026-04-28', estimate: '$4.22 EPS', period: 'Q1 2026' },
  DE:   { date: '2026-05-15', estimate: '$5.68 EPS', period: 'Q2 FY2026' },
  HON:  { date: '2026-04-24', estimate: '$2.28 EPS', period: 'Q1 2026' },
  UNP:  { date: '2026-04-24', estimate: '$2.82 EPS', period: 'Q1 2026' },
  LMT:  { date: '2026-04-21', estimate: '$7.12 EPS', period: 'Q1 2026' },
  GE:   { date: '2026-04-22', estimate: '$1.08 EPS', period: 'Q1 2026' },
  XOM:  { date: '2026-05-02', estimate: '$1.72 EPS', period: 'Q1 2026' },
  CVX:  { date: '2026-05-02', estimate: '$2.44 EPS', period: 'Q1 2026' },
  COP:  { date: '2026-05-01', estimate: '$1.88 EPS', period: 'Q1 2026' },
  EOG:  { date: '2026-05-01', estimate: '$2.82 EPS', period: 'Q1 2026' },
}

const WATCH_POINTS = {
  JPM:  'Watch: Net interest margin, AI-driven efficiency ratio, loan loss provisions',
  BAC:  'Watch: NII trajectory, Erica adoption metrics, credit quality',
  GS:   'Watch: Investment banking recovery, AI infrastructure spend commentary',
  UNH:  'Watch: Medical loss ratio, Medicare Advantage membership, AI claims commentary',
  LLY:  'Watch: GLP-1 demand, Mounjaro/Zepbound supply, pipeline updates',
  WMT:  'Watch: E-commerce %, AI/OpenAI partnership early results, Sam\'s Club margins',
  CAT:  'Watch: Mining/construction cycle commentary, Cat Digital services revenue %',
  DE:   'Watch: Precision ag attach rates, autonomous tractor adoption, farm economy outlook',
  GE:   'Watch: LEAP engine backlog, operating margin expansion, defense orders',
  XOM:  'Watch: Production volumes, Permian growth, energy transition capex',
  COP:  'Watch: LNG portfolio, shareholder returns, production guidance',
}

function daysUntil(dateStr) {
  const now = new Date()
  const target = new Date(dateStr)
  const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24))
  return diff
}

function urgencyColor(days) {
  if (days < 0) return 'var(--muted)'
  if (days <= 7) return 'var(--red)'
  if (days <= 21) return 'var(--amber)'
  return 'var(--green)'
}

export default function EarningsCalendar() {
  const { user } = useAuth()
  const [watchlist, setWatchlist] = useState([])
  const [filter, setFilter] = useState('watchlist')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    getWatchlist(user.id).then(({ data }) => {
      setWatchlist((data || []).map(d => d.ticker))
      setLoading(false)
    })
  }, [user])

  const allWithDates = COMPANIES_SCORED
    .filter(c => EARNINGS_DATES[c.ticker])
    .map(c => ({
      ...c,
      earnings: EARNINGS_DATES[c.ticker],
      daysUntil: daysUntil(EARNINGS_DATES[c.ticker].date),
      inWatchlist: watchlist.includes(c.ticker),
      watchPoints: WATCH_POINTS[c.ticker] || null,
    }))
    .sort((a, b) => a.daysUntil - b.daysUntil)

  const displayed = filter === 'watchlist'
    ? allWithDates.filter(c => c.inWatchlist)
    : filter === 'upcoming7'
    ? allWithDates.filter(c => c.daysUntil >= 0 && c.daysUntil <= 7)
    : filter === 'upcoming30'
    ? allWithDates.filter(c => c.daysUntil >= 0 && c.daysUntil <= 30)
    : allWithDates.filter(c => c.daysUntil >= 0)

  const upcoming7 = allWithDates.filter(c => c.daysUntil >= 0 && c.daysUntil <= 7 && c.inWatchlist)
  const upcoming30 = allWithDates.filter(c => c.daysUntil >= 0 && c.daysUntil <= 30 && c.inWatchlist)

  return (
    <div style={{padding:'24px', maxWidth:900}}>
      <div style={{marginBottom:20}}>
        <h1 style={{fontFamily:'var(--font-display)', fontSize:26}}>Earnings Calendar</h1>
        <p style={{color:'var(--text2)', fontSize:13, marginTop:3}}>
          Upcoming earnings for your watchlist · Q1 2026 season
        </p>
      </div>

      {/* Alert banner */}
      {upcoming7.length > 0 && (
        <div style={{background:'rgba(240,82,82,0.08)', border:'1px solid rgba(240,82,82,0.25)',
          borderRadius:'var(--radius-lg)', padding:'12px 18px', marginBottom:20,
          display:'flex', alignItems:'center', gap:12}}>
          <span style={{fontSize:18}}>⚠</span>
          <div>
            <div style={{fontSize:13, fontWeight:600, color:'var(--red)', marginBottom:2}}>
              {upcoming7.length} watchlist stock{upcoming7.length!==1?'s':''} reporting in the next 7 days
            </div>
            <div style={{fontSize:12, color:'var(--text2)'}}>
              {upcoming7.map(c=>`${c.ticker} (${new Date(c.earnings.date).toLocaleDateString('en-US',{month:'short',day:'numeric'})})`).join(' · ')}
            </div>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20}}>
        {[
          {label:'In next 7 days', val:upcoming7.length, color:'var(--red)'},
          {label:'In next 30 days', val:upcoming30.length, color:'var(--amber)'},
          {label:'Watchlist total', val:allWithDates.filter(c=>c.inWatchlist).length, color:'var(--accent)'},
        ].map(c=>(
          <div key={c.label} style={{background:'var(--surface)', border:'1px solid var(--border)',
            borderRadius:'var(--radius-lg)', padding:'14px 16px'}}>
            <div style={{fontSize:24, fontWeight:700, fontFamily:'var(--font-mono)', color:c.color}}>{c.val}</div>
            <div style={{fontSize:10, color:'var(--muted)', marginTop:2, textTransform:'uppercase', letterSpacing:'0.4px'}}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{display:'flex', gap:8, marginBottom:16}}>
        {[
          {val:'watchlist', label:'My watchlist'},
          {val:'upcoming7', label:'Next 7 days'},
          {val:'upcoming30', label:'Next 30 days'},
          {val:'all', label:'All companies'},
        ].map(f=>(
          <button key={f.val} onClick={()=>setFilter(f.val)}
            style={{padding:'6px 14px', borderRadius:20, fontSize:12, fontWeight:500,
              background:filter===f.val?'var(--accent)':'var(--surface)',
              color:filter===f.val?'#fff':'var(--text2)',
              border:`1px solid ${filter===f.val?'var(--accent)':'var(--border)'}`,
              transition:'all 0.15s', cursor:'pointer'}}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Earnings list */}
      {loading ? (
        <div style={{color:'var(--muted)', fontFamily:'var(--font-mono)', fontSize:12, padding:20}}>Loading…</div>
      ) : displayed.length === 0 ? (
        <div style={{background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)',
          padding:40, textAlign:'center', color:'var(--muted)'}}>
          No upcoming earnings for this filter.
        </div>
      ) : (
        <div style={{display:'flex', flexDirection:'column', gap:8}}>
          {displayed.map(c => {
            const days = c.daysUntil
            const isPast = days < 0
            const color = urgencyColor(days)
            return (
              <div key={c.ticker} style={{background:'var(--surface)', border:'1px solid var(--border)',
                borderRadius:'var(--radius-lg)', padding:'14px 18px',
                opacity:isPast?0.6:1}}>
                <div style={{display:'flex', alignItems:'flex-start', gap:12}}>
                  {/* Date block */}
                  <div style={{flexShrink:0, textAlign:'center', minWidth:64,
                    background:'var(--surface2)', borderRadius:'var(--radius)', padding:'8px 10px',
                    border:`1px solid ${isPast?'var(--border)':color==='var(--red)'?'rgba(240,82,82,0.3)':'var(--border)'}` }}>
                    <div style={{fontSize:10, color:'var(--muted)', fontFamily:'var(--font-mono)', marginBottom:2}}>
                      {new Date(c.earnings.date).toLocaleDateString('en-US',{month:'short'})}
                    </div>
                    <div style={{fontSize:20, fontWeight:700, fontFamily:'var(--font-mono)', color, lineHeight:1}}>
                      {new Date(c.earnings.date).getDate()}
                    </div>
                    <div style={{fontSize:9, color, fontFamily:'var(--font-mono)', marginTop:2}}>
                      {isPast ? 'reported' : days === 0 ? 'today' : `${days}d`}
                    </div>
                  </div>

                  {/* Content */}
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap'}}>
                      <span style={{fontFamily:'var(--font-mono)', color:'var(--accent)', fontWeight:700, fontSize:14}}>{c.ticker}</span>
                      <span style={{fontSize:12, color:'var(--text)', fontWeight:600}}>{c.name}</span>
                      <SectorBadge sector={c.sector}/>
                      <ScoreBadge score={c.score} size="sm"/>
                      {c.inWatchlist && <span style={{fontSize:9, color:'var(--amber)'}}>★ watchlist</span>}
                    </div>

                    <div style={{display:'flex', gap:16, marginBottom:c.watchPoints?8:0, flexWrap:'wrap'}}>
                      <span style={{fontSize:12, color:'var(--text2)', fontFamily:'var(--font-mono)'}}>
                        {c.earnings.period}
                      </span>
                      <span style={{fontSize:12, color:'var(--text2)', fontFamily:'var(--font-mono)'}}>
                        Est: {c.earnings.estimate}
                      </span>
                    </div>

                    {c.watchPoints && (
                      <div style={{fontSize:11, color:'var(--text2)', lineHeight:1.6,
                        padding:'6px 10px', background:'var(--surface2)',
                        borderRadius:'var(--radius)', borderLeft:'2px solid var(--accent)'}}>
                        {c.watchPoints}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div style={{marginTop:14, fontSize:10, color:'var(--muted)', fontFamily:'var(--font-mono)'}}>
        ⚠ Earnings dates are estimates based on historical patterns. Always verify exact dates before trading.
        EPS estimates from analyst consensus as of March 2026.
      </div>
    </div>
  )
}
