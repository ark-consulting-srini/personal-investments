import { useState, useEffect, useCallback } from 'react'
import { COMPANIES_SCORED, TECH_COMPANIES, TECH_SECTOR_COLORS, groupByIndustry, groupBySector, scoreMetric } from '../lib/data'
import { useAuth } from '../hooks/useAuth.jsx'
import { useMarketData } from '../hooks/useMarketData'
import { addToWatchlist, removeFromWatchlist, getWatchlist } from '../lib/supabase'
import { ScoreBadge, SectorBadge, MetricCell } from '../components/Badges'
import { getDisplacement, getTierConfig } from '../lib/aiDisplacement'

const PROXY = 'https://api.allorigins.win/get?url='

// ─── Displacement risk mini-badge ─────────────────────────────────────────────
function DisplacementBadge({ ticker }) {
  const d = getDisplacement(ticker)
  if (!d) return null
  const t = getTierConfig(d.tier)
  const labels = { CRITICAL:'CRIT', HIGH:'HIGH', MEDIUM:'MED', LOW:'LOW', RESILIENT:'RES' }
  return (
    <span title={`AI Displacement: ${d.tier} (${d.composite}/5.0) — ${d.verdict.slice(0,100)}`}
      style={{ fontSize:8, fontWeight:700, padding:'1px 5px', borderRadius:3,
        background: t.bg, color: t.color, border: `1px solid ${t.border}`,
        fontFamily:'var(--font-mono)', letterSpacing:'0.3px', whiteSpace:'nowrap', cursor:'help' }}>
      {labels[d.tier]}
    </span>
  )
}
const PERIODS = ['1D','5D','1M','3M','YTD','1Y']

const EARNINGS = {
  JPM:{ date:'2026-04-11', estimate:'$4.65 EPS', period:'Q1 2026', watch:'Net interest margin, AI-driven efficiency ratio, loan loss provisions' },
  BAC:{ date:'2026-04-14', estimate:'$0.82 EPS', period:'Q1 2026', watch:'NII trajectory, Erica adoption, credit quality' },
  WFC:{ date:'2026-04-11', estimate:'$1.24 EPS', period:'Q1 2026', watch:'Fee income, efficiency ratio, credit losses' },
  GS: { date:'2026-04-14', estimate:'$9.12 EPS', period:'Q1 2026', watch:'IB recovery, Marcus wind-down, AI infra commentary' },
  MS: { date:'2026-04-16', estimate:'$2.28 EPS', period:'Q1 2026', watch:'Wealth management flows, E*Trade integration' },
  PGR:{ date:'2026-04-15', estimate:'$4.82 EPS', period:'Q1 2026', watch:'Combined ratio, telematics adoption, growth rate' },
  CB: { date:'2026-04-23', estimate:'$5.44 EPS', period:'Q1 2026', watch:'Catastrophe losses, pricing momentum' },
  AXP:{ date:'2026-04-17', estimate:'$3.78 EPS', period:'Q1 2026', watch:'Billed business growth, credit quality, premium card NPS' },
  UNH:{ date:'2026-04-15', estimate:'$7.22 EPS', period:'Q1 2026', watch:'Medical loss ratio, Medicare Advantage membership' },
  JNJ:{ date:'2026-04-15', estimate:'$2.58 EPS', period:'Q1 2026', watch:'MedTech growth, pipeline updates, litigation' },
  LLY:{ date:'2026-04-30', estimate:'$3.52 EPS', period:'Q1 2026', watch:'GLP-1 demand, Mounjaro/Zepbound supply, pipeline' },
  ABT:{ date:'2026-04-16', estimate:'$1.09 EPS', period:'Q1 2026', watch:'FreeStyle Libre growth, structural heart' },
  TMO:{ date:'2026-04-23', estimate:'$5.68 EPS', period:'Q1 2026', watch:'Life sciences tools demand, biopharma recovery' },
  HCA:{ date:'2026-04-25', estimate:'$6.48 EPS', period:'Q1 2026', watch:'Volume trends, AI documentation adoption' },
  WMT:{ date:'2026-05-14', estimate:'$0.57 EPS', period:'Q1 FY2027', watch:'E-commerce %, AI/OpenAI partnership results' },
  COST:{ date:'2026-06-04', estimate:'$4.02 EPS', period:'Q3 FY2026', watch:'Membership renewal rate, traffic trends' },
  PG: { date:'2026-04-23', estimate:'$1.44 EPS', period:'Q3 FY2026', watch:'Volume recovery, pricing power, AI in supply chain' },
  KO: { date:'2026-04-29', estimate:'$0.73 EPS', period:'Q1 2026', watch:'Volume vs price mix, EM currency, AI personalization' },
  PEP:{ date:'2026-04-24', estimate:'$1.48 EPS', period:'Q1 2026', watch:'Frito-Lay recovery, nutrition pivot, AI demand sensing' },
  MCD:{ date:'2026-04-29', estimate:'$2.88 EPS', period:'Q1 2026', watch:'Comp store sales, AI ordering, value strategy traction' },
  MAR:{ date:'2026-04-30', estimate:'$2.14 EPS', period:'Q1 2026', watch:'RevPAR growth, loyalty programme, AI pricing' },
  CAT:{ date:'2026-04-28', estimate:'$4.22 EPS', period:'Q1 2026', watch:'Mining/construction cycle, Cat Digital services revenue' },
  DE: { date:'2026-05-15', estimate:'$5.68 EPS', period:'Q2 FY2026', watch:'Precision ag attach rates, autonomous adoption' },
  HON:{ date:'2026-04-24', estimate:'$2.28 EPS', period:'Q1 2026', watch:'Aerospace backlog, AI building management' },
  UNP:{ date:'2026-04-24', estimate:'$2.82 EPS', period:'Q1 2026', watch:'Volume recovery, OR improvement, AI scheduling' },
  LMT:{ date:'2026-04-21', estimate:'$7.12 EPS', period:'Q1 2026', watch:'F-35 deliveries, hypersonics, AI defence commentary' },
  GE: { date:'2026-04-22', estimate:'$1.08 EPS', period:'Q1 2026', watch:'LEAP engine backlog, margin expansion, defence orders' },
  XOM:{ date:'2026-05-02', estimate:'$1.72 EPS', period:'Q1 2026', watch:'Production volumes, Permian growth, energy transition capex' },
  CVX:{ date:'2026-05-02', estimate:'$2.44 EPS', period:'Q1 2026', watch:'Hess acquisition integration, buyback pace' },
  COP:{ date:'2026-05-01', estimate:'$1.88 EPS', period:'Q1 2026', watch:'LNG portfolio, shareholder returns, production guidance' },
  EOG:{ date:'2026-05-01', estimate:'$2.82 EPS', period:'Q1 2026', watch:'Permian efficiency, Dorado gas timing, buybacks' },
}

