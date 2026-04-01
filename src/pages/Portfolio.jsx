import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth.jsx'
import { useMarketData } from '../hooks/useMarketData'
import { COMPANIES_SCORED } from '../lib/data'
import { supabase } from '../lib/supabase'
import { SectorBadge, ScoreBadge } from '../components/Badges'

// ─── Supabase helpers ────────────────────────────────────────────────────────
async function getPortfolio(userId) {
  const { data, error } = await supabase
    .from('portfolio')
    .select('*')
    .eq('user_id', userId)
    .order('ticker')
  return { data, error }
}

async function upsertPortfolio(userId, row) {
  const { data, error } = await supabase
    .from('portfolio')
    .upsert({ user_id: userId, ...row }, { onConflict: 'user_id,ticker' })
    .select()
  return { data, error }
}

async function deletePortfolio(userId, ticker) {
  const { error } = await supabase.from('portfolio').delete()
    .eq('user_id', userId).eq('ticker', ticker)
  return { error }
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function Portfolio() {
  const { user } = useAuth()
  const { prices, fetchPrices } = useMarketData()
  const [portfolio, setPortfolio] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null) // ticker being edited
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => { load() }, [user])

  const load = async () => {
    if (!user) return
    setLoading(true)
    const { data } = await getPortfolio(user.id)
    setPortfolio(data || [])
    setLoading(false)
    if (data?.length) fetchPrices(data.filter(r=>r.owned).map(r=>r.ticker))
  }

  const allCompanies = COMPANIES_SCORED.filter(c =>
    !search || c.ticker.toLowerCase().includes(search.toLowerCase()) ||
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  const getRow = (ticker) => portfolio.find(r => r.ticker === ticker)

  const startEdit = (c) => {
    const row = getRow(c.ticker) || {}
    setEditing(c.ticker)
    setForm({
      owned: row.owned || false,
      shares: row.shares || '',
      purchase_date: row.purchase_date || '',
      purchase_price: row.purchase_price || '',
      tracking_date: row.tracking_date || new Date().toISOString().split('T')[0],
      tracking_price: row.tracking_price || '',
    })
  }

  const save = async (ticker) => {
    if (!user) return
    setSaving(true)
    const payload = {
      ticker,
      owned: form.owned,
      shares: form.shares ? parseFloat(form.shares) : null,
      purchase_date: form.purchase_date || null,
      purchase_price: form.purchase_price ? parseFloat(form.purchase_price) : null,
      tracking_date: form.tracking_date || null,
      tracking_price: form.tracking_price ? parseFloat(form.tracking_price) : null,
    }
    await upsertPortfolio(user.id, payload)
    setSaving(false)
    setEditing(null)
    load()
  }

  const remove = async (ticker) => {
    await deletePortfolio(user.id, ticker)
    setPortfolio(prev => prev.filter(r => r.ticker !== ticker))
  }

  const pnl = (row) => {
    const pr = prices[row.ticker]
    if (!pr || !row.purchase_price || !row.shares) return null
    const cost = row.purchase_price * row.shares
    const current = pr.price * row.shares
    return { cost, current, gain: current - cost, pct: ((current - cost) / cost) * 100 }
  }

  const trackingPnl = (row) => {
    const pr = prices[row.ticker]
    if (!pr || !row.tracking_price) return null
    const gain = pr.price - row.tracking_price
    const pct = (gain / row.tracking_price) * 100
    return { gain, pct }
  }

  // Summary stats
  const ownedRows = portfolio.filter(r => r.owned)
  const totalCost = ownedRows.reduce((s, r) => {
    if (!r.purchase_price || !r.shares) return s
    return s + r.purchase_price * r.shares
  }, 0)
  const totalCurrent = ownedRows.reduce((s, r) => {
    const pr = prices[r.ticker]
    if (!pr || !r.shares) return s
    return s + pr.price * r.shares
  }, 0)
  const totalGain = totalCurrent - totalCost
  const totalPct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0

  return (
    <div style={{padding:'24px'}}>
      {/* Header */}
      <div style={{marginBottom:20}}>
        <h1 style={{fontFamily:'var(--font-display)', fontSize:26}}>Portfolio Tracker</h1>
        <p style={{color:'var(--text2)', fontSize:13, marginTop:3}}>
          Track your holdings, cost basis, and price baseline across 50 companies
        </p>
      </div>

      {/* Summary cards */}
      {ownedRows.length > 0 && (
        <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24}}>
          {[
            {label:'Positions', val:ownedRows.length, color:'var(--accent)'},
            {label:'Total Cost Basis', val:totalCost>0?`$${totalCost.toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:0})}`:'—', color:'var(--text)'},
            {label:'Current Value', val:totalCurrent>0?`$${totalCurrent.toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:0})}`:'—', color:'var(--text)'},
            {label:'Total P&L', val:totalCost>0?`${totalGain>=0?'+':''}$${totalGain.toFixed(0)} (${totalPct.toFixed(1)}%)`:'—',
              color:totalGain>=0?'var(--green)':'var(--red)'},
          ].map(c => (
            <div key={c.label} style={{background:'var(--surface)', border:'1px solid var(--border)',
              borderRadius:'var(--radius-lg)', padding:'14px 16px'}}>
              <div style={{fontSize:20, fontWeight:700, fontFamily:'var(--font-mono)', color:c.color, letterSpacing:'-0.5px'}}>{c.val}</div>
              <div style={{fontSize:10, color:'var(--muted)', marginTop:2, textTransform:'uppercase', letterSpacing:'0.4px'}}>{c.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Search + load prices */}
      <div style={{display:'flex', gap:10, marginBottom:16, alignItems:'center'}}>
        <input placeholder="Search company or ticker…" value={search} onChange={e=>setSearch(e.target.value)}
          style={{flex:1, maxWidth:260, background:'var(--surface)', border:'1px solid var(--border2)',
            color:'var(--text)', padding:'8px 12px', borderRadius:'var(--radius)', fontSize:13, outline:'none'}}/>
        <button onClick={()=>fetchPrices(ownedRows.map(r=>r.ticker))}
          style={{padding:'8px 14px', background:'var(--accent-dim)', border:'1px solid var(--accent-border)',
            color:'var(--accent)', borderRadius:'var(--radius)', fontSize:12, fontWeight:600}}>
          ↻ Refresh Prices
        </button>
      </div>

      {/* Table */}
      <div style={{background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', overflow:'hidden'}}>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%', borderCollapse:'collapse'}}>
            <thead>
              <tr style={{background:'var(--surface2)', borderBottom:'1px solid var(--border2)'}}>
                {['Ticker','Company','Sector','Score','Owned','Shares',
                  'Purchase Date','Purchase Price','Current Price','P&L',
                  'Tracking Since','Baseline Price','vs Baseline',''].map(h => (
                  <th key={h} style={{padding:'9px 12px', textAlign:'left', fontSize:9,
                    fontFamily:'var(--font-mono)', color:'var(--muted)',
                    textTransform:'uppercase', letterSpacing:'0.5px', whiteSpace:'nowrap'}}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allCompanies.map(c => {
                const row = getRow(c.ticker)
                const pr = prices[c.ticker]
                const pl = row ? pnl(row) : null
                const tpl = row ? trackingPnl(row) : null
                const isEditing = editing === c.ticker

                return (
                  <>
                    <tr key={c.ticker}
                      style={{borderBottom:'1px solid var(--border)',
                        background: isEditing ? 'var(--surface2)' : row?.owned ? 'rgba(91,138,240,0.03)' : 'transparent'}}>
                      <td style={{padding:'10px 12px', fontFamily:'var(--font-mono)', color:'var(--accent)', fontWeight:700, fontSize:12}}>{c.ticker}</td>
                      <td style={{padding:'10px 12px', fontSize:12, fontWeight:500, whiteSpace:'nowrap'}}>{c.name}</td>
                      <td style={{padding:'10px 12px'}}><SectorBadge sector={c.sector}/></td>
                      <td style={{padding:'10px 12px'}}><ScoreBadge score={c.score} size="sm"/></td>

                      {/* Owned checkmark */}
                      <td style={{padding:'10px 12px', textAlign:'center'}}>
                        <span style={{fontSize:16, color: row?.owned ? 'var(--green)' : 'var(--border2)'}}>
                          {row?.owned ? '✓' : '○'}
                        </span>
                      </td>

                      {/* Shares */}
                      <td style={{padding:'10px 12px', fontFamily:'var(--font-mono)', fontSize:12, color:'var(--text2)'}}>
                        {row?.shares || '—'}
                      </td>

                      {/* Purchase Date */}
                      <td style={{padding:'10px 12px', fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text2)', whiteSpace:'nowrap'}}>
                        {row?.purchase_date || '—'}
                      </td>

                      {/* Purchase Price */}
                      <td style={{padding:'10px 12px', fontFamily:'var(--font-mono)', fontSize:12, color:'var(--text2)'}}>
                        {row?.purchase_price ? `$${parseFloat(row.purchase_price).toFixed(2)}` : '—'}
                      </td>

                      {/* Current Price */}
                      <td style={{padding:'10px 12px', fontFamily:'var(--font-mono)', fontSize:12, fontWeight:600}}>
                        {pr ? `$${pr.price.toFixed(2)}` : '—'}
                      </td>

                      {/* P&L */}
                      <td style={{padding:'10px 12px', fontFamily:'var(--font-mono)', fontSize:12,
                        color: pl ? (pl.gain>=0?'var(--green)':'var(--red)') : 'var(--muted)'}}>
                        {pl ? `${pl.gain>=0?'+':''}$${pl.gain.toFixed(0)} (${pl.pct.toFixed(1)}%)` : '—'}
                      </td>

                      {/* Tracking Since */}
                      <td style={{padding:'10px 12px', fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text2)', whiteSpace:'nowrap'}}>
                        {row?.tracking_date || '—'}
                      </td>

                      {/* Baseline Price */}
                      <td style={{padding:'10px 12px', fontFamily:'var(--font-mono)', fontSize:12, color:'var(--text2)'}}>
                        {row?.tracking_price ? `$${parseFloat(row.tracking_price).toFixed(2)}` : '—'}
                      </td>

                      {/* vs Baseline */}
                      <td style={{padding:'10px 12px', fontFamily:'var(--font-mono)', fontSize:12,
                        color: tpl ? (tpl.gain>=0?'var(--green)':'var(--red)') : 'var(--muted)'}}>
                        {tpl ? `${tpl.pct>=0?'+':''}${tpl.pct.toFixed(1)}%` : '—'}
                      </td>

                      {/* Edit button */}
                      <td style={{padding:'10px 8px'}}>
                        <button onClick={()=>isEditing?setEditing(null):startEdit(c)}
                          style={{background: isEditing?'var(--surface3)':'var(--accent-dim)',
                            border:`1px solid ${isEditing?'var(--border2)':'var(--accent-border)'}`,
                            color: isEditing?'var(--text2)':'var(--accent)',
                            padding:'4px 10px', borderRadius:5, fontSize:11, fontWeight:600, whiteSpace:'nowrap'}}>
                          {isEditing ? 'Cancel' : row ? 'Edit' : '+ Add'}
                        </button>
                      </td>
                    </tr>

                    {/* Inline edit row */}
                    {isEditing && (
                      <tr key={`${c.ticker}-edit`} style={{background:'var(--surface2)', borderBottom:'2px solid var(--accent)'}}>
                        <td colSpan={14} style={{padding:'16px 20px'}}>
                          <div style={{display:'grid', gridTemplateColumns:'auto repeat(6,1fr) auto auto', gap:12, alignItems:'end'}}>
                            {/* Owned toggle */}
                            <div>
                              <div style={{fontSize:10, color:'var(--muted)', fontFamily:'var(--font-mono)', marginBottom:6, textTransform:'uppercase'}}>I own this</div>
                              <button onClick={()=>setForm(f=>({...f,owned:!f.owned}))}
                                style={{padding:'8px 14px', borderRadius:'var(--radius)', fontSize:12, fontWeight:600,
                                  background: form.owned?'rgba(32,200,120,0.15)':'var(--bg)',
                                  border:`1px solid ${form.owned?'rgba(32,200,120,0.4)':'var(--border2)'}`,
                                  color: form.owned?'var(--green)':'var(--text2)'}}>
                                {form.owned ? '✓ Yes' : '○ No'}
                              </button>
                            </div>

                            {/* Shares */}
                            <Field label="Shares" value={form.shares} type="number"
                              onChange={v=>setForm(f=>({...f,shares:v}))} placeholder="0"/>

                            {/* Purchase Date */}
                            <Field label="Purchase Date" value={form.purchase_date} type="date"
                              onChange={v=>setForm(f=>({...f,purchase_date:v}))}/>

                            {/* Purchase Price */}
                            <Field label="Purchase Price ($)" value={form.purchase_price} type="number"
                              onChange={v=>setForm(f=>({...f,purchase_price:v}))} placeholder="0.00"/>

                            {/* Tracking Since */}
                            <Field label="Tracking Since" value={form.tracking_date} type="date"
                              onChange={v=>setForm(f=>({...f,tracking_date:v}))}/>

                            {/* Baseline Price */}
                            <Field label="Baseline Price ($)" value={form.tracking_price} type="number"
                              onChange={v=>setForm(f=>({...f,tracking_price:v}))} placeholder="0.00"/>

                            {/* Save */}
                            <div style={{paddingBottom:0}}>
                              <button onClick={()=>save(c.ticker)} disabled={saving}
                                style={{padding:'8px 18px', background:'var(--accent)', color:'#fff',
                                  borderRadius:'var(--radius)', fontSize:13, fontWeight:600,
                                  opacity:saving?0.6:1, marginTop:18}}>
                                {saving?'Saving…':'Save'}
                              </button>
                            </div>

                            {/* Delete */}
                            {row && (
                              <div>
                                <button onClick={()=>remove(c.ticker)}
                                  style={{padding:'8px 12px', background:'transparent',
                                    border:'1px solid rgba(240,82,82,0.3)', color:'var(--red)',
                                    borderRadius:'var(--radius)', fontSize:12, marginTop:18}}>
                                  Remove
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div style={{marginTop:10, fontSize:10, color:'var(--muted)', fontFamily:'var(--font-mono)'}}>
        ⚠ P&L calculations are estimates based on your entered cost basis. Not financial advice.
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type='text', placeholder='' }) {
  return (
    <div>
      <div style={{fontSize:10, color:'var(--muted)', fontFamily:'var(--font-mono)',
        marginBottom:6, textTransform:'uppercase', letterSpacing:'0.4px'}}>{label}</div>
      <input type={type} value={value} onChange={e=>onChange(e.target.value)}
        placeholder={placeholder}
        style={{width:'100%', background:'var(--bg)', border:'1px solid var(--border2)',
          color:'var(--text)', padding:'7px 10px', borderRadius:'var(--radius)',
          fontSize:12, outline:'none', fontFamily:'var(--font-mono)'}}
        onFocus={e=>e.target.style.borderColor='var(--accent)'}
        onBlur={e=>e.target.style.borderColor='var(--border2)'}/>
    </div>
  )
}
