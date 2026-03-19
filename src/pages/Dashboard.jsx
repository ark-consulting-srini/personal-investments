import { useState, useCallback } from 'react'
import { COMPANIES_SCORED, groupByIndustry, groupBySector, scoreMetric } from '../lib/data'
import { useAuth } from '../hooks/useAuth.jsx'
import { useMarketData } from '../hooks/useMarketData'
import { addToWatchlist, removeFromWatchlist, getWatchlist } from '../lib/supabase'
import { ScoreBadge, MetricCell } from '../components/Badges'
import { useEffect } from 'react'

const METRICS = [
  { key:'roic',    label:'ROIC-WACC', suffix:'%'  },
  { key:'fcf',     label:'FCF Yield', suffix:'%'  },
  { key:'evebitda',label:'EV/EBITDA', suffix:'×'  },
  { key:'oplev',   label:'Op.Lev',    suffix:'pp' },
  { key:'revpemp', label:'Rev/Emp Δ', suffix:'%'  },
  { key:'debt',    label:'Debt/EBITDA',suffix:'×' },
  { key:'peg',     label:'PEG',       suffix:''   },
]

const VIEW_MODES = ['By Industry', 'By Sector', 'Flat List']

const SECTOR_ACCENT = {
  Financials:  '#4f9cf9',
  Healthcare:  '#22c97a',
  Consumer:    '#f5a623',
  Industrials: '#a78bfa',
  Energy:      '#2dd4bf',
}

