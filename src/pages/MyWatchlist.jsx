import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../hooks/useAuth.jsx'
import { useMarketData } from '../hooks/useMarketData'
import {
  getWatchlist, removeFromWatchlist, getNotes, upsertNote,
  getAlerts, addAlert, deleteAlert, markAlertTriggered,
} from '../lib/supabase'
import { supabase } from '../lib/supabase'
import { COMPANIES_SCORED } from '../lib/data'
import { ScoreBadge, SectorBadge, MetricCell, PriceChange } from '../components/Badges'

const PROXY = 'https://api.allorigins.win/get?url='

// ─── Shared helpers ────────────────────────────────────────────────────────────
const getCo = (ticker) => COMPANIES_SCORED.find(c => c.ticker === ticker)

async function getPortfolio(userId) {
  const { data, error } = await supabase.from('portfolio').select('*')
    .eq('user_id', userId).order('ticker')
  return { data, error }
}
async function upsertPortfolio(userId, row) {
  const { data, error } = await supabase.from('portfolio')
    .upsert({ user_id: userId, ...row }, { onConflict: 'user_id,ticker' }).select()
  return { data, error }
}
async function deletePortfolio(userId, ticker) {
  return supabase.from('portfolio').delete().eq('user_id', userId).eq('ticker', ticker)
}

