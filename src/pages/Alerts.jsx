import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth.jsx'
import { useMarketData } from '../hooks/useMarketData'
import { getAlerts, addAlert, deleteAlert, markAlertTriggered, getWatchlist } from '../lib/supabase'
import { COMPANIES_SCORED } from '../lib/data'

export default function Alerts() {
  const { user } = useAuth()
  const { prices, fetchPrices } = useMarketData()
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [watchlist, setWatchlist] = useState([])
  const [form, setForm] = useState({ ticker:'', type:'below', price:'' })
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState(null)

  const load = async () => {
    if (!user) return
    setLoading(true)
    const [{ data: alertData }, { data: wlData }] = await Promise.all([
      getAlerts(user.id),
      getWatchlist(user.id),
    ])
    setAlerts(alertData || [])
    const tickers = (wlData || []).map(d => d.ticker)
    setWatchlist(wlData || [])
    if (tickers.length) fetchPrices(tickers)
    setLoading(false)
  }

  useEffect(() => { load() }, [user])

  // Check alert triggers
  useEffect(() => {
    alerts.forEach(async alert => {
      if (alert.triggered) return
      const pr = prices[alert.ticker]
      if (!pr) return
      const triggered =
        (alert.type === 'above' && pr.price >= alert.target_price) ||
        (alert.type === 'below' && pr.price <= alert.target_price)
      if (triggered) {
        await markAlertTriggered(alert.id)
        setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, triggered: true } : a))
      }
    })
  }, [prices, alerts])

  const handleAdd = async (e) => {
    e.preventDefault()
    setError(null)
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

  const handleDelete = async (id) => {
    await deleteAlert(id)
    setAlerts(prev => prev.filter(a => a.id !== id))
  }

  const getCompanyName = (ticker) => {
    const co = COMPANIES_SCORED.find(c => c.ticker === ticker)
    return co?.name || ticker
  }

  const active = alerts.filter(a => !a.triggered)
  const triggered = alerts.filter(a => a.triggered)

  return (
    <div style={{ padding:'24px', maxWidth:800 }}>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:26 }}>Price Alerts</h1>
        <p style={{ color:'var(--text2)', fontSize:13, marginTop:3 }}>
          Set price thresholds — alerts check against live prices when you open the app
        </p>
      </div>

      {/* Add Alert Form */}
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)',
        borderRadius:'var(--radius-lg)', padding:'20px', marginBottom:24 }}>
        <div style={{ fontSize:12, color:'var(--text2)', fontWeight:600, marginBottom:14,
          textTransform:'uppercase', letterSpacing:'0.5px', fontFamily:'var(--font-mono)' }}>
          New Alert
        </div>
        <form onSubmit={handleAdd} style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'flex-end' }}>
          <div>
            <label style={{ display:'block', fontSize:11, color:'var(--muted)', marginBottom:5 }}>Ticker</label>
            <input
              value={form.ticker} onChange={e=>setForm(f=>({...f, ticker:e.target.value.toUpperCase()}))}
              placeholder="e.g. JPM" list="watchlist-tickers"
              style={{ width:120, background:'var(--surface2)', border:'1px solid var(--border2)',
                color:'var(--text)', padding:'8px 12px', borderRadius:'var(--radius)',
                fontSize:13, outline:'none', fontFamily:'var(--font-mono)' }}
            />
            <datalist id="watchlist-tickers">
              {watchlist.map(w => <option key={w.ticker} value={w.ticker}>{w.name}</option>)}
            </datalist>
          </div>
          <div>
            <label style={{ display:'block', fontSize:11, color:'var(--muted)', marginBottom:5 }}>Alert when price</label>
            <select value={form.type} onChange={e=>setForm(f=>({...f, type:e.target.value}))}
              style={{ width:140, background:'var(--surface2)', border:'1px solid var(--border2)',
                color:'var(--text)', padding:'8px 10px', borderRadius:'var(--radius)', fontSize:13, outline:'none' }}>
              <option value='below'>Falls below</option>
              <option value='above'>Rises above</option>
            </select>
          </div>
          <div>
            <label style={{ display:'block', fontSize:11, color:'var(--muted)', marginBottom:5 }}>Target price ($)</label>
            <input type="number" min="0.01" step="0.01"
              value={form.price} onChange={e=>setForm(f=>({...f, price:e.target.value}))}
              placeholder="0.00"
              style={{ width:120, background:'var(--surface2)', border:'1px solid var(--border2)',
                color:'var(--text)', padding:'8px 12px', borderRadius:'var(--radius)',
                fontSize:13, outline:'none', fontFamily:'var(--font-mono)' }}
            />
          </div>
          <button type="submit" disabled={adding}
            style={{ padding:'8px 18px', background:'var(--accent)', color:'#fff',
              borderRadius:'var(--radius)', fontSize:13, fontWeight:600,
              opacity: adding ? 0.6 : 1 }}>
            {adding ? 'Adding…' : '+ Add Alert'}
          </button>
        </form>
        {error && (
          <div style={{ marginTop:10, color:'var(--red)', fontSize:12, fontFamily:'var(--font-mono)' }}>{error}</div>
        )}
      </div>

      {/* Active Alerts */}
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:12, color:'var(--text2)', fontWeight:600, marginBottom:12,
          textTransform:'uppercase', letterSpacing:'0.5px', fontFamily:'var(--font-mono)' }}>
          Active Alerts ({active.length})
        </div>
        {loading ? (
          <div style={{ color:'var(--muted)', fontFamily:'var(--font-mono)', fontSize:12 }}>Loading…</div>
        ) : active.length === 0 ? (
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)',
            padding:24, textAlign:'center', color:'var(--muted)', fontSize:13 }}>
            No active alerts. Add one above.
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {active.map(alert => {
              const pr = prices[alert.ticker]
              const priceDiff = pr ? ((pr.price - alert.target_price) / alert.target_price * 100) : null
              return (
                <div key={alert.id} style={{ background:'var(--surface)', border:'1px solid var(--border)',
                  borderRadius:'var(--radius-lg)', padding:'14px 16px',
                  display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                      <span style={{ fontFamily:'var(--font-mono)', color:'var(--accent)', fontWeight:700, fontSize:13 }}>
                        {alert.ticker}
                      </span>
                      <span style={{ fontSize:11, color:'var(--text2)' }}>{getCompanyName(alert.ticker)}</span>
                    </div>
                    <div style={{ fontSize:12, color:'var(--text2)', fontFamily:'var(--font-mono)' }}>
                      Alert when price {alert.type === 'above' ? '▲ rises above' : '▼ falls below'}{' '}
                      <span style={{ color:'var(--text)', fontWeight:600 }}>${parseFloat(alert.target_price).toFixed(2)}</span>
                    </div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    {pr && (
                      <div>
                        <div style={{ fontFamily:'var(--font-mono)', fontSize:14, fontWeight:600 }}>
                          ${pr.price.toFixed(2)}
                        </div>
                        <div style={{ fontSize:11, fontFamily:'var(--font-mono)',
                          color: priceDiff !== null ? (priceDiff >= 0 ? 'var(--green)' : 'var(--red)') : 'var(--muted)' }}>
                          {priceDiff !== null ? `${priceDiff >= 0 ? '+' : ''}${priceDiff.toFixed(1)}% from target` : 'Price unavailable'}
                        </div>
                      </div>
                    )}
                  </div>
                  <button onClick={()=>handleDelete(alert.id)}
                    style={{ background:'none', color:'var(--muted)', fontSize:18, padding:'0 4px',
                      flexShrink:0, transition:'color 0.15s' }}
                    onMouseEnter={e=>e.target.style.color='var(--red)'}
                    onMouseLeave={e=>e.target.style.color='var(--muted)'}>×</button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Triggered Alerts */}
      {triggered.length > 0 && (
        <div>
          <div style={{ fontSize:12, color:'var(--text2)', fontWeight:600, marginBottom:12,
            textTransform:'uppercase', letterSpacing:'0.5px', fontFamily:'var(--font-mono)' }}>
            Triggered ({triggered.length})
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {triggered.map(alert => (
              <div key={alert.id} style={{ background:'var(--surface)', border:'1px solid rgba(32,200,120,0.3)',
                borderRadius:'var(--radius-lg)', padding:'12px 16px',
                display:'flex', alignItems:'center', gap:12, opacity:0.7 }}>
                <span style={{ fontSize:16 }}>✓</span>
                <div style={{ flex:1 }}>
                  <span style={{ fontFamily:'var(--font-mono)', color:'var(--accent)', fontWeight:700, fontSize:12, marginRight:8 }}>
                    {alert.ticker}
                  </span>
                  <span style={{ fontSize:12, color:'var(--text2)', fontFamily:'var(--font-mono)' }}>
                    {alert.type === 'above' ? 'rose above' : 'fell below'} ${parseFloat(alert.target_price).toFixed(2)}
                  </span>
                </div>
                <span style={{ fontSize:11, color:'var(--green)', fontFamily:'var(--font-mono)' }}>TRIGGERED</span>
                <button onClick={()=>handleDelete(alert.id)}
                  style={{ background:'none', color:'var(--muted)', fontSize:16 }}>×</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