const METRICS = [
  { key:'roic',    label:'ROIC-WACC', suffix:'%'  },
  { key:'fcf',     label:'FCF Yield', suffix:'%'  },
  { key:'evebitda',label:'EV/EBITDA', suffix:'×'  },
  { key:'oplev',   label:'Op.Lev',    suffix:'pp' },
  { key:'revpemp', label:'Rev/Emp Δ', suffix:'%'  },
  { key:'debt',    label:'Debt/EBITDA',suffix:'×' },
  { key:'peg',     label:'PEG',       suffix:''   },
]

function daysUntil(dateStr) {
  const now = new Date(); now.setHours(0,0,0,0)
  const d = new Date(dateStr); d.setHours(0,0,0,0)
  return Math.round((d - now) / 86400000)
}

function Sparkline({ data, color }) {
  if (!data.length) return <div style={{height:180,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--muted)',fontSize:12}}>No chart data</div>
  const vals = data.map(d => d.price)
  const min = Math.min(...vals), max = Math.max(...vals), range = max - min || 1
  const w = 600, h = 160
  const pts = data.map((d,i) => `${(i/(data.length-1))*w},${h-((d.price-min)/range)*h}`).join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{width:'100%',height:180,overflow:'visible'}}>
      <defs><linearGradient id="cFill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity="0.15"/>
        <stop offset="100%" stopColor={color} stopOpacity="0"/>
      </linearGradient></defs>
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill="url(#cFill)"/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  )
}