// ─── Tab: Watchlist ────────────────────────────────────────────────────────────
function WatchlistTab({ user, prices, fetchPrices }) {
  const [watchlist, setWatchlist] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [note, setNote] = useState('')
  const [noteSaving, setNoteSaving] = useState(false)
  const [noteSaved, setNoteSaved] = useState(false)

  useEffect(() => {
    if (!user) return
    getWatchlist(user.id).then(({ data }) => {
      setWatchlist(data || [])
      setLoading(false)
      if (data?.length) fetchPrices(data.map(d => d.ticker))
    })
  }, [user])

  const remove = async (ticker) => {
    await removeFromWatchlist(user.id, ticker)
    setWatchlist(prev => prev.filter(w => w.ticker !== ticker))
    if (selected?.ticker === ticker) setSelected(null)
  }

  const openDetail = async (item) => {
    setSelected(item); setNoteSaved(false)
    const { data } = await getNotes(user.id, item.ticker)
    setNote(data?.[0]?.content || '')
  }

  const saveNote = async () => {
    if (!selected) return
    setNoteSaving(true)
    await upsertNote(user.id, selected.ticker, note)
    setNoteSaving(false); setNoteSaved(true)
    setTimeout(() => setNoteSaved(false), 2000)
  }

  return (
    <div style={{ display:'flex', gap:20, alignItems:'flex-start', padding:'20px 24px' }}>
      {/* List */}
      <div style={{ flex:1, minWidth:0 }}>
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
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {watchlist.map(item => {
              const co = getCo(item.ticker)
              const pr = prices[item.ticker]
              const isSel = selected?.ticker === item.ticker
              return (
                <div key={item.ticker} onClick={() => openDetail(item)}
                  style={{ background: isSel ? 'var(--surface2)' : 'var(--surface)',
                    border: `1px solid ${isSel ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius:'var(--radius-lg)', padding:'12px 14px', cursor:'pointer',
                    display:'flex', alignItems:'center', gap:12, transition:'all 0.12s' }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                      <span style={{ fontFamily:'var(--font-mono)', color:'var(--accent)', fontWeight:700, fontSize:13 }}>{item.ticker}</span>
                      <SectorBadge sector={item.sector}/>
                      {co && <ScoreBadge score={co.score} size="sm"/>}
                    </div>
                    <div style={{ fontSize:13, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.name}</div>
                  </div>
                  {pr && (
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <div style={{ fontFamily:'var(--font-mono)', fontSize:15, fontWeight:600 }}>${pr.price.toFixed(2)}</div>
                      <PriceChange change={pr.change} pct={pr.changePct}/>
                    </div>
                  )}
                  <button onClick={e => { e.stopPropagation(); remove(item.ticker) }}
                    style={{ background:'none', color:'var(--muted)', fontSize:18, padding:'0 4px', flexShrink:0 }}
                    onMouseEnter={e => e.target.style.color = 'var(--red)'}
                    onMouseLeave={e => e.target.style.color = 'var(--muted)'}>×</button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selected && (() => {
        const co = getCo(selected.ticker)
        const pr = prices[selected.ticker]
        return (
          <div className="fade-in" style={{ width:320, flexShrink:0, background:'var(--surface)',
            border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'18px',
            position:'sticky', top:24 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12, paddingBottom:12, borderBottom:'1px solid var(--border)' }}>
              <div>
                <div style={{ fontFamily:'var(--font-mono)', color:'var(--accent)', fontWeight:700, fontSize:14 }}>{selected.ticker}</div>
                <div style={{ fontSize:14, fontWeight:600, marginTop:2 }}>{selected.name}</div>
                <div style={{ display:'flex', gap:6, marginTop:6 }}>
                  <SectorBadge sector={selected.sector}/>
                  {co && <ScoreBadge score={co.score}/>}
                </div>
                {pr && <div style={{ marginTop:8, fontFamily:'var(--font-mono)', fontSize:20, fontWeight:700 }}>${pr.price.toFixed(2)} <PriceChange change={pr.change} pct={pr.changePct}/></div>}
              </div>
              <button onClick={() => setSelected(null)} style={{ background:'none', color:'var(--muted)', fontSize:20 }}>×</button>
            </div>
            {co && (
              <div style={{ marginBottom:14, paddingBottom:12, borderBottom:'1px solid var(--border)' }}>
                <div style={{ fontSize:9, color:'var(--muted)', fontFamily:'var(--font-mono)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:8 }}>7-Metric Snapshot</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                  {[{key:'roic',label:'ROIC-WACC',suffix:'%'},{key:'fcf',label:'FCF Yield',suffix:'%'},
                    {key:'evebitda',label:'EV/EBITDA',suffix:'×'},{key:'oplev',label:'Op.Lev',suffix:'pp'},
                    {key:'revpemp',label:'Rev/Emp Δ',suffix:'%'},{key:'debt',label:'Debt/EBITDA',suffix:'×'},
                    {key:'peg',label:'PEG',suffix:''}].map(m => (
                    <div key={m.key} style={{ background:'var(--bg)', borderRadius:6, padding:'7px 9px' }}>
                      <div style={{ fontSize:9, color:'var(--muted)', fontFamily:'var(--font-mono)', marginBottom:2 }}>{m.label}</div>
                      <MetricCell value={co[m.key]} metric={m.key} suffix={m.suffix}/>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div>
              <div style={{ fontSize:9, color:'var(--muted)', fontFamily:'var(--font-mono)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>Research Notes</div>
              <textarea value={note} onChange={e => setNote(e.target.value)}
                placeholder="Add your investment thesis, key risks, price targets…"
                style={{ width:'100%', background:'var(--surface2)', border:'1px solid var(--border2)',
                  color:'var(--text)', padding:'9px 11px', borderRadius:'var(--radius)',
                  fontSize:12, resize:'vertical', minHeight:110, outline:'none',
                  fontFamily:'var(--font-body)', lineHeight:1.6 }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border2)'}/>
              <button onClick={saveNote} disabled={noteSaving}
                style={{ marginTop:7, padding:'8px 0', width:'100%',
                  background: noteSaved ? 'var(--green-dim)' : 'var(--accent-dim)',
                  border: `1px solid ${noteSaved ? 'rgba(32,200,120,0.3)' : 'var(--accent-border)'}`,
                  color: noteSaved ? 'var(--green)' : 'var(--accent)',
                  borderRadius:'var(--radius)', fontSize:12, fontWeight:600 }}>
                {noteSaving ? 'Saving…' : noteSaved ? '✓ Saved' : 'Save Note'}
              </button>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

// ─── Tab: Portfolio ────────────────────────────────────────────────────────────
function PortfolioTab({ user, prices, fetchPrices }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ ticker:'', shares:'', purchase_price:'', tracking_price:'', owned:true })
  const [adding, setAdding] = useState(false)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    if (!user) return
    getPortfolio(user.id).then(({ data }) => {
      setRows(data || [])
      setLoading(false)
      const tickers = (data || []).map(r => r.ticker)
      if (tickers.length) fetchPrices(tickers)
    })
  }, [user])

  const saveRow = async () => {
    if (!form.ticker) return
    setAdding(true)
    await upsertPortfolio(user.id, {
      ticker: form.ticker.toUpperCase(),
      shares: parseFloat(form.shares) || null,
      purchase_price: parseFloat(form.purchase_price) || null,
      tracking_price: parseFloat(form.tracking_price) || null,
      owned: form.owned,
    })
    const { data } = await getPortfolio(user.id)
    setRows(data || [])
    setForm({ ticker:'', shares:'', purchase_price:'', tracking_price:'', owned:true })
    setShowForm(false); setAdding(false)
    if (form.ticker) fetchPrices([form.ticker.toUpperCase()])
  }

  const remove = async (ticker) => {
    await deletePortfolio(user.id, ticker)
    setRows(prev => prev.filter(r => r.ticker !== ticker))
  }

  const totalValue = rows.reduce((sum, r) => {
    const pr = prices[r.ticker]
    return sum + (pr && r.shares ? pr.price * r.shares : 0)
  }, 0)

  const totalCost = rows.reduce((sum, r) =>
    sum + (r.shares && r.purchase_price ? r.shares * r.purchase_price : 0), 0)

  const totalPnl = totalValue - totalCost

  return (
    <div style={{ padding:'20px 24px' }}>
      {/* Summary header */}
      {rows.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:16 }}>
          {[
            { label:'Market value', value: totalValue > 0 ? `$${totalValue.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}` : '—' },
            { label:'Total cost', value: totalCost > 0 ? `$${totalCost.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}` : '—' },
            { label:'Unrealised P&L', value: totalCost > 0 && totalValue > 0 ? `${totalPnl >= 0 ? '+' : ''}$${totalPnl.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}` : '—',
              color: totalPnl > 0 ? 'var(--green)' : totalPnl < 0 ? 'var(--red)' : undefined },
          ].map(s => (
            <div key={s.label} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'11px 14px' }}>
              <div style={{ fontSize:10, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:4 }}>{s.label}</div>
              <div style={{ fontSize:18, fontWeight:700, fontFamily:'var(--font-mono)', color: s.color || 'var(--text)' }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      {showForm ? (
        <div style={{ background:'var(--surface)', border:'1px solid var(--accent-border)', borderRadius:'var(--radius-lg)', padding:'16px', marginBottom:16 }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr) auto', gap:8, alignItems:'flex-end' }}>
            {[
              { label:'Ticker', field:'ticker', placeholder:'EOG', mono:true },
              { label:'Shares', field:'shares', placeholder:'100', mono:true },
              { label:'Avg cost ($)', field:'purchase_price', placeholder:'140.00', mono:true },
              { label:'Tracking price ($)', field:'tracking_price', placeholder:'optional', mono:true },
            ].map(f => (
              <div key={f.field}>
                <div style={{ fontSize:9, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:5 }}>{f.label}</div>
                <input value={form[f.field]} onChange={e => setForm(p => ({...p, [f.field]: e.target.value}))}
                  placeholder={f.placeholder}
                  style={{ width:'100%', background:'var(--surface2)', border:'1px solid var(--border)',
                    borderRadius:'var(--radius)', color:'var(--text)', padding:'7px 10px', fontSize:12,
                    fontFamily: f.mono ? 'var(--font-mono)' : undefined }}/>
              </div>
            ))}
            <div style={{ display:'flex', gap:6 }}>
              <button onClick={saveRow} disabled={adding}
                style={{ padding:'7px 14px', background:'var(--accent)', color:'#fff', border:'none',
                  borderRadius:'var(--radius)', fontSize:12, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' }}>
                {adding ? '…' : 'Save'}
              </button>
              <button onClick={() => setShowForm(false)}
                style={{ padding:'7px 10px', background:'none', border:'1px solid var(--border)',
                  color:'var(--muted)', borderRadius:'var(--radius)', fontSize:12, cursor:'pointer' }}>✕</button>
            </div>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowForm(true)}
          style={{ marginBottom:14, padding:'7px 16px', background:'var(--surface)', border:'1px solid var(--border)',
            color:'var(--text2)', borderRadius:'var(--radius)', fontSize:12, fontWeight:500, cursor:'pointer' }}>
          + Add position
        </button>
      )}

      {/* Table */}
      {loading ? (
        <div style={{ color:'var(--muted)', fontFamily:'var(--font-mono)', fontSize:12, padding:20 }}>Loading…</div>
      ) : rows.length === 0 ? (
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)',
          padding:40, textAlign:'center', color:'var(--muted)' }}>
          <div style={{ fontSize:28, marginBottom:10 }}>◆</div>
          <div style={{ fontSize:13 }}>No positions tracked yet</div>
          <div style={{ fontSize:11, marginTop:6 }}>This is research mode — no real financial data needed</div>
        </div>
      ) : (
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead>
              <tr style={{ background:'var(--surface2)' }}>
                {['Ticker','Company','Shares','Avg cost','Current','Value','P&L',''].map(h => (
                  <th key={h} style={{ padding:'8px 12px', textAlign: h === '' ? 'center' : h === 'Shares' || h === 'Avg cost' || h === 'Current' || h === 'Value' || h === 'P&L' ? 'right' : 'left',
                    fontSize:9, color:'var(--muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const pr = prices[row.ticker]
                const co = getCo(row.ticker)
                const value = pr && row.shares ? pr.price * row.shares : null
                const cost = row.shares && row.purchase_price ? row.shares * row.purchase_price : null
                const pnl = value && cost ? value - cost : null
                const pnlPct = pnl && cost ? (pnl / cost * 100) : null
                return (
                  <tr key={row.ticker} style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                    <td style={{ padding:'10px 12px', fontFamily:'var(--font-mono)', color:'var(--accent)', fontWeight:700 }}>{row.ticker}</td>
                    <td style={{ padding:'10px 12px', color:'var(--text2)' }}>{co?.name || row.ticker}</td>
                    <td style={{ padding:'10px 12px', textAlign:'right', fontFamily:'var(--font-mono)' }}>{row.shares || '—'}</td>
                    <td style={{ padding:'10px 12px', textAlign:'right', fontFamily:'var(--font-mono)' }}>{row.purchase_price ? `$${parseFloat(row.purchase_price).toFixed(2)}` : '—'}</td>
                    <td style={{ padding:'10px 12px', textAlign:'right', fontFamily:'var(--font-mono)' }}>{pr ? `$${pr.price.toFixed(2)}` : '—'}</td>
                    <td style={{ padding:'10px 12px', textAlign:'right', fontFamily:'var(--font-mono)', fontWeight:600 }}>{value ? `$${value.toLocaleString('en-US', {maximumFractionDigits:0})}` : '—'}</td>
                    <td style={{ padding:'10px 12px', textAlign:'right', fontFamily:'var(--font-mono)',
                      color: pnl > 0 ? 'var(--green)' : pnl < 0 ? 'var(--red)' : 'var(--muted)' }}>
                      {pnl != null ? `${pnl >= 0 ? '+' : ''}$${Math.abs(pnl).toLocaleString('en-US', {maximumFractionDigits:0})} (${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(1)}%)` : '—'}
                    </td>
                    <td style={{ padding:'10px 12px', textAlign:'center' }}>
                      <button onClick={() => remove(row.ticker)}
                        style={{ background:'none', color:'var(--muted)', fontSize:16 }}
                        onMouseEnter={e => e.target.style.color = 'var(--red)'}
                        onMouseLeave={e => e.target.style.color = 'var(--muted)'}>×</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Tab: Alerts ───────────────────────────────────────────────────────────────
function AlertsTab({ user, prices, fetchPrices }) {
  const [alerts, setAlerts] = useState([])
  const [watchlist, setWatchlist] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ ticker:'', type:'below', price:'' })
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) return
    Promise.all([getAlerts(user.id), getWatchlist(user.id)]).then(([{ data: a }, { data: w }]) => {
      setAlerts(a || []); setWatchlist(w || []); setLoading(false)
      if (w?.length) fetchPrices(w.map(d => d.ticker))
    })
  }, [user])

  useEffect(() => {
    alerts.forEach(async alert => {
      if (alert.triggered) return
      const pr = prices[alert.ticker]
      if (!pr) return
      const hit = (alert.type === 'above' && pr.price >= alert.target_price) ||
                  (alert.type === 'below' && pr.price <= alert.target_price)
      if (hit) {
        await markAlertTriggered(alert.id)
        setAlerts(prev => prev.map(a => a.id === alert.id ? {...a, triggered:true} : a))
      }
    })
  }, [prices, alerts])

  const handleAdd = async (e) => {
    e.preventDefault(); setError(null)
    if (!form.ticker || !form.price) return setError('Please fill all fields')
    const price = parseFloat(form.price)
    if (isNaN(price) || price <= 0) return setError('Invalid price')
    setAdding(true)
    const { data, error: err } = await addAlert(user.id, form.ticker.toUpperCase(), form.type, price)
    setAdding(false)
    if (err) return setError(err.message)
    setAlerts(prev => [data[0], ...prev])
    setForm({ ticker:'', type:'below', price:'' })
    fetchPrices([form.ticker.toUpperCase()])
  }

  const active = alerts.filter(a => !a.triggered)
  const triggered = alerts.filter(a => a.triggered)

  return (
    <div style={{ padding:'20px 24px', maxWidth:760 }}>
      {/* Add form */}
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)',
        borderRadius:'var(--radius-lg)', padding:'16px', marginBottom:20 }}>
        <div style={{ fontSize:10, color:'var(--muted)', fontFamily:'var(--font-mono)',
          textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:12 }}>New Alert</div>
        <form onSubmit={handleAdd} style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'flex-end' }}>
          {[
            { label:'Ticker', children: <input value={form.ticker} onChange={e => setForm(f => ({...f, ticker:e.target.value.toUpperCase()}))} placeholder="e.g. JPM" list="wl-tickers" style={{ width:100, background:'var(--surface2)', border:'1px solid var(--border2)', color:'var(--text)', padding:'7px 10px', borderRadius:'var(--radius)', fontSize:12, fontFamily:'var(--font-mono)' }}/> },
            { label:'When price', children: <select value={form.type} onChange={e => setForm(f => ({...f, type:e.target.value}))} style={{ width:130, background:'var(--surface2)', border:'1px solid var(--border2)', color:'var(--text)', padding:'7px 10px', borderRadius:'var(--radius)', fontSize:12 }}><option value="below">Falls below</option><option value="above">Rises above</option></select> },
            { label:'Target price ($)', children: <input type="number" min="0.01" step="0.01" value={form.price} onChange={e => setForm(f => ({...f, price:e.target.value}))} placeholder="0.00" style={{ width:110, background:'var(--surface2)', border:'1px solid var(--border2)', color:'var(--text)', padding:'7px 10px', borderRadius:'var(--radius)', fontSize:12, fontFamily:'var(--font-mono)' }}/> },
          ].map(({ label, children }) => (
            <div key={label}><div style={{ fontSize:9, color:'var(--muted)', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.5px' }}>{label}</div>{children}</div>
          ))}
          <button type="submit" disabled={adding}
            style={{ padding:'7px 16px', background:'var(--accent)', color:'#fff', border:'none',
              borderRadius:'var(--radius)', fontSize:12, fontWeight:600, cursor:'pointer' }}>
            {adding ? 'Adding…' : '+ Add'}
          </button>
          <datalist id="wl-tickers">{watchlist.map(w => <option key={w.ticker} value={w.ticker}/>)}</datalist>
        </form>
        {error && <div style={{ marginTop:8, color:'var(--red)', fontSize:11, fontFamily:'var(--font-mono)' }}>{error}</div>}
      </div>

      {/* Active */}
      <div style={{ fontSize:10, color:'var(--muted)', fontFamily:'var(--font-mono)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:10 }}>Active ({active.length})</div>
      {loading ? (
        <div style={{ color:'var(--muted)', fontSize:12, fontFamily:'var(--font-mono)' }}>Loading…</div>
      ) : active.length === 0 ? (
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:24, textAlign:'center', color:'var(--muted)', fontSize:13, marginBottom:16 }}>No active alerts.</div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:20 }}>
          {active.map(alert => {
            const pr = prices[alert.ticker]
            const diff = pr ? ((pr.price - alert.target_price) / alert.target_price * 100) : null
            return (
              <div key={alert.id} style={{ background:'var(--surface)', border:'1px solid var(--border)',
                borderRadius:'var(--radius-lg)', padding:'12px 14px', display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:2 }}>
                    <span style={{ fontFamily:'var(--font-mono)', color:'var(--accent)', fontWeight:700, fontSize:13 }}>{alert.ticker}</span>
                    <span style={{ fontSize:11, color:'var(--text2)' }}>{getCo(alert.ticker)?.name || alert.ticker}</span>
                  </div>
                  <div style={{ fontSize:11, color:'var(--text2)', fontFamily:'var(--font-mono)' }}>
                    {alert.type === 'above' ? '▲ rises above' : '▼ falls below'} <span style={{ color:'var(--text)', fontWeight:600 }}>${parseFloat(alert.target_price).toFixed(2)}</span>
                  </div>
                </div>
                {pr && (
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontFamily:'var(--font-mono)', fontSize:14, fontWeight:600 }}>${pr.price.toFixed(2)}</div>
                    <div style={{ fontSize:10, fontFamily:'var(--font-mono)', color: diff >= 0 ? 'var(--green)' : 'var(--red)' }}>
                      {diff != null ? `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}% from target` : ''}
                    </div>
                  </div>
                )}
                <button onClick={() => { deleteAlert(alert.id); setAlerts(prev => prev.filter(a => a.id !== alert.id)) }}
                  style={{ background:'none', color:'var(--muted)', fontSize:18, flexShrink:0 }}
                  onMouseEnter={e => e.target.style.color = 'var(--red)'}
                  onMouseLeave={e => e.target.style.color = 'var(--muted)'}>×</button>
              </div>
            )
          })}
        </div>
      )}

      {/* Triggered */}
      {triggered.length > 0 && (
        <>
          <div style={{ fontSize:10, color:'var(--muted)', fontFamily:'var(--font-mono)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:10 }}>Triggered ({triggered.length})</div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {triggered.map(a => (
              <div key={a.id} style={{ background:'var(--surface)', border:'1px solid rgba(32,200,120,0.25)',
                borderRadius:'var(--radius-lg)', padding:'10px 14px', display:'flex', alignItems:'center', gap:10, opacity:0.75 }}>
                <span style={{ color:'var(--green)' }}>✓</span>
                <span style={{ fontFamily:'var(--font-mono)', color:'var(--accent)', fontWeight:700, fontSize:12 }}>{a.ticker}</span>
                <span style={{ fontSize:11, color:'var(--text2)', fontFamily:'var(--font-mono)', flex:1 }}>
                  {a.type === 'above' ? 'rose above' : 'fell below'} ${parseFloat(a.target_price).toFixed(2)}
                </span>
                <span style={{ fontSize:10, color:'var(--green)', fontFamily:'var(--font-mono)' }}>TRIGGERED</span>
                <button onClick={() => { deleteAlert(a.id); setAlerts(prev => prev.filter(x => x.id !== a.id)) }}
                  style={{ background:'none', color:'var(--muted)', fontSize:16 }}>×</button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Tab: News ─────────────────────────────────────────────────────────────────
function NewsTab({ user }) {
  const [news, setNews] = useState([])
  const [watchlist, setWatchlist] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('')
  const [activeTicker, setActiveTicker] = useState('all')

  const fetchNews = useCallback(async (tickers) => {
    setLoading(true); setError(null)
    try {
      const q = tickers.length ? tickers.slice(0, 6).join('+') : 'stock+market+investing'
      const url = `${PROXY}${encodeURIComponent(`https://query1.finance.yahoo.com/v1/finance/search?q=${q}&newsCount=25&quotesCount=0`)}`
      const res = await fetch(url)
      const outer = await res.json()
      const data = JSON.parse(outer.contents)
      const articles = data?.news || []
      if (!articles.length) throw new Error('No articles')
      setNews(articles.map(a => ({
        uuid:a.uuid, title:a.title, link:a.link, publisher:a.publisher,
        time:a.providerPublishTime, thumbnail:a.thumbnail?.resolutions?.[0]?.url||null,
        tickers:a.relatedTickers||[],
      })))
    } catch {
      try {
        const rssUrl = `${PROXY}${encodeURIComponent('https://feeds.finance.yahoo.com/rss/2.0/headline?s=SPY,QQQ&region=US&lang=en-US')}`
        const res = await fetch(rssUrl); const outer = await res.json()
        const xml = new DOMParser().parseFromString(outer.contents, 'text/xml')
        setNews(Array.from(xml.querySelectorAll('item')).slice(0, 20).map(item => ({
          uuid:item.querySelector('guid')?.textContent, title:item.querySelector('title')?.textContent,
          link:item.querySelector('link')?.textContent, publisher:'Yahoo Finance',
          time:Math.floor(new Date(item.querySelector('pubDate')?.textContent).getTime()/1000),
          thumbnail:null, tickers:[],
        })))
      } catch { setError('Unable to load news — Yahoo Finance may be temporarily unavailable.') }
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!user) return
    getWatchlist(user.id).then(({ data }) => {
      setWatchlist(data || [])
      fetchNews((data || []).map(d => d.ticker))
    })
  }, [user])

  const timeLabel = (ts) => {
    if (!ts) return ''
    const diff = Math.floor((Date.now() - ts * 1000) / 60000)
    if (diff < 60) return `${diff}m ago`
    if (diff < 1440) return `${Math.floor(diff/60)}h ago`
    return new Date(ts * 1000).toLocaleDateString('en-US', { month:'short', day:'numeric' })
  }

  const allTickers = ['all', ...new Set(news.flatMap(n => n.tickers).slice(0, 12))]
  const filtered = news.filter(n => {
    if (activeTicker !== 'all' && !n.tickers.includes(activeTicker)) return false
    if (filter && !n.title.toLowerCase().includes(filter.toLowerCase())) return false
    return true
  })

  return (
    <div style={{ padding:'20px 24px' }}>
      <div style={{ display:'flex', gap:8, marginBottom:14, alignItems:'center', flexWrap:'wrap' }}>
        <input placeholder="Filter headlines…" value={filter} onChange={e => setFilter(e.target.value)}
          style={{ background:'var(--surface)', border:'1px solid var(--border2)', color:'var(--text)',
            padding:'6px 12px', borderRadius:'var(--radius)', fontSize:12, outline:'none', width:180 }}/>
        <button onClick={() => fetchNews(watchlist.map(w => w.ticker))}
          style={{ padding:'6px 12px', background:'var(--surface)', border:'1px solid var(--border)',
            color:'var(--text2)', borderRadius:'var(--radius)', fontSize:12, cursor:'pointer' }}>↻ Refresh</button>
        {allTickers.map(t => (
          <button key={t} onClick={() => setActiveTicker(t)}
            style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontFamily:'var(--font-mono)', fontWeight:600,
              background: activeTicker===t ? 'var(--accent)' : 'var(--surface)',
              color: activeTicker===t ? '#fff' : 'var(--text2)',
              border: `1px solid ${activeTicker===t ? 'var(--accent)' : 'var(--border2)'}`, cursor:'pointer' }}>
            {t === 'all' ? 'All' : t}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ color:'var(--muted)', fontFamily:'var(--font-mono)', fontSize:12, padding:20 }}>Loading news…</div>
      ) : error ? (
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:32, textAlign:'center' }}>
          <div style={{ color:'var(--text2)', marginBottom:10 }}>{error}</div>
          <button onClick={() => fetchNews(watchlist.map(w => w.ticker))}
            style={{ padding:'7px 14px', background:'var(--accent-dim)', border:'1px solid var(--accent-border)', color:'var(--accent)', borderRadius:'var(--radius)', fontSize:12, fontWeight:600, cursor:'pointer' }}>Try again</button>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:1, background:'var(--border)', borderRadius:'var(--radius-lg)', overflow:'hidden', border:'1px solid var(--border)' }}>
          {filtered.map((a, i) => (
            <a key={a.uuid||i} href={a.link} target="_blank" rel="noopener noreferrer"
              style={{ display:'flex', gap:12, padding:'12px 16px', background:'var(--surface)', textDecoration:'none', color:'inherit' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--surface)'}>
              {a.thumbnail && <img src={a.thumbnail} alt="" onError={e => e.target.style.display='none'}
                style={{ width:72, height:48, objectFit:'cover', borderRadius:5, flexShrink:0, background:'var(--surface2)' }}/>}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, lineHeight:1.4, marginBottom:5,
                  display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{a.title}</div>
                <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                  <span style={{ fontSize:10, color:'var(--muted)', fontFamily:'var(--font-mono)' }}>{a.publisher}</span>
                  {a.time && <span style={{ fontSize:10, color:'var(--muted)' }}>· {timeLabel(a.time)}</span>}
                  {a.tickers?.slice(0,4).map(t => (
                    <span key={t} style={{ fontSize:9, background:'var(--accent-dim)', color:'var(--accent)',
                      padding:'1px 6px', borderRadius:3, fontFamily:'var(--font-mono)', fontWeight:600 }}>{t}</span>
                  ))}
                </div>
              </div>
              <div style={{ color:'var(--muted)', fontSize:13, flexShrink:0, alignSelf:'center' }}>↗</div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function MyWatchlist() {
  const { user } = useAuth()
  const { prices, fetchPrices } = useMarketData()
  const [activeTab, setActiveTab] = useState('watchlist')

  const TABS = [
    { id:'watchlist', label:'★ Watchlist' },
    { id:'portfolio', label:'◆ Portfolio' },
    { id:'alerts',    label:'◉ Alerts' },
    { id:'news',      label:'◎ News' },
  ]

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', flexDirection:'column' }}>
      {/* Header */}
      <div style={{ padding:'13px 24px 0', borderBottom:'1px solid var(--border)', background:'var(--surface)', flexShrink:0 }}>
        <div style={{ marginBottom:10 }}>
          <span style={{ fontFamily:'var(--font-display)', fontSize:20 }}>My Watchlist</span>
          <span style={{ fontSize:11, color:'var(--muted)', marginLeft:12 }}>Personal research workspace</span>
        </div>
        <div style={{ display:'flex' }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ padding:'9px 14px', background:'none', border:'none', flexShrink:0,
                borderBottom: activeTab===tab.id ? '2px solid var(--accent)' : '2px solid transparent',
                color: activeTab===tab.id ? 'var(--accent)' : 'var(--text2)',
                fontSize:12, fontWeight:600, cursor:'pointer', marginBottom:-1 }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ flex:1, overflowY:'auto' }}>
        {activeTab === 'watchlist' && <WatchlistTab user={user} prices={prices} fetchPrices={fetchPrices}/>}
        {activeTab === 'portfolio' && <PortfolioTab user={user} prices={prices} fetchPrices={fetchPrices}/>}
        {activeTab === 'alerts'    && <AlertsTab    user={user} prices={prices} fetchPrices={fetchPrices}/>}
        {activeTab === 'news'      && <NewsTab      user={user}/>}
      </div>
    </div>
  )
}
