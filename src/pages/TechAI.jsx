import { useState } from 'react'
import { TECH_COMPANIES, TECH_SECTOR_COLORS } from '../lib/data'

const PROXY = 'https://api.allorigins.win/get?url='

async function fetchPrice(ticker) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`
    const res = await fetch(`${PROXY}${encodeURIComponent(url)}`)
    const json = await res.json()
    const data = JSON.parse(json.contents)
    const q = data?.chart?.result?.[0]?.meta
    return { price: q?.regularMarketPrice, change: q?.regularMarketChangePercent }
  } catch { return {} }
}

const AI_SIGNAL_COLORS = {
  'Core infrastructure':                  { bg: 'rgba(167,139,250,0.15)', color: '#a78bfa', border: 'rgba(167,139,250,0.3)' },
  'AI distribution at scale':             { bg: 'rgba(91,138,240,0.12)', color: '#5b8af0', border: 'rgba(91,138,240,0.25)' },
  'AI research + cloud + distribution':   { bg: 'rgba(34,201,122,0.12)', color: '#22c97a', border: 'rgba(34,201,122,0.25)' },
  'Irreplaceable AI supply chain':        { bg: 'rgba(244,167,36,0.12)', color: '#f4a724', border: 'rgba(244,167,36,0.25)' },
  'AI-powered defense of AI infrastructure': { bg: 'rgba(240,82,82,0.1)', color: '#f05252', border: 'rgba(240,82,82,0.2)' },
  'Cloud infrastructure + AI services + logistics AI': { bg: 'rgba(45,212,191,0.12)', color: '#2dd4bf', border: 'rgba(45,212,191,0.25)' },
  'AI for mission-critical / classified use cases': { bg: 'rgba(251,146,60,0.12)', color: '#fb923c', border: 'rgba(251,146,60,0.25)' },
  'Infrastructure layer for all AI applications': { bg: 'rgba(232,121,249,0.12)', color: '#e879f9', border: 'rgba(232,121,249,0.25)' },
  'AI in physical surgical workflow — longest runway': { bg: 'rgba(32,200,120,0.12)', color: '#20c878', border: 'rgba(32,200,120,0.25)' },
  'Clean power for AI infrastructure — structural 10yr+ tailwind': { bg: 'rgba(74,222,128,0.12)', color: '#4ade80', border: 'rgba(74,222,128,0.25)' },
}

function RiskLevel({ peg }) {
  if (peg > 4)  return <span style={{fontSize:10,color:'#f05252',fontWeight:600}}>High valuation risk</span>
  if (peg > 3)  return <span style={{fontSize:10,color:'#f4a724',fontWeight:600}}>Elevated valuation</span>
  if (peg > 2)  return <span style={{fontSize:10,color:'#5b8af0',fontWeight:600}}>Fair valuation</span>
  return             <span style={{fontSize:10,color:'#20c878',fontWeight:600}}>Attractive valuation</span>
}

function StockCard({ co, rank, livePrice }) {
  const [expanded, setExpanded] = useState(false)
  const signalStyle = AI_SIGNAL_COLORS[co.aiSignal] || AI_SIGNAL_COLORS['Core infrastructure']
  const priceUp = livePrice?.change >= 0

  return (
    <div style={{background:'var(--surface)',border:'1px solid var(--border)',
      borderRadius:'var(--radius-lg)',overflow:'hidden',
      transition:'border-color 0.15s,transform 0.15s'}}
      onMouseEnter={e=>e.currentTarget.style.borderColor='var(--border2)'}
      onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>

      {/* Card header — always visible */}
      <div style={{padding:'16px 18px',cursor:'pointer'}} onClick={()=>setExpanded(v=>!v)}>
        <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
          {/* Rank */}
          <div style={{width:28,height:28,borderRadius:'50%',background:'var(--surface2)',
            border:'1px solid var(--border2)',display:'flex',alignItems:'center',
            justifyContent:'center',fontSize:11,fontFamily:'var(--font-mono)',
            color:'var(--muted)',flexShrink:0}}>
            {rank}
          </div>

          <div style={{flex:1,minWidth:0}}>
            {/* Ticker + name row */}
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6,flexWrap:'wrap'}}>
              <span style={{fontFamily:'var(--font-mono)',fontWeight:700,fontSize:16,
                color:'var(--accent)'}}>{co.ticker}</span>
              <span style={{fontSize:14,fontWeight:600,color:'var(--text)'}}>{co.name}</span>
              <span style={{fontSize:10,padding:'2px 8px',borderRadius:20,
                background:'var(--surface2)',color:'var(--muted)',
                border:'1px solid var(--border)',fontFamily:'var(--font-mono)'}}>
                {co.industry}
              </span>
              <span style={{fontSize:10,padding:'2px 10px',borderRadius:20,
                background:signalStyle.bg,color:signalStyle.color,
                border:`1px solid ${signalStyle.border}`,fontWeight:600}}>
                {co.aiSignal}
              </span>
            </div>

            {/* Why it matters */}
            <p style={{fontSize:12,color:'var(--text2)',lineHeight:1.7,margin:'0 0 10px',
              display:expanded?'none':'block'}}>
              {co.whyItMatters}
            </p>

            {/* Key metrics row */}
            <div style={{display:'flex',gap:16,flexWrap:'wrap',alignItems:'center'}}>
              {[
                {label:'Gross Margin', val:`${co.roic}%`},
                {label:'FCF Margin',   val:`${co.fcf}%`},
                {label:'Rev Growth',   val:`+${co.oplev}%`, color: co.oplev > 30 ? '#20c878' : co.oplev > 15 ? '#f4a724' : 'var(--text)'},
                {label:'PEG',          val:co.peg},
              ].map(m => (
                <div key={m.label} style={{textAlign:'center'}}>
                  <div style={{fontSize:13,fontWeight:600,fontFamily:'var(--font-mono)',
                    color:m.color||'var(--text)'}}>{m.val}</div>
                  <div style={{fontSize:9,color:'var(--muted)',textTransform:'uppercase',
                    letterSpacing:'0.4px'}}>{m.label}</div>
                </div>
              ))}
              <div style={{marginLeft:'auto',textAlign:'right'}}>
                {livePrice?.price ? (
                  <>
                    <div style={{fontSize:15,fontWeight:700,fontFamily:'var(--font-mono)',
                      color:'var(--text)'}}>${livePrice.price.toFixed(2)}</div>
                    <div style={{fontSize:11,fontFamily:'var(--font-mono)',
                      color:priceUp?'#20c878':'#f05252'}}>
                      {priceUp?'+':''}{livePrice.change?.toFixed(2)}%
                    </div>
                  </>
                ) : (
                  <div style={{fontSize:12,color:'var(--muted)',fontFamily:'var(--font-mono)'}}>—</div>
                )}
              </div>
              <div style={{fontSize:10,color:'var(--muted)'}}>{expanded?'▲':'▼'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{padding:'0 18px 18px 58px',borderTop:'1px solid var(--border)',
          paddingTop:14,background:'var(--surface2)'}}>

          {/* Full why it matters */}
          <div style={{fontSize:13,color:'var(--text)',lineHeight:1.8,marginBottom:14,
            borderLeft:'3px solid var(--accent)',paddingLeft:12}}>
            {co.whyItMatters}
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:14}}>
            {/* Moat */}
            <div style={{background:'var(--surface)',border:'1px solid var(--border)',
              borderRadius:'var(--radius)',padding:'10px 14px'}}>
              <div style={{fontSize:9,color:'var(--muted)',textTransform:'uppercase',
                letterSpacing:'0.4px',marginBottom:6}}>Competitive moat</div>
              <div style={{fontSize:12,color:'var(--text2)',lineHeight:1.6}}>{co.moat}</div>
            </div>
            {/* Risks */}
            <div style={{background:'rgba(240,82,82,0.04)',border:'1px solid rgba(240,82,82,0.15)',
              borderRadius:'var(--radius)',padding:'10px 14px'}}>
              <div style={{fontSize:9,color:'#f05252',textTransform:'uppercase',
                letterSpacing:'0.4px',marginBottom:6}}>Key risks</div>
              <div style={{fontSize:12,color:'var(--text2)',lineHeight:1.6}}>{co.risks}</div>
            </div>
          </div>

          {/* Full metrics */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:8}}>
            {[
              {label:'Gross Margin', val:`${co.roic}%`, note:'profitability'},
              {label:'FCF Margin',   val:`${co.fcf}%`,  note:'cash quality'},
              {label:'EV/Sales',     val:`${co.evebitda}x`, note:'fwd multiple'},
              {label:'Rev Growth',   val:`+${co.oplev}%`, note:'yoy'},
              {label:'Rev/Emp',      val:`$${co.revpemp}M`, note:'productivity'},
              {label:'Net Debt/EBITDA', val:`${co.debt}x`, note:'leverage'},
              {label:'PEG Ratio',    val:co.peg, note:'value vs growth'},
            ].map(m => (
              <div key={m.label} style={{background:'var(--surface)',border:'1px solid var(--border)',
                borderRadius:'var(--radius)',padding:'8px 10px',textAlign:'center'}}>
                <div style={{fontSize:13,fontWeight:600,fontFamily:'var(--font-mono)',
                  color:'var(--text)',marginBottom:2}}>{m.val}</div>
                <div style={{fontSize:9,color:'var(--muted)',textTransform:'uppercase',
                  letterSpacing:'0.3px',lineHeight:1.3}}>{m.label}</div>
                <div style={{fontSize:9,color:'var(--muted)',fontStyle:'italic'}}>{m.note}</div>
              </div>
            ))}
          </div>

          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:12}}>
            <RiskLevel peg={co.peg}/>
            <button onClick={(e)=>{
              e.stopPropagation()
              const msg = `Give me a detailed analysis of ${co.ticker} (${co.name}) as an AI investment. Focus on: ${co.aiSignal}. Key concern I have: ${co.risks.split(',')[0]}`
              window.location.href = '/chat?q=' + encodeURIComponent(msg)
            }} style={{padding:'6px 14px',background:'var(--accent-dim)',
              border:'1px solid var(--accent-border)',color:'var(--accent)',
              borderRadius:'var(--radius)',fontSize:11,fontWeight:600,cursor:'pointer'}}>
              Ask Claude about {co.ticker} →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sector coverage visual ───────────────────────────────────────────────────
function AIStackView() {
  const layers = [
    { label: 'Power & Infrastructure', color: '#4ade80', tickers: ['BEP', 'CEG', 'VST'], note: 'Electricity for data centers' },
    { label: 'Compute Hardware',        color: '#a78bfa', tickers: ['NVDA', 'TSM'],        note: 'GPUs + foundry' },
    { label: 'Cloud Platforms',         color: '#5b8af0', tickers: ['MSFT', 'GOOGL', 'AMZN'], note: 'Azure · GCP · AWS' },
    { label: 'AI Applications',         color: '#fb923c', tickers: ['PLTR', 'DDOG', 'CRWD'], note: 'Enterprise + security + observability' },
    { label: 'AI in Physical World',    color: '#20c878', tickers: ['ISRG'],               note: 'Robotics + surgery' },
  ]
  return (
    <div style={{background:'var(--surface)',border:'1px solid var(--border)',
      borderRadius:'var(--radius-lg)',padding:'16px 20px',marginBottom:20}}>
      <div style={{fontSize:12,fontWeight:600,marginBottom:12,color:'var(--text)'}}>
        AI Stack Coverage — where your 10 sit in the value chain
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:6}}>
        {layers.map(layer => (
          <div key={layer.label} style={{display:'flex',alignItems:'center',gap:12}}>
            <div style={{width:160,flexShrink:0,fontSize:11,color:'var(--text2)',fontWeight:500}}>
              {layer.label}
            </div>
            <div style={{flex:1,height:32,background:`${layer.color}15`,
              border:`1px solid ${layer.color}30`,borderRadius:'var(--radius)',
              display:'flex',alignItems:'center',padding:'0 10px',gap:8,position:'relative'}}>
              {layer.tickers.map(t => (
                <span key={t} style={{fontSize:11,fontFamily:'var(--font-mono)',fontWeight:700,
                  color:layer.color,background:`${layer.color}20`,
                  padding:'2px 8px',borderRadius:4}}>{t}</span>
              ))}
              <span style={{fontSize:10,color:'var(--muted)',marginLeft:'auto'}}>{layer.note}</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{marginTop:10,fontSize:10,color:'var(--muted)',fontFamily:'var(--font-mono)'}}>
        Note: CEG/VST from your main 100 universe also play the power layer
      </div>
    </div>
  )
}

export default function TechAI() {
  const [prices, setPrices] = useState({})
  const [loadingPrices, setLoadingPrices] = useState(false)
  const [sortBy, setSortBy] = useState('rank')

  const loadPrices = async () => {
    setLoadingPrices(true)
    const results = {}
    await Promise.all(TECH_COMPANIES.map(async co => {
      const p = await fetchPrice(co.ticker)
      if (p.price) results[co.ticker] = p
    }))
    setPrices(results)
    setLoadingPrices(false)
  }

  const sorted = [...TECH_COMPANIES].sort((a, b) => {
    if (sortBy === 'growth')  return b.oplev - a.oplev
    if (sortBy === 'margin')  return b.fcf - a.fcf
    if (sortBy === 'peg')     return a.peg - b.peg
    return 0
  })

  // Summary stats
  const avgGrowth = (TECH_COMPANIES.reduce((s,c)=>s+c.oplev,0)/TECH_COMPANIES.length).toFixed(1)
  const avgFCF    = (TECH_COMPANIES.reduce((s,c)=>s+c.fcf,0)/TECH_COMPANIES.length).toFixed(1)
  const debtFree  = TECH_COMPANIES.filter(c=>c.debt<0.5).length

  return (
    <div style={{padding:'24px',maxWidth:900}}>
      {/* Header */}
      <div style={{marginBottom:20}}>
        <div style={{display:'flex',alignItems:'baseline',gap:12,marginBottom:4}}>
          <h1 style={{fontFamily:'var(--font-display)',fontSize:26}}>Tech & AI Universe</h1>
          <span style={{fontSize:11,background:'rgba(167,139,250,0.15)',color:'#a78bfa',
            border:'1px solid rgba(167,139,250,0.3)',padding:'3px 10px',borderRadius:10,
            fontWeight:600}}>Your 10 AI picks</span>
        </div>
        <p style={{color:'var(--text2)',fontSize:13,lineHeight:1.7}}>
          AI-native and AI-enabling companies across the full stack — compute, cloud, applications, physical world, and power.
          Different lens from the main 100: growth rate and margin quality matter more than traditional value metrics here.
        </p>
      </div>

      {/* Summary stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:20}}>
        {[
          {label:'Companies tracked', val:'10', color:'var(--accent)'},
          {label:'Avg revenue growth', val:`+${avgGrowth}%`, color:'#20c878'},
          {label:'Avg FCF margin',     val:`${avgFCF}%`,     color:'#f4a724'},
          {label:'Net debt-free',      val:`${debtFree}/10`, color:'#a78bfa'},
        ].map(s => (
          <div key={s.label} style={{background:'var(--surface)',border:'1px solid var(--border)',
            borderRadius:'var(--radius-lg)',padding:'12px 14px',textAlign:'center'}}>
            <div style={{fontSize:22,fontWeight:700,fontFamily:'var(--font-mono)',color:s.color,marginBottom:2}}>{s.val}</div>
            <div style={{fontSize:10,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.4px'}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* AI Stack View */}
      <AIStackView />

      {/* Controls */}
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14,flexWrap:'wrap'}}>
        <span style={{fontSize:11,color:'var(--muted)'}}>Sort by:</span>
        {[
          {val:'rank',   label:'My ranking'},
          {val:'growth', label:'Revenue growth'},
          {val:'margin', label:'FCF margin'},
          {val:'peg',    label:'PEG (value)'},
        ].map(s => (
          <button key={s.val} onClick={()=>setSortBy(s.val)}
            style={{padding:'5px 12px',borderRadius:20,fontSize:11,fontWeight:500,
              background:sortBy===s.val?'var(--accent)':'var(--surface)',
              color:sortBy===s.val?'#fff':'var(--text2)',
              border:`1px solid ${sortBy===s.val?'var(--accent)':'var(--border)'}`,
              cursor:'pointer',transition:'all 0.15s'}}>
            {s.label}
          </button>
        ))}
        <button onClick={loadPrices} disabled={loadingPrices}
          style={{marginLeft:'auto',padding:'5px 14px',background:'var(--surface)',
            border:'1px solid var(--border2)',color:'var(--text2)',
            borderRadius:20,fontSize:11,fontWeight:500,cursor:'pointer',
            opacity:loadingPrices?0.5:1}}>
          {loadingPrices ? 'Loading…' : '↻ Live prices'}
        </button>
      </div>

      {/* Stock cards */}
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {sorted.map((co, i) => (
          <StockCard key={co.ticker} co={co}
            rank={TECH_COMPANIES.indexOf(co)+1}
            livePrice={prices[co.ticker]}/>
        ))}
      </div>

      {/* Notes */}
      <div style={{marginTop:16,padding:'12px 16px',background:'var(--surface)',
        border:'1px solid var(--border)',borderRadius:'var(--radius-lg)'}}>
        <div style={{fontSize:11,fontWeight:600,marginBottom:6}}>Notes on this list</div>
        <div style={{fontSize:11,color:'var(--text2)',lineHeight:1.8}}>
          Metrics are adapted for growth companies: Gross Margin (not ROIC), FCF Margin (not yield),
          EV/Sales forward (not EV/EBITDA), Revenue Growth YoY (not op. leverage).
          PEG ratio is retained as a valuation anchor.
          ISRG also appears in the main 100 universe.
          BEP (Brookfield Renewable) trades on NYSE as a Canadian LP — check tax treatment before buying.
        </div>
      </div>

      <div style={{marginTop:10,fontSize:10,color:'var(--muted)',fontFamily:'var(--font-mono)'}}>
        ⚠ Personal research only. Not financial advice. Metrics are FY2025/TTM estimates.
      </div>
    </div>
  )
}