function PricePanel({ company, prices, fetchPrices, onClose }) {
  const [period, setPeriod] = useState('1M')
  const [chartData, setChartData] = useState([])
  const [chartLoading, setChartLoading] = useState(false)

  const fetchChart = async (ticker, p) => {
    setChartLoading(true)
    try {
      const rangeMap={'1D':'1d','5D':'5d','1M':'1mo','3M':'3mo','YTD':'ytd','1Y':'1y'}
      const intMap={'1D':'5m','5D':'15m','1M':'1d','3M':'1d','YTD':'1d','1Y':'1wk'}
      const url=`${PROXY}${encodeURIComponent(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=${intMap[p]}&range=${rangeMap[p]}`)}`
      const res=await fetch(url); const outer=await res.json(); const data=JSON.parse(outer.contents)
      const result=data?.chart?.result?.[0]; if(!result) return
      const times=result.timestamp||[], closes=result.indicators?.quote?.[0]?.close||[]
      setChartData(times.map((t,i)=>({time:new Date(t*1000),price:closes[i]})).filter(d=>d.price!=null))
    } catch{setChartData([])} finally{setChartLoading(false)}
  }

  useEffect(()=>{ if(company){fetchPrices([company.ticker]);fetchChart(company.ticker,period)} },[company])
  useEffect(()=>{ if(company) fetchChart(company.ticker,period) },[period])

  if (!company) return null
  const pr=prices[company.ticker]; const up=pr?pr.changePct>=0:true; const color=up?'var(--green)':'var(--red)'

  return (
    <div style={{width:360,flexShrink:0,background:'var(--surface)',borderLeft:'1px solid var(--border)',display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <div style={{padding:'12px 14px',borderBottom:'1px solid var(--border)',background:'var(--surface2)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:2}}>
              <span style={{fontFamily:'var(--font-mono)',color:'var(--accent)',fontWeight:700,fontSize:14}}>{company.ticker}</span>
              <SectorBadge sector={company.sector}/>
              {company.aiSignal && <span style={{fontSize:8,color:'#a78bfa',fontWeight:600,padding:'1px 5px',background:'rgba(167,139,250,0.12)',borderRadius:3}}>AI</span>}
            </div>
            <div style={{fontSize:13,fontWeight:600}}>{company.name}</div>
          </div>
          <button onClick={onClose} style={{background:'none',color:'var(--muted)',fontSize:20,lineHeight:1}}>×</button>
        </div>
        {pr ? (
          <div>
            <div style={{fontFamily:'var(--font-mono)',fontSize:26,fontWeight:700,color:'var(--text)',lineHeight:1}}>${pr.price.toFixed(2)}</div>
            <div style={{fontFamily:'var(--font-mono)',fontSize:12,color,marginTop:3}}>{up?'▲':'▼'} {Math.abs(pr.change).toFixed(2)} ({Math.abs(pr.changePct).toFixed(2)}%) today</div>
          </div>
        ) : (
          <button onClick={()=>fetchPrices([company.ticker])} style={{marginTop:6,padding:'4px 10px',background:'var(--accent-dim)',border:'1px solid var(--accent-border)',color:'var(--accent)',borderRadius:'var(--radius)',fontSize:11,cursor:'pointer'}}>Load price</button>
        )}
      </div>

      <div style={{display:'flex',padding:'8px 14px 4px',gap:3,borderBottom:'1px solid var(--border)'}}>
        {PERIODS.map(p=>(
          <button key={p} onClick={()=>setPeriod(p)}
            style={{padding:'3px 9px',borderRadius:4,fontSize:10,fontWeight:600,background:period===p?'var(--accent)':'transparent',color:period===p?'#fff':'var(--text2)',border:period===p?'none':'1px solid var(--border2)',cursor:'pointer'}}>
            {p}
          </button>
        ))}
      </div>

      <div style={{padding:'10px 14px',borderBottom:'1px solid var(--border)'}}>
        {chartLoading ? <div style={{height:180,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--muted)',fontSize:11,fontFamily:'var(--font-mono)'}}>Loading…</div>
          : <Sparkline data={chartData} color={pr?color:'var(--accent)'}/>}
      </div>

      <div style={{padding:'11px 14px',flex:1,overflowY:'auto'}}>
        <div style={{fontSize:9,color:'var(--muted)',fontFamily:'var(--font-mono)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:8}}>7 Metrics</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:5,marginBottom:10}}>
          {METRICS.map(m=>{
            const s=scoreMetric(company[m.key],m.key)
            const mc=s>=4?'var(--green)':s===3?'var(--amber)':'var(--red)'
            const sign=['oplev','revpemp'].includes(m.key)&&company[m.key]>0?'+':''
            return(
              <div key={m.key} style={{background:'var(--bg)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'7px 9px'}}>
                <div style={{fontSize:9,color:'var(--muted)',fontFamily:'var(--font-mono)',marginBottom:2}}>{m.label}</div>
                <div style={{fontSize:15,fontFamily:'var(--font-mono)',fontWeight:700,color:mc}}>{sign}{company[m.key].toFixed(1)}{m.suffix}</div>
              </div>
            )
          })}
          <div style={{background:'var(--bg)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'7px 9px'}}>
            <div style={{fontSize:9,color:'var(--muted)',fontFamily:'var(--font-mono)',marginBottom:2}}>Score</div>
            <ScoreBadge score={company.score}/>
          </div>
        </div>
        {EARNINGS[company.ticker]&&(()=>{
          const e=EARNINGS[company.ticker]; const days=daysUntil(e.date); const isPast=days<0
          return(
            <div style={{padding:'9px 11px',background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:'var(--radius)',marginBottom:8}}>
              <div style={{fontSize:9,color:'var(--muted)',fontFamily:'var(--font-mono)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:5}}>Next Earnings</div>
              <div style={{fontSize:12,fontFamily:'var(--font-mono)',fontWeight:600,color:isPast?'var(--muted)':days<=7?'var(--amber)':'var(--text)',marginBottom:2}}>
                {new Date(e.date).toLocaleDateString('en-US',{month:'short',day:'numeric'})} · {isPast?'reported':`${days}d`}
              </div>
              <div style={{fontSize:11,color:'var(--text2)',marginBottom:e.watch?5:0}}>{e.period} · {e.estimate}</div>
              {e.watch&&<div style={{fontSize:10,color:'var(--text2)',lineHeight:1.6,borderLeft:'2px solid var(--accent)',paddingLeft:7}}>{e.watch}</div>}
            </div>
          )
        })()}
        {company.aiSignal&&(
          <div style={{padding:'9px 11px',background:'rgba(167,139,250,0.06)',border:'1px solid rgba(167,139,250,0.2)',borderRadius:'var(--radius)',marginBottom:8}}>
            <div style={{fontSize:9,color:'#a78bfa',fontFamily:'var(--font-mono)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:4}}>AI Signal</div>
            <div style={{fontSize:11,color:'var(--text2)',lineHeight:1.6,marginBottom:3}}>{company.aiSignal}</div>
            {company.moat&&<div style={{fontSize:10,color:'var(--muted)'}}>Moat: {company.moat}</div>}
          </div>
        )}
        {(() => {
          const d = getDisplacement(company.ticker)
          if (!d) return null
          const t = getTierConfig(d.tier)
          return (
            <div style={{padding:'9px 11px',background:t.bg,border:`1px solid ${t.border}`,borderRadius:'var(--radius)'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
                <div style={{fontSize:9,color:t.color,fontFamily:'var(--font-mono)',textTransform:'uppercase',letterSpacing:'0.5px',fontWeight:700}}>AI Displacement Risk</div>
                <span style={{fontSize:11,fontFamily:'var(--font-mono)',color:t.color,fontWeight:700}}>{d.composite}/5.0 · {t.label}</span>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:3,marginBottom:6}}>
                {[
                  ['Intermediation', d.dims.intermediation],
                  ['ARR/Seat', d.dims.arrSeat],
                  ['Customer base', d.dims.customerBase],
                  ['Infrastructure', d.dims.infrastructure],
                  ['Policy risk', d.dims.policySystemic],
                ].map(([label, score]) => (
                  <div key={label} style={{fontSize:9,color:'var(--text2)',display:'flex',justifyContent:'space-between',fontFamily:'var(--font-mono)'}}>
                    <span>{label}</span>
                    <span style={{color: score >= 4 ? 'var(--red)' : score >= 3 ? 'var(--amber)' : 'var(--green)', fontWeight:600}}>{score}/5</span>
                  </div>
                ))}
              </div>
              <div style={{fontSize:10,color:'var(--text2)',lineHeight:1.6,borderLeft:`2px solid ${t.color}`,paddingLeft:6}}>{d.verdict.slice(0,200)}{d.verdict.length > 200 ? '…' : ''}</div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}

function CompaniesTab({ watchlist, toggleWatchlist, onSelect, selected, prices }) {
  const [search, setSearch] = useState('')
  const [scoreFilter, setScoreFilter] = useState('')
  const [viewMode, setViewMode] = useState('By Industry')
  const [universe, setUniverse] = useState('s&p')
  const [collapsed, setCollapsed] = useState(new Set())
  const [sortField, setSortField] = useState('score')
  const [sortDir, setSortDir] = useState('desc')

  const ALL = universe==='s&p' ? COMPANIES_SCORED
    : universe==='ai' ? TECH_COMPANIES
    : [...COMPANIES_SCORED, ...TECH_COMPANIES]

  const filtered = ALL.filter(c => {
    if(search && !c.name.toLowerCase().includes(search.toLowerCase()) &&
       !c.ticker.toLowerCase().includes(search.toLowerCase()) &&
       !c.industry.toLowerCase().includes(search.toLowerCase())) return false
    if(scoreFilter && c.score !== parseInt(scoreFilter)) return false
    return true
  }).sort((a,b)=>{
    const av=a[sortField],bv=b[sortField]
    if(typeof av==='string') return sortDir==='asc'?av.localeCompare(bv):bv.localeCompare(av)
    return sortDir==='asc'?av-bv:bv-av
  })

  const groups = viewMode==='By Industry'?groupByIndustry(filtered):viewMode==='By Sector'?groupBySector(filtered):{'All Companies':filtered}
  const handleSort = f => { if(sortField===f) setSortDir(d=>d==='asc'?'desc':'asc'); else{setSortField(f);setSortDir(['evebitda','debt','peg'].includes(f)?'asc':'desc')} }

  const CompanyRow = ({c}) => {
    const pr=prices[c.ticker]; const inWatch=watchlist.has(c.ticker); const isSel=selected?.ticker===c.ticker
    return (
      <>
        <tr onClick={()=>onSelect(c)}
          style={{borderBottom:'1px solid var(--border)',cursor:'pointer',
            background:isSel?'rgba(91,138,240,0.06)':'transparent'}}
          onMouseEnter={e=>{if(!isSel)e.currentTarget.style.background='rgba(255,255,255,0.02)'}}
          onMouseLeave={e=>{if(!isSel)e.currentTarget.style.background='transparent'}}>
          <td style={{padding:'8px 10px',fontFamily:'var(--font-mono)',color:'var(--accent)',fontWeight:700,fontSize:12,whiteSpace:'nowrap'}}>
            {c.ticker}{c.aiSignal&&<span style={{fontSize:7,color:'#a78bfa',marginLeft:3,verticalAlign:'middle'}}>AI</span>}
            <div style={{marginTop:2}}><DisplacementBadge ticker={c.ticker}/></div>
          </td>
          <td style={{padding:'8px 10px',fontSize:12,fontWeight:600,maxWidth:140,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.name}</td>
          {METRICS.map(m=>(<td key={m.key} style={{padding:'8px 8px',textAlign:'right'}}><MetricCell value={c[m.key]} metric={m.key} suffix={m.suffix}/></td>))}
          <td style={{padding:'8px 8px'}}><ScoreBadge score={c.score} size="sm"/></td>
          <td style={{padding:'8px 8px',fontFamily:'var(--font-mono)',fontSize:11,textAlign:'right'}}>
            {pr?(<div><div style={{fontWeight:600,fontSize:12}}>${pr.price.toFixed(2)}</div><div style={{color:pr.changePct>=0?'var(--green)':'var(--red)',fontSize:10}}>{pr.changePct>=0?'▲':'▼'}{Math.abs(pr.changePct).toFixed(2)}%</div></div>):<span style={{color:'var(--muted)',fontSize:10}}>—</span>}
          </td>
          <td style={{padding:'8px 6px',textAlign:'center'}}>
            <button onClick={e=>toggleWatchlist(c,e)} style={{background:'none',fontSize:14,color:inWatch?'var(--amber)':'var(--border2)',cursor:'pointer'}}>{inWatch?'★':'☆'}</button>
          </td>
        </tr>
        {isSel&&<tr style={{background:'rgba(91,138,240,0.04)',borderBottom:'1px solid var(--accent-border)'}}><td colSpan={12} style={{padding:'2px 10px 5px',fontSize:9,color:'var(--accent)',fontFamily:'var(--font-mono)'}}>▶ price chart open in side panel</td></tr>}
      </>
    )
  }

  const buying=COMPANIES_SCORED.filter(c=>c.score>=4).length; const avoiding=COMPANIES_SCORED.filter(c=>c.score<=2).length

  return(
    <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
      <div style={{padding:'12px 20px 10px',borderBottom:'1px solid var(--border)',flexShrink:0}}>
        <div style={{display:'flex',gap:8,marginBottom:8,alignItems:'center',flexWrap:'wrap'}}>
          <div style={{display:'flex',gap:2,background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:2}}>
            {[{id:'s&p',label:'S&P 100'},{id:'ai',label:'AI picks'},{id:'all',label:'All 110'}].map(u=>(
              <button key={u.id} onClick={()=>setUniverse(u.id)} style={{padding:'4px 11px',borderRadius:4,fontSize:11,fontWeight:600,background:universe===u.id?'var(--accent)':'transparent',color:universe===u.id?'#fff':'var(--text2)',border:'none',cursor:'pointer'}}>{u.label}</button>
            ))}
          </div>
          <div style={{display:'flex',gap:10,marginLeft:'auto'}}>
            {[{label:'Companies',val:filtered.length,color:'var(--accent)'},{label:'Quality (4-5)',val:buying,color:'var(--green)'},{label:'Caution (1-2)',val:avoiding,color:'var(--red)'}].map(s=>(
              <div key={s.label} style={{fontSize:10,color:'var(--muted)',display:'flex',alignItems:'center',gap:4}}>
                <span style={{fontSize:13,fontWeight:700,fontFamily:'var(--font-mono)',color:s.color}}>{s.val}</span><span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
          <input placeholder="Search ticker, name, industry…" value={search} onChange={e=>setSearch(e.target.value)}
            style={{flex:1,minWidth:160,maxWidth:250,background:'var(--surface)',border:'1px solid var(--border2)',color:'var(--text)',padding:'6px 11px',borderRadius:'var(--radius)',fontSize:12,outline:'none'}}/>
          <select value={scoreFilter} onChange={e=>setScoreFilter(e.target.value)}
            style={{background:'var(--surface)',border:'1px solid var(--border2)',color:'var(--text)',padding:'6px 10px',borderRadius:'var(--radius)',fontSize:12}}>
            <option value="">All scores</option>
            {[5,4,3,2,1].map(s=><option key={s} value={s}>Score {s}</option>)}
          </select>
          <div style={{display:'flex',gap:2,background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:2}}>
            {['By Industry','By Sector','Flat List'].map(m=>(
              <button key={m} onClick={()=>setViewMode(m)} style={{padding:'4px 9px',borderRadius:4,fontSize:11,fontWeight:500,background:viewMode===m?'var(--accent)':'transparent',color:viewMode===m?'#fff':'var(--text2)',border:'none',cursor:'pointer'}}>{m}</button>
            ))}
          </div>
        </div>
      </div>
      <div style={{flex:1,overflowY:'auto',padding:'0 20px 14px'}}>
        <div style={{display:'flex',flexDirection:'column',gap:8,paddingTop:10}}>
          {Object.entries(groups).map(([groupName,companies])=>{
            const isC=collapsed.has(groupName)
            const avg=Math.round(companies.reduce((s,c)=>s+c.score,0)/companies.length)
            const hasE=companies.some(c=>EARNINGS[c.ticker]&&daysUntil(EARNINGS[c.ticker].date)>=0&&daysUntil(EARNINGS[c.ticker].date)<=14)
            return(
              <div key={groupName} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',overflow:'hidden'}}>
                <div onClick={()=>setCollapsed(p=>{const n=new Set(p);n.has(groupName)?n.delete(groupName):n.add(groupName);return n})}
                  style={{padding:'8px 14px',display:'flex',alignItems:'center',gap:8,cursor:'pointer',background:'var(--surface2)',borderBottom:isC?'none':'1px solid var(--border)'}}>
                  <span style={{fontWeight:600,fontSize:12}}>{groupName}</span>
                  <span style={{fontSize:10,color:'var(--muted)',fontFamily:'var(--font-mono)'}}>{companies.length} co.</span>
                  <span style={{fontSize:9,padding:'1px 6px',borderRadius:3,fontFamily:'var(--font-mono)',background:avg>=4?'rgba(32,200,120,0.1)':avg===3?'rgba(244,167,36,0.1)':'rgba(240,82,82,0.1)',color:avg>=4?'var(--green)':avg===3?'var(--amber)':'var(--red)'}}>avg {avg}/5</span>
                  {hasE&&<span style={{fontSize:9,color:'var(--amber)',fontFamily:'var(--font-mono)'}}>◷ earnings soon</span>}
                  <span style={{marginLeft:'auto',color:'var(--muted)',fontSize:11}}>{isC?'▶':'▼'}</span>
                </div>
                {!isC&&(
                  <div style={{overflowX:'auto'}}>
                    <table style={{width:'100%',borderCollapse:'collapse'}}>
                      <thead>
                        <tr style={{background:'var(--surface2)',borderBottom:'1px solid var(--border2)'}}>
                          {[{f:'ticker',label:'Ticker',w:70},{f:'name',label:'Company',w:130},
                            ...METRICS.map(m=>({f:m.key,label:m.label,w:78})),
                            {f:'score',label:'Score',w:60},{f:'price',label:'Price',w:70},{f:'',label:'',w:30}
                          ].map(col=>(
                            <th key={col.f||col.label} onClick={()=>col.f&&col.f!=='price'&&handleSort(col.f)}
                              style={{padding:'7px 8px',textAlign:METRICS.find(m=>m.key===col.f)?'right':'left',fontSize:9,fontFamily:'var(--font-mono)',color:sortField===col.f?'var(--accent)':'var(--muted)',textTransform:'uppercase',letterSpacing:'0.5px',whiteSpace:'nowrap',cursor:col.f&&col.f!=='price'?'pointer':'default',userSelect:'none',minWidth:col.w}}>
                              {col.label}{sortField===col.f&&<span style={{marginLeft:2}}>{sortDir==='asc'?'↑':'↓'}</span>}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>{companies.map(c=><CompanyRow key={c.ticker} c={c}/>)}</tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <div style={{marginTop:10,fontSize:9,color:'var(--muted)',fontFamily:'var(--font-mono)'}}>⚠ FY2025/TTM public filing data. Personal research only — not financial advice.</div>
      </div>
    </div>
  )
}

function EarningsTab({ watchlistSet }) {
  const [view, setView] = useState('upcoming')
  const rows = COMPANIES_SCORED.filter(c=>EARNINGS[c.ticker])
    .map(c=>({...c,earnings:EARNINGS[c.ticker],days:daysUntil(EARNINGS[c.ticker].date),inWL:watchlistSet.has(c.ticker)}))
    .sort((a,b)=>a.days-b.days)
  const displayed = view==='watchlist'?rows.filter(c=>c.inWL):rows.filter(c=>c.days>=-7&&c.days<=30)

  return(
    <div style={{padding:'16px 24px'}}>
      <div style={{display:'flex',gap:7,marginBottom:14,alignItems:'center'}}>
        {[{id:'upcoming',label:'Next 30 days'},{id:'watchlist',label:'My watchlist only'}].map(v=>(
          <button key={v.id} onClick={()=>setView(v.id)} style={{padding:'5px 12px',borderRadius:'var(--radius)',fontSize:11,fontWeight:600,background:view===v.id?'var(--accent-dim)':'var(--surface)',border:`1px solid ${view===v.id?'var(--accent-border)':'var(--border)'}`,color:view===v.id?'var(--accent)':'var(--text2)',cursor:'pointer'}}>{v.label}</button>
        ))}
        <span style={{fontSize:10,color:'var(--muted)'}}>{displayed.length} companies</span>
      </div>
      {displayed.length===0?(
        <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',padding:40,textAlign:'center',color:'var(--muted)'}}>
          <div style={{fontSize:22,marginBottom:8}}>◷</div>
          <div>{view==='watchlist'?'No watchlist companies have earnings data.':'No upcoming earnings in range.'}</div>
        </div>
      ):(
        <div style={{display:'flex',flexDirection:'column',gap:7}}>
          {displayed.map(c=>{
            const isPast=c.days<0; const color=isPast?'var(--muted)':c.days<=3?'var(--red)':c.days<=7?'var(--amber)':'var(--green)'
            return(
              <div key={c.ticker} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',padding:'11px 14px',display:'flex',gap:12,alignItems:'flex-start',opacity:isPast?.65:1}}>
                <div style={{flexShrink:0,textAlign:'center',minWidth:52,background:'var(--surface2)',borderRadius:'var(--radius)',padding:'6px 8px',border:`1px solid ${color}30`}}>
                  <div style={{fontSize:8,color:'var(--muted)',fontFamily:'var(--font-mono)',marginBottom:1}}>{new Date(c.earnings.date).toLocaleDateString('en-US',{month:'short'})}</div>
                  <div style={{fontSize:17,fontWeight:700,fontFamily:'var(--font-mono)',color,lineHeight:1}}>{new Date(c.earnings.date).getDate()}</div>
                  <div style={{fontSize:8,color,fontFamily:'var(--font-mono)',marginTop:2}}>{isPast?'reported':c.days===0?'today':`${c.days}d`}</div>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:3,flexWrap:'wrap'}}>
                    <span style={{fontFamily:'var(--font-mono)',color:'var(--accent)',fontWeight:700,fontSize:13}}>{c.ticker}</span>
                    <span style={{fontSize:12,fontWeight:600}}>{c.name}</span>
                    <SectorBadge sector={c.sector}/>
                    <ScoreBadge score={c.score} size="sm"/>
                    {c.inWL&&<span style={{fontSize:9,color:'var(--amber)'}}>★ watchlist</span>}
                  </div>
                  <div style={{fontSize:11,color:'var(--text2)',fontFamily:'var(--font-mono)',marginBottom:c.earnings.watch?5:0}}>{c.earnings.period} · Est. {c.earnings.estimate}</div>
                  {c.earnings.watch&&<div style={{fontSize:10,color:'var(--text2)',lineHeight:1.6,borderLeft:'2px solid var(--accent)',paddingLeft:7}}>{c.earnings.watch}</div>}
                </div>
              </div>
            )
          })}
        </div>
      )}
      <div style={{marginTop:12,fontSize:9,color:'var(--muted)',fontFamily:'var(--font-mono)'}}>⚠ Earnings dates are estimates. Verify before acting. EPS from analyst consensus Mar 2026.</div>
    </div>
  )
}

export default function Research() {
  const { user } = useAuth()
  const { prices, fetchPrices } = useMarketData()
  const [watchlist, setWatchlist] = useState(new Set())
  const [activeTab, setActiveTab] = useState('companies')
  const [selected, setSelected] = useState(null)

  useEffect(()=>{
    if(!user) return
    getWatchlist(user.id).then(({data})=>{ if(data) setWatchlist(new Set(data.map(d=>d.ticker))) })
    fetchPrices(COMPANIES_SCORED.slice(0,20).map(c=>c.ticker))
  },[user])

  const toggleWatchlist = useCallback(async(company,e)=>{
    e.stopPropagation(); if(!user) return
    const inList=watchlist.has(company.ticker)
    setWatchlist(prev=>{const n=new Set(prev);inList?n.delete(company.ticker):n.add(company.ticker);return n})
    if(inList) await removeFromWatchlist(user.id,company.ticker)
    else await addToWatchlist(user.id,company.ticker,company.name,company.sector)
  },[user,watchlist])

  return(
    <div style={{display:'flex',height:'100vh',overflow:'hidden',flexDirection:'column'}}>
      <div style={{padding:'13px 24px 0',borderBottom:'1px solid var(--border)',background:'var(--surface)',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'baseline',gap:12,marginBottom:10}}>
          <span style={{fontFamily:'var(--font-display)',fontSize:20}}>Research</span>
          <span style={{fontSize:11,color:'var(--muted)'}}>110 companies · S&P 100 + 10 AI picks · click any row → price chart + metrics</span>
        </div>
        <div style={{display:'flex'}}>
          {[{id:'companies',label:'▦ Companies'},{id:'earnings',label:'◷ Earnings'}].map(tab=>(
            <button key={tab.id} onClick={()=>setActiveTab(tab.id)}
              style={{padding:'9px 14px',background:'none',border:'none',flexShrink:0,borderBottom:activeTab===tab.id?'2px solid var(--accent)':'2px solid transparent',color:activeTab===tab.id?'var(--accent)':'var(--text2)',fontSize:12,fontWeight:600,cursor:'pointer',marginBottom:-1}}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{flex:1,display:'flex',overflow:'hidden'}}>
        <div style={{flex:1,overflow:'hidden',display:'flex',flexDirection:'column'}}>
          {activeTab==='companies'&&<CompaniesTab watchlist={watchlist} toggleWatchlist={toggleWatchlist} onSelect={c=>setSelected(selected?.ticker===c.ticker?null:c)} selected={selected} prices={prices}/>}
          {activeTab==='earnings'&&<EarningsTab watchlistSet={watchlist}/>}
        </div>
        {selected&&activeTab==='companies'&&<PricePanel company={selected} prices={prices} fetchPrices={fetchPrices} onClose={()=>setSelected(null)}/>}
      </div>
    </div>
  )
}
