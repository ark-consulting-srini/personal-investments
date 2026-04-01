import { useState, useEffect } from 'react'
import { COMPANIES_SCORED } from '../lib/data'
import { useMarketData } from '../hooks/useMarketData'
import { SectorBadge } from '../components/Badges'

const PERIODS = ['1D','5D','1M','3M','YTD','1Y']

export default function Prices() {
  const { prices, fetchPrices } = useMarketData()
  const [selected, setSelected] = useState(COMPANIES_SCORED[0])
  const [period, setPeriod] = useState('1D')
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [chartData, setChartData] = useState([])
  const [chartLoading, setChartLoading] = useState(false)

  const filtered = COMPANIES_SCORED.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.ticker.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    fetchPrices(COMPANIES_SCORED.slice(0, 20).map(c => c.ticker))
  }, [])

  useEffect(() => {
    if (selected) fetchChartData(selected.ticker, period)
  }, [selected, period])

  const fetchChartData = async (ticker, p) => {
    setChartLoading(true)
    try {
      const rangeMap = { '1D':'1d','5D':'5d','1M':'1mo','3M':'3mo','YTD':'ytd','1Y':'1y' }
      const intervalMap = { '1D':'5m','5D':'15m','1M':'1d','3M':'1d','YTD':'1d','1Y':'1wk' }
      const url = `https://api.allorigins.win/get?url=${encodeURIComponent(
        `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=${intervalMap[p]}&range=${rangeMap[p]}`
      )}`
      const res = await fetch(url)
      const outer = await res.json()
      const data = JSON.parse(outer.contents)
      const result = data?.chart?.result?.[0]
      if (!result) return
      const times = result.timestamp || []
      const closes = result.indicators?.quote?.[0]?.close || []
      const points = times.map((t, i) => ({
        time: new Date(t * 1000),
        price: closes[i],
      })).filter(p => p.price != null)
      setChartData(points)
    } catch (e) {
      setChartData([])
    } finally {
      setChartLoading(false)
    }
  }

  const pr = prices[selected?.ticker]
  const up = pr ? pr.changePct >= 0 : true
  const priceColor = up ? 'var(--green)' : 'var(--red)'

  // Mini SVG sparkline
  const Sparkline = ({ data, color }) => {
    if (!data.length) return <div style={{height:200,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--muted)',fontSize:12}}>No chart data</div>
    const prices = data.map(d => d.price)
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const range = max - min || 1
    const w = 600, h = 180
    const pts = data.map((d, i) => {
      const x = (i / (data.length - 1)) * w
      const y = h - ((d.price - min) / range) * h
      return `${x},${y}`
    }).join(' ')
    const first = prices[0], last = prices[prices.length - 1]
    const fillPts = `0,${h} ${pts} ${w},${h}`
    return (
      <svg viewBox={`0 0 ${w} ${h}`} style={{width:'100%',height:200,overflow:'visible'}}>
        <defs>
          <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.15"/>
            <stop offset="100%" stopColor={color} stopOpacity="0"/>
          </linearGradient>
        </defs>
        <polygon points={fillPts} fill="url(#chartFill)"/>
        <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
      </svg>
    )
  }

  const formatTime = (d) => {
    if (!d) return ''
    if (period === '1D') return d.toLocaleTimeString('en-US', {hour:'2-digit',minute:'2-digit'})
    return d.toLocaleDateString('en-US', {month:'short',day:'numeric'})
  }

  return (
    <div style={{display:'flex', height:'calc(100vh - 0px)', overflow:'hidden'}}>
      {/* Left — company list */}
      <div style={{width:260, flexShrink:0, borderRight:'1px solid var(--border)',
        display:'flex', flexDirection:'column', background:'var(--surface)'}}>
        <div style={{padding:'16px 14px 10px'}}>
          <div style={{fontSize:13, fontWeight:600, marginBottom:10}}>Companies</div>
          <input placeholder="Search…" value={search} onChange={e=>setSearch(e.target.value)}
            style={{width:'100%', background:'var(--surface2)', border:'1px solid var(--border2)',
              color:'var(--text)', padding:'7px 10px', borderRadius:'var(--radius)',
              fontSize:12, outline:'none'}}/>
        </div>
        <div style={{flex:1, overflowY:'auto'}}>
          {filtered.map(c => {
            const p = prices[c.ticker]
            const isUp = p ? p.changePct >= 0 : null
            return (
              <div key={c.ticker} onClick={()=>setSelected(c)}
                style={{padding:'10px 14px', cursor:'pointer', borderBottom:'1px solid var(--border)',
                  background: selected?.ticker===c.ticker ? 'var(--accent-dim)' : 'transparent',
                  borderLeft: selected?.ticker===c.ticker ? '2px solid var(--accent)' : '2px solid transparent',
                  transition:'all 0.12s'}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <span style={{fontFamily:'var(--font-mono)', color:'var(--accent)', fontWeight:700, fontSize:12}}>{c.ticker}</span>
                  {p && <span style={{fontFamily:'var(--font-mono)', fontSize:12, fontWeight:600, color: isUp?'var(--green)':'var(--red)'}}>
                    ${p.price.toFixed(2)}
                  </span>}
                </div>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:2}}>
                  <span style={{fontSize:11, color:'var(--text2)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:140}}>{c.name}</span>
                  {p && <span style={{fontSize:10, fontFamily:'var(--font-mono)', color: isUp?'var(--green)':'var(--red)', flexShrink:0}}>
                    {isUp?'▲':'▼'}{Math.abs(p.changePct).toFixed(2)}%
                  </span>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Right — price detail */}
      <div style={{flex:1, padding:'24px 28px', overflowY:'auto'}}>
        {selected && (
          <div className="fade-in">
            {/* Header */}
            <div style={{marginBottom:20}}>
              <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:6}}>
                <span style={{fontFamily:'var(--font-mono)', fontSize:13, color:'var(--accent)', fontWeight:700}}>{selected.ticker}</span>
                <SectorBadge sector={selected.sector}/>
                <span style={{fontSize:11, color:'var(--muted)', fontFamily:'var(--font-mono)'}}>{selected.industry}</span>
              </div>
              <h1 style={{fontFamily:'var(--font-display)', fontSize:28, letterSpacing:'-0.3px', marginBottom:8}}>{selected.name}</h1>

              {pr ? (
                <div>
                  <div style={{display:'flex', alignItems:'baseline', gap:12}}>
                    <span style={{fontFamily:'var(--font-mono)', fontSize:42, fontWeight:700, letterSpacing:'-1px', color:'var(--text)'}}>
                      ${pr.price.toFixed(2)}
                    </span>
                    <span style={{fontFamily:'var(--font-mono)', fontSize:14, color:'var(--muted)'}}>USD</span>
                  </div>
                  <div style={{display:'flex', alignItems:'center', gap:8, marginTop:4}}>
                    <span style={{fontFamily:'var(--font-mono)', fontSize:16, color:priceColor, fontWeight:600}}>
                      {up?'▲':'▼'} {Math.abs(pr.change).toFixed(2)} ({Math.abs(pr.changePct).toFixed(2)}%)
                    </span>
                    <span style={{fontSize:12, color:'var(--muted)'}}>today</span>
                  </div>
                  <div style={{fontSize:11, color:'var(--muted)', marginTop:4, fontFamily:'var(--font-mono)'}}>
                    Prev close: ${pr.prev.toFixed(2)}
                    <span style={{marginLeft:12}}>{pr.marketState === 'CLOSED' ? 'Market closed' : pr.marketState === 'PRE' ? 'Pre-market' : 'Market open'}</span>
                  </div>
                </div>
              ) : (
                <div style={{display:'flex', alignItems:'center', gap:10}}>
                  <span style={{fontFamily:'var(--font-mono)', fontSize:36, color:'var(--muted)'}}>—</span>
                  <button onClick={()=>fetchPrices([selected.ticker])}
                    style={{padding:'6px 14px', background:'var(--accent-dim)', border:'1px solid var(--accent-border)',
                      color:'var(--accent)', borderRadius:'var(--radius)', fontSize:12, fontWeight:600}}>
                    Load price
                  </button>
                </div>
              )}
            </div>

            {/* Period tabs */}
            <div style={{display:'flex', gap:4, marginBottom:16}}>
              {PERIODS.map(p => (
                <button key={p} onClick={()=>setPeriod(p)}
                  style={{padding:'5px 14px', borderRadius:6, fontSize:12, fontWeight:600,
                    background: period===p ? 'var(--accent)' : 'transparent',
                    color: period===p ? '#fff' : 'var(--text2)',
                    border: period===p ? 'none' : '1px solid var(--border2)',
                    transition:'all 0.15s'}}>
                  {p}
                </button>
              ))}
            </div>

            {/* Chart */}
            <div style={{background:'var(--surface)', border:'1px solid var(--border)',
              borderRadius:'var(--radius-lg)', padding:'20px', marginBottom:20}}>
              {chartLoading ? (
                <div style={{height:200, display:'flex', alignItems:'center', justifyContent:'center',
                  color:'var(--muted)', fontSize:12, fontFamily:'var(--font-mono)'}}>
                  Loading chart…
                </div>
              ) : (
                <>
                  <Sparkline data={chartData} color={up?'#20c878':'#f05252'}/>
                  {chartData.length > 0 && (
                    <div style={{display:'flex', justifyContent:'space-between', marginTop:8,
                      fontSize:10, color:'var(--muted)', fontFamily:'var(--font-mono)'}}>
                      <span>{formatTime(chartData[0]?.time)}</span>
                      <span>{formatTime(chartData[Math.floor(chartData.length/2)]?.time)}</span>
                      <span>{formatTime(chartData[chartData.length-1]?.time)}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Key stats */}
            <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10}}>
              {[
                {label:'ROIC-WACC', val:`${selected.roic}%`, good:selected.roic>4},
                {label:'FCF Yield', val:`${selected.fcf}%`, good:selected.fcf>4},
                {label:'EV/EBITDA', val:`${selected.evebitda}×`, good:selected.evebitda<12},
                {label:'PEG Ratio', val:selected.peg, good:selected.peg<1.5},
                {label:'Debt/EBITDA', val:`${selected.debt}×`, good:selected.debt<2},
                {label:'Op. Leverage', val:`${selected.oplev>0?'+':''}${selected.oplev}pp`, good:selected.oplev>1},
                {label:'Rev/Emp Δ', val:`+${selected.revpemp}%`, good:selected.revpemp>5},
                {label:'Score', val:`${selected.score}/5`, good:selected.score>=4},
              ].map(s => (
                <div key={s.label} style={{background:'var(--surface)', border:'1px solid var(--border)',
                  borderRadius:'var(--radius)', padding:'12px 14px'}}>
                  <div style={{fontSize:9, color:'var(--muted)', fontFamily:'var(--font-mono)',
                    textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:4}}>{s.label}</div>
                  <div style={{fontSize:16, fontFamily:'var(--font-mono)', fontWeight:600,
                    color:s.good?'var(--green)':'var(--text)'}}>{s.val}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
