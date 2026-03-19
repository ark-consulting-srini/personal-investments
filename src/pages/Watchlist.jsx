import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth.jsx'
import { useMarketData } from '../hooks/useMarketData'
import { getWatchlist, removeFromWatchlist, getNotes, upsertNote } from '../lib/supabase'
import { COMPANIES_SCORED } from '../lib/data'
import { ScoreBadge, SectorBadge, MetricCell, PriceChange } from '../components/Badges'

export default function Watchlist() {
  const { user } = useAuth()
  const { prices, loading: priceLoading, fetchPrices } = useMarketData()
  const [watchlist, setWatchlist] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [note, setNote] = useState('')
  const [noteSaving, setNoteSaving] = useState(false)
  const [noteSaved, setNoteSaved] = useState(false)

  const load = async () => {
    if (!user) return
    setLoading(true)
    const { data } = await getWatchlist(user.id)
    setWatchlist(data || [])
    setLoading(false)
    if (data?.length) fetchPrices(data.map(d => d.ticker))
  }

  useEffect(() => { load() }, [user])

  const remove = async (ticker) => {
    await removeFromWatchlist(user.id, ticker)
    setWatchlist(prev => prev.filter(w => w.ticker !== ticker))
    if (selected?.ticker === ticker) setSelected(null)
  }

  const openDetail = async (item) => {
    setSelected(item)
    setNoteSaved(false)
    const { data } = await getNotes(user.id, item.ticker)
    setNote(data?.[0]?.content || '')
  }

  const saveNote = async () => {
    if (!selected) return
    setNoteSaving(true)
    await upsertNote(user.id, selected.ticker, note)
    setNoteSaving(false)
    setNoteSaved(true)
    setTimeout(() => setNoteSaved(false), 2000)
  }

  const getCompanyData = (ticker) => COMPANIES_SCORED.find(c => c.ticker === ticker)

  return (
    <div style={{ padding:'24px', display:'flex', gap:20, alignItems:'flex-start' }}>
      {/* List */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ marginBottom:20 }}>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:26 }}>Watchlist</h1>
          <p style={{ color:'var(--text2)', fontSize:13, marginTop:3 }}>{watchlist.length} companies tracked</p>
        </div>

        {loading ? (
          <div style={{ color:'var(--muted)', fontFamily:'var(--font-mono)', fontSize:12, padding:20 }}>Loading…</div>
        ) : watchlist.length === 0 ? (
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)',
            padding:40, textAlign:'center', color:'var(--muted)' }}>
            <div style={{ fontSize:32, marginBottom:12 }}>☆</div>
            <div style={{ fontSize:14, marginBottom:6 }}>Your watchlist is empty</div>
            <div style={{ fontSize:12, fontFamily:'var(--font-mono)' }}>Star companies on the Dashboard to add them here</div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {watchlist.map(item => {
              const co = getCompanyData(item.ticker)
              const pr = prices[item.ticker]
              const isSelected = selected?.ticker === item.ticker
              return (
                <div key={item.ticker}
                  onClick={() => openDetail(item)}
                  style={{ background: isSelected ? 'var(--surface2)' : 'var(--surface)',
                    border: `1px solid ${isSelected?'var(--accent)':'var(--border)'}`,
                    borderRadius:'var(--radius-lg)', padding:'14px 16px', cursor:'pointer',
                    transition:'all 0.15s', display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                      <span style={{ fontFamily:'var(--font-mono)', color:'var(--accent)', fontWeight:600, fontSize:13 }}>
                        {item.ticker}
                      </span>
                      <SectorBadge sector={item.sector}/>
                      {co && <ScoreBadge score={co.score} size="sm"/>}
                    </div>
                    <div style={{ fontSize:13, fontWeight:500, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {item.name}
                    </div>
                  </div>
                  {pr && (
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <div style={{ fontFamily:'var(--font-mono)', fontSize:15, fontWeight:600 }}>${pr.price.toFixed(2)}</div>
                      <PriceChange change={pr.change} pct={pr.changePct}/>
                    </div>
                  )}
                  <button
                    onClick={e => { e.stopPropagation(); remove(item.ticker) }}
                    style={{ background:'none', color:'var(--muted)', fontSize:18, padding:'0 4px',
                      transition:'color 0.15s', flexShrink:0 }}
                    onMouseEnter={e=>e.target.style.color='var(--red)'}
                    onMouseLeave={e=>e.target.style.color='var(--muted)'}
                    title="Remove from watchlist">×</button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Detail Panel */}
      {selected && (() => {
        const co = getCompanyData(selected.ticker)
        const pr = prices[selected.ticker]
        return (
          <div className="fade-in" style={{ width:340, flexShrink:0, background:'var(--surface)',
            border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'20px',
            position:'sticky', top:24 }}>
            {/* Header */}
            <div style={{ marginBottom:16, paddingBottom:14, borderBottom:'1px solid var(--border)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <div style={{ fontFamily:'var(--font-mono)', color:'var(--accent)', fontWeight:700, fontSize:14 }}>
                    {selected.ticker}
                  </div>
                  <div style={{ fontSize:15, fontWeight:600, marginTop:2 }}>{selected.name}</div>
                </div>
                <button onClick={()=>setSelected(null)}
                  style={{ background:'none', color:'var(--muted)', fontSize:20 }}>×</button>
              </div>
              <div style={{ marginTop:8, display:'flex', gap:8, alignItems:'center' }}>
                <SectorBadge sector={selected.sector}/>
                {co && <ScoreBadge score={co.score}/>}
              </div>
              {pr && (
                <div style={{ marginTop:10, display:'flex', gap:12, alignItems:'center' }}>
                  <span style={{ fontFamily:'var(--font-mono)', fontSize:22, fontWeight:700 }}>
                    ${pr.price.toFixed(2)}
                  </span>
                  <PriceChange change={pr.change} pct={pr.changePct}/>
                </div>
              )}
            </div>

            {/* Metrics */}
            {co && (
              <div style={{ marginBottom:16, paddingBottom:14, borderBottom:'1px solid var(--border)' }}>
                <div style={{ fontSize:10, color:'var(--muted)', fontFamily:'var(--font-mono)',
                  textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:10 }}>
                  7-Metric Snapshot
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {[
                    {key:'roic',label:'ROIC-WACC',suffix:'%'},
                    {key:'fcf',label:'FCF Yield',suffix:'%'},
                    {key:'evebitda',label:'EV/EBITDA',suffix:'×'},
                    {key:'oplev',label:'Op.Leverage',suffix:'pp'},
                    {key:'revpemp',label:'Rev/Emp Δ',suffix:'%'},
                    {key:'debt',label:'Debt/EBITDA',suffix:'×'},
                    {key:'peg',label:'PEG',suffix:''},
                  ].map(m => (
                    <div key={m.key} style={{ background:'var(--bg)', borderRadius:6, padding:'8px 10px' }}>
                      <div style={{ fontSize:9, color:'var(--muted)', fontFamily:'var(--font-mono)', marginBottom:2 }}>
                        {m.label}
                      </div>
                      <MetricCell value={co[m.key]} metric={m.key} suffix={m.suffix}/>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <div style={{ fontSize:10, color:'var(--muted)', fontFamily:'var(--font-mono)',
                textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:8 }}>
                Research Notes
              </div>
              <textarea
                value={note} onChange={e=>setNote(e.target.value)}
                placeholder="Add your investment thesis, key risks, price targets…"
                style={{ width:'100%', background:'var(--surface2)', border:'1px solid var(--border2)',
                  color:'var(--text)', padding:'10px 12px', borderRadius:'var(--radius)',
                  fontSize:12, resize:'vertical', minHeight:120, outline:'none',
                  fontFamily:'var(--font-body)', lineHeight:1.6 }}
                onFocus={e=>e.target.style.borderColor='var(--accent)'}
                onBlur={e=>e.target.style.borderColor='var(--border2)'}
              />
              <button
                onClick={saveNote} disabled={noteSaving}
                style={{ marginTop:8, padding:'8px 16px',
                  background: noteSaved ? 'var(--green-dim)' : 'var(--accent-dim)',
                  border: `1px solid ${noteSaved?'rgba(32,200,120,0.3)':'var(--accent-border)'}`,
                  color: noteSaved ? 'var(--green)' : 'var(--accent)',
                  borderRadius:'var(--radius)', fontSize:12, fontWeight:600,
                  width:'100%', transition:'all 0.2s' }}>
                {noteSaving ? 'Saving…' : noteSaved ? '✓ Saved' : 'Save Note'}
              </button>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