export default function Dashboard() {
  const { user } = useAuth()
  const { prices, loading: priceLoading, fetchPrices } = useMarketData()
  const [watchlist, setWatchlist] = useState(new Set())
  const [search, setSearch] = useState('')
  const [scoreFilter, setScoreFilter] = useState('')
  const [viewMode, setViewMode] = useState('By Industry')
  const [collapsed, setCollapsed] = useState(new Set())
  const [expanded, setExpanded] = useState(null)
  const [sortField, setSortField] = useState('score')
  const [sortDir, setSortDir] = useState('desc')

  useEffect(() => {
    if (!user) return
    getWatchlist(user.id).then(({ data }) => {
      if (data) setWatchlist(new Set(data.map(d => d.ticker)))
    })
  }, [user])

  const toggleWatchlist = useCallback(async (company, e) => {
    e.stopPropagation()
    if (!user) return
    const inList = watchlist.has(company.ticker)
    setWatchlist(prev => {
      const next = new Set(prev)
      inList ? next.delete(company.ticker) : next.add(company.ticker)
      return next
    })
    if (inList) await removeFromWatchlist(user.id, company.ticker)
    else await addToWatchlist(user.id, company.ticker, company.name, company.sector)
  }, [user, watchlist])

  const toggleCollapse = (key) => {
    setCollapsed(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const filtered = COMPANIES_SCORED
    .filter(c => {
      if (search && !c.name.toLowerCase().includes(search.toLowerCase()) &&
          !c.ticker.toLowerCase().includes(search.toLowerCase()) &&
          !c.industry.toLowerCase().includes(search.toLowerCase())) return false
      if (scoreFilter && c.score !== parseInt(scoreFilter)) return false
      return true
    })
    .sort((a, b) => {
      const av = a[sortField], bv = b[sortField]
      if (typeof av === 'string') return sortDir==='asc' ? av.localeCompare(bv) : bv.localeCompare(av)
      return sortDir==='asc' ? av-bv : bv-av
    })

  const groups = viewMode === 'By Industry' ? groupByIndustry(filtered)
    : viewMode === 'By Sector' ? groupBySector(filtered)
    : { 'All Companies': filtered }

  const buying = COMPANIES_SCORED.filter(c=>c.score>=4).length
  const avoiding = COMPANIES_SCORED.filter(c=>c.score<=2).length

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d==='asc'?'desc':'asc')
    else { setSortField(field); setSortDir(['evebitda','debt','peg'].includes(field)?'asc':'desc') }
  }

  const CompanyRow = ({ c }) => {
    const pr = prices[c.ticker]
    const inWatch = watchlist.has(c.ticker)
    const isExpanded = expanded === c.ticker
    return (
      <>
        <tr onClick={()=>setExpanded(isExpanded?null:c.ticker)}
          style={{borderBottom:'1px solid var(--border)', cursor:'pointer',
            background: isExpanded?'var(--surface2)':'transparent', transition:'background 0.12s'}}
          onMouseEnter={e=>{ if(!isExpanded) e.currentTarget.style.background='rgba(255,255,255,0.02)' }}
          onMouseLeave={e=>{ if(!isExpanded) e.currentTarget.style.background='transparent' }}>
          <td style={{padding:'9px 12px', fontFamily:'var(--font-mono)', color:'var(--accent)', fontWeight:700, fontSize:12, whiteSpace:'nowrap'}}>{c.ticker}</td>
          <td style={{padding:'9px 12px', fontSize:12, fontWeight:600, maxWidth:150, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{c.name}</td>
          {METRICS.map(m => (
            <td key={m.key} style={{padding:'9px 10px', textAlign:'right'}}>
              <MetricCell value={c[m.key]} metric={m.key} suffix={m.suffix}/>
            </td>
          ))}
          <td style={{padding:'9px 10px'}}><ScoreBadge score={c.score} size="sm"/></td>
          <td style={{padding:'9px 10px', fontFamily:'var(--font-mono)', fontSize:11, textAlign:'right'}}>
            {pr ? (
              <div>
                <div style={{fontWeight:600, fontSize:12}}>${pr.price.toFixed(2)}</div>
                <div style={{color:pr.changePct>=0?'var(--green)':'var(--red)', fontSize:10}}>
                  {pr.changePct>=0?'▲':'▼'}{Math.abs(pr.changePct).toFixed(2)}%
                </div>
              </div>
            ) : <span style={{color:'var(--muted)'}}>—</span>}
          </td>
          <td style={{padding:'9px 8px', textAlign:'center'}}>
            <button onClick={e=>toggleWatchlist(c,e)}
              style={{background:'none', fontSize:15, color:inWatch?'var(--amber)':'var(--border2)', transition:'color 0.15s'}}
              title={inWatch?'Remove from watchlist':'Add to watchlist'}>
              {inWatch?'★':'☆'}
            </button>
          </td>
        </tr>
        {isExpanded && (
          <tr style={{background:'var(--surface2)', borderBottom:'2px solid var(--accent)'}}>
            <td colSpan={12} style={{padding:'14px 18px'}}>
              <div style={{display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:8}}>
                {METRICS.map(m => {
                  const s = scoreMetric(c[m.key], m.key)
                  const color = s>=4?'var(--green)':s===3?'var(--amber)':'var(--red)'
                  const sign = ['oplev','revpemp'].includes(m.key)&&c[m.key]>0?'+':''
                  const sigs = {
                    roic: c.roic>6?'Strong value creator':c.roic>2?'Modest creation':'Value destroying',
                    fcf: c.fcf>6?'High cash generation':c.fcf>3?'Decent FCF':'Thin cash flow',
                    evebitda: c.evebitda<10?'Attractively priced':c.evebitda<16?'Fair value':'Premium multiple',
                    oplev: c.oplev>2?'AI in margins':c.oplev>0?'Modest expansion':'Compression',
                    revpemp: c.revpemp>8?'Strong AI lift':c.revpemp>4?'Emerging':'Limited',
                    debt: c.debt<2?'Clean sheet':c.debt<4?'Manageable':'High leverage',
                    peg: c.peg<1?'Undervalued':c.peg<1.5?'Fair value':'Priced in',
                  }
                  return (
                    <div key={m.key} style={{background:'var(--bg)', border:'1px solid var(--border2)',
                      borderRadius:'var(--radius)', padding:'10px 12px'}}>
                      <div style={{fontSize:9, color:'var(--muted)', fontFamily:'var(--font-mono)',
                        textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:3}}>{m.label}</div>
                      <div style={{fontSize:18, fontFamily:'var(--font-mono)', fontWeight:600, color, letterSpacing:'-0.5px'}}>
                        {sign}{c[m.key].toFixed(1)}{m.suffix}
                      </div>
                      <div style={{fontSize:9, color, marginTop:3, fontFamily:'var(--font-mono)'}}>{sigs[m.key]}</div>
                    </div>
                  )
                })}
              </div>
            </td>
          </tr>
        )}
      </>
    )
  }

  const TableHeader = () => (
    <thead>
      <tr style={{background:'var(--surface2)', borderBottom:'1px solid var(--border2)'}}>
        {[
          {f:'ticker',label:'Ticker',w:70},
          {f:'name',label:'Company',w:150},
          ...METRICS.map(m=>({f:m.key,label:m.label,w:88})),
          {f:'score',label:'Score',w:72},
          {f:'price',label:'Price',w:80},
          {f:'',label:'',w:36},
        ].map(col => (
          <th key={col.f||col.label}
            onClick={()=>col.f&&col.f!=='price'&&handleSort(col.f)}
            style={{padding:'8px 10px', textAlign: METRICS.find(m=>m.key===col.f) ? 'right' : 'left',
              fontSize:9, fontFamily:'var(--font-mono)', color: sortField===col.f?'var(--accent)':'var(--muted)',
              textTransform:'uppercase', letterSpacing:'0.5px', whiteSpace:'nowrap',
              cursor:col.f&&col.f!=='price'?'pointer':'default', userSelect:'none', minWidth:col.w}}>
            {col.label}{sortField===col.f&&<span style={{marginLeft:3}}>{sortDir==='asc'?'↑':'↓'}</span>}
          </th>
        ))}
      </tr>
    </thead>
  )

  return (
    <div style={{padding:'24px'}}>
      {/* Header */}
      <div style={{marginBottom:20}}>
        <h1 style={{fontFamily:'var(--font-display)', fontSize:28, letterSpacing:'-0.3px'}}>Investment Dashboard</h1>
        <p style={{color:'var(--text2)', fontSize:13, marginTop:4, fontFamily:'var(--font-mono)'}}>
          100 S&P 500 companies · 7 valuation metrics · FY2025/TTM
        </p>
      </div>

      {/* Summary cards */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20}}>
        {[
          {label:'Companies', val:50, color:'var(--accent)'},
          {label:'Watch / Buy (4–5)', val:buying, color:'var(--green)'},
          {label:'Neutral (3)', val:50-buying-avoiding, color:'var(--amber)'},
          {label:'Caution (1–2)', val:avoiding, color:'var(--red)'},
        ].map(c => (
          <div key={c.label} style={{background:'var(--surface)', border:'1px solid var(--border)',
            borderRadius:'var(--radius-lg)', padding:'14px 18px'}}>
            <div style={{fontSize:24, fontWeight:700, fontFamily:'var(--font-mono)', color:c.color, letterSpacing:'-0.5px'}}>{c.val}</div>
            <div style={{fontSize:10, color:'var(--muted)', marginTop:2, textTransform:'uppercase', letterSpacing:'0.4px'}}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{display:'flex', gap:10, marginBottom:16, flexWrap:'wrap', alignItems:'center'}}>
        <input placeholder="Search ticker, name, or industry…" value={search} onChange={e=>setSearch(e.target.value)}
          style={{flex:1, minWidth:180, maxWidth:280, background:'var(--surface)', border:'1px solid var(--border2)',
            color:'var(--text)', padding:'8px 12px', borderRadius:'var(--radius)', fontSize:13, outline:'none'}}/>

        <select value={scoreFilter} onChange={e=>setScoreFilter(e.target.value)}
          style={{background:'var(--surface)', border:'1px solid var(--border2)', color:'var(--text)',
            padding:'8px 10px', borderRadius:'var(--radius)', fontSize:13, outline:'none'}}>
          <option value=''>All scores</option>
          {[5,4,3,2,1].map(s=><option key={s} value={s}>Score {s}</option>)}
        </select>

        {/* View mode */}
        <div style={{display:'flex', gap:2, background:'var(--surface2)', border:'1px solid var(--border)',
          borderRadius:'var(--radius)', padding:3}}>
          {VIEW_MODES.map(m => (
            <button key={m} onClick={()=>setViewMode(m)}
              style={{padding:'5px 12px', borderRadius:5, fontSize:12, fontWeight:500,
                background:viewMode===m?'var(--accent)':'transparent',
                color:viewMode===m?'#fff':'var(--text2)', border:'none', transition:'all 0.15s'}}>
              {m}
            </button>
          ))}
        </div>

        <button onClick={()=>fetchPrices(filtered.slice(0,10).map(c=>c.ticker))} disabled={priceLoading}
          style={{padding:'8px 14px', background:'var(--accent-dim)', border:'1px solid var(--accent-border)',
            color:'var(--accent)', borderRadius:'var(--radius)', fontSize:12, fontWeight:600,
            opacity:priceLoading?0.6:1}}>
          {priceLoading?'Loading…':'↻ Live Prices (top 10)'}
        </button>

        <span style={{marginLeft:'auto', fontSize:11, color:'var(--muted)', fontFamily:'var(--font-mono)'}}>
          {filtered.length} of 50
        </span>
      </div>

      {/* Grouped tables */}
      <div style={{display:'flex', flexDirection:'column', gap:12}}>
        {Object.entries(groups).map(([groupName, companies]) => {
          const sector = companies[0]?.sector
          const accent = SECTOR_ACCENT[sector] || 'var(--accent)'
          const isCollapsed = collapsed.has(groupName)
          const avgScore = Math.round(companies.reduce((s,c)=>s+c.score,0)/companies.length)
          return (
            <div key={groupName} style={{background:'var(--surface)', border:'1px solid var(--border)',
              borderRadius:'var(--radius-lg)', overflow:'hidden'}}>
              {/* Group header */}
              <div onClick={()=>toggleCollapse(groupName)}
                style={{padding:'10px 16px', display:'flex', alignItems:'center', gap:10,
                  cursor:'pointer', borderBottom: isCollapsed?'none':'1px solid var(--border)',
                  background:'var(--surface2)', transition:'background 0.12s'}}
                onMouseEnter={e=>e.currentTarget.style.background='var(--surface3)'}
                onMouseLeave={e=>e.currentTarget.style.background='var(--surface2)'}>
                <div style={{width:3, height:16, borderRadius:2, background:accent, flexShrink:0}}/>
                <span style={{fontWeight:600, fontSize:13}}>{groupName}</span>
                <span style={{fontSize:11, color:'var(--muted)', fontFamily:'var(--font-mono)'}}>
                  {companies.length} {companies.length===1?'company':'companies'}
                </span>
                <span style={{fontSize:10, color:avgScore>=4?'var(--green)':avgScore===3?'var(--amber)':'var(--red)',
                  fontFamily:'var(--font-mono)', background:avgScore>=4?'rgba(32,200,120,0.1)':avgScore===3?'rgba(244,167,36,0.1)':'rgba(240,82,82,0.1)',
                  padding:'2px 7px', borderRadius:3}}>
                  avg {avgScore}/5
                </span>
                <span style={{marginLeft:'auto', color:'var(--muted)', fontSize:12}}>
                  {isCollapsed ? '▶' : '▼'}
                </span>
              </div>

              {/* Table */}
              {!isCollapsed && (
                <div style={{overflowX:'auto'}}>
                  <table style={{width:'100%', borderCollapse:'collapse'}}>
                    <TableHeader/>
                    <tbody>
                      {companies.map(c => <CompanyRow key={c.ticker} c={c}/>)}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div style={{marginTop:10, fontSize:10, color:'var(--muted)', fontFamily:'var(--font-mono)'}}>
        ⚠ Data: public filings & analyst estimates FY2025/TTM. Personal research only — not financial advice.
      </div>
    </div>
  )
}
