import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth.jsx'
import { supabase } from '../lib/supabase'

const SENTIMENTS = {
  bullish: { color: 'var(--green)', bg: 'rgba(32,200,120,0.1)', icon: '▲' },
  bearish: { color: 'var(--red)',   bg: 'rgba(240,82,82,0.1)',  icon: '▼' },
  neutral: { color: 'var(--muted)', bg: 'rgba(84,88,120,0.15)', icon: '—' },
  watching:{ color: 'var(--amber)', bg: 'rgba(244,167,36,0.1)', icon: '◎' },
}

const NOTE_TYPES = ['thesis','signal','warning','question','observation']
const HORIZONS  = ['short','medium','long']

function ConvictionDots({ value }) {
  return (
    <div style={{ display:'flex', gap:3 }}>
      {[1,2,3,4,5].map(i => (
        <div key={i} style={{ width:7, height:7, borderRadius:'50%',
          background: i <= value ? 'var(--accent)' : 'var(--border2)' }} />
      ))}
    </div>
  )
}

function NoteCard({ note, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const s = SENTIMENTS[note.sentiment] || SENTIMENTS.neutral

  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)',
      borderLeft:`3px solid ${s.color}`, borderRadius:'var(--radius-lg)',
      overflow:'hidden', marginBottom:8 }}>
      <div onClick={() => setExpanded(v => !v)}
        style={{ padding:'12px 16px', cursor:'pointer' }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
              {note.tickers?.map(t => (
                <span key={t} style={{ fontSize:11, fontFamily:'var(--font-mono)', fontWeight:700,
                  color:'var(--accent)', background:'var(--accent-dim)',
                  padding:'1px 7px', borderRadius:4 }}>{t}</span>
              ))}
              <span style={{ fontSize:12, fontWeight:600, color:'var(--text)' }}>{note.title}</span>
            </div>
            <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
              <span style={{ fontSize:9, fontWeight:600, padding:'1px 8px', borderRadius:10,
                background: s.bg, color: s.color, textTransform:'uppercase', letterSpacing:'0.4px' }}>
                {s.icon} {note.sentiment || 'neutral'}
              </span>
              <span style={{ fontSize:9, padding:'1px 7px', borderRadius:3,
                background:'var(--surface2)', color:'var(--muted)', border:'1px solid var(--border)',
                fontFamily:'var(--font-mono)', textTransform:'uppercase' }}>
                {note.note_type}
              </span>
              {note.time_horizon && (
                <span style={{ fontSize:9, color:'var(--muted)', fontFamily:'var(--font-mono)' }}>
                  {note.time_horizon}-term
                </span>
              )}
              <span style={{ fontSize:9, color:'var(--muted)', fontFamily:'var(--font-mono)' }}>
                {new Date(note.created_at).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}
              </span>
              <span style={{ fontSize:9, color:'var(--muted)', fontFamily:'var(--font-mono)' }}>
                via {note.source}
              </span>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
            <ConvictionDots value={note.conviction || 3} />
            <span style={{ fontSize:9, color:'var(--muted)', fontFamily:'var(--font-mono)' }}>
              {expanded ? '▲' : '▼'}
            </span>
          </div>
        </div>
      </div>
      {expanded && (
        <div style={{ borderTop:'1px solid var(--border)', background:'var(--surface2)',
          padding:'12px 16px' }}>
          <div style={{ fontSize:12, color:'var(--text2)', lineHeight:1.75, marginBottom:10, whiteSpace:'pre-wrap' }}>
            {note.content}
          </div>
          {note.tags?.length > 0 && (
            <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:10 }}>
              {note.tags.map(tag => (
                <span key={tag} style={{ fontSize:9, padding:'1px 7px', borderRadius:3,
                  background:'var(--surface3)', color:'var(--muted)',
                  border:'1px solid var(--border)', fontFamily:'var(--font-mono)' }}>{tag}</span>
              ))}
            </div>
          )}
          <button onClick={(e) => { e.stopPropagation(); onDelete(note.id) }}
            style={{ fontSize:10, background:'none', border:'none', color:'var(--muted)',
              cursor:'pointer', padding:0, fontFamily:'var(--font-mono)' }}
            onMouseEnter={e => e.target.style.color = 'var(--red)'}
            onMouseLeave={e => e.target.style.color = 'var(--muted)'}>
            ✕ delete note
          </button>
        </div>
      )}
    </div>
  )
}

function AddNoteForm({ onSave, onCancel }) {
  const [form, setForm] = useState({
    tickers:'', title:'', content:'', note_type:'thesis',
    sentiment:'bullish', conviction:3, time_horizon:'medium', tags:'',
  })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!form.title || !form.content) return
    setSaving(true)
    const tickers = form.tickers.split(/[,\s]+/).map(t => t.trim().toUpperCase()).filter(Boolean)
    const tags = form.tags.split(/[,\s]+/).map(t => t.trim().toLowerCase()).filter(Boolean)
    await onSave({ ...form, tickers, tags, source:'manual' })
    setSaving(false)
  }

  const inp = (field) => ({
    value: form[field],
    onChange: e => setForm(f => ({ ...f, [field]: e.target.value })),
    style: { width:'100%', background:'var(--surface2)', border:'1px solid var(--border)',
      borderRadius:'var(--radius)', color:'var(--text)', padding:'8px 12px',
      fontSize:12, fontFamily:'var(--font-body)', outline:'none' }
  })

  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--accent-border)',
      borderRadius:'var(--radius-lg)', padding:'16px 18px', marginBottom:16 }}>
      <div style={{ fontSize:12, fontWeight:600, color:'var(--accent)', marginBottom:14 }}>
        New research note
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
        <div>
          <div style={{ fontSize:9, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:5 }}>Tickers (comma separated)</div>
          <input {...inp('tickers')} placeholder="EOG, COP" />
        </div>
        <div>
          <div style={{ fontSize:9, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:5 }}>Title / headline</div>
          <input {...inp('title')} placeholder="EOG — strong FCF thesis at current valuation" />
        </div>
      </div>
      <div style={{ marginBottom:10 }}>
        <div style={{ fontSize:9, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:5 }}>Research notes</div>
        <textarea {...inp('content')} rows={5}
          placeholder="Paste your Claude research here, or type your notes directly. Any format — bullet points, prose, key metrics. Claude will structure it."
          style={{ ...inp('content').style, resize:'vertical', lineHeight:1.6 }} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:10 }}>
        {[
          { label:'Sentiment', field:'sentiment', options:['bullish','bearish','neutral','watching'] },
          { label:'Type', field:'note_type', options: NOTE_TYPES },
          { label:'Horizon', field:'time_horizon', options: HORIZONS },
          { label:'Conviction (1-5)', field:'conviction', options:[1,2,3,4,5] },
        ].map(({ label, field, options }) => (
          <div key={field}>
            <div style={{ fontSize:9, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:5 }}>{label}</div>
            <select value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: field === 'conviction' ? Number(e.target.value) : e.target.value }))}
              style={{ width:'100%', background:'var(--surface2)', border:'1px solid var(--border)',
                borderRadius:'var(--radius)', color:'var(--text)', padding:'7px 10px', fontSize:12 }}>
              {options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        ))}
      </div>
      <div style={{ marginBottom:14 }}>
        <div style={{ fontSize:9, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:5 }}>Tags (optional)</div>
        <input {...inp('tags')} placeholder="AI, energy, moat, dividend" />
      </div>
      <div style={{ display:'flex', gap:10 }}>
        <button onClick={save} disabled={saving || !form.title || !form.content}
          style={{ padding:'8px 20px', background:'var(--accent)', color:'#fff', border:'none',
            borderRadius:'var(--radius)', fontSize:12, fontWeight:600, cursor:'pointer', opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Saving…' : 'Save note'}
        </button>
        <button onClick={onCancel}
          style={{ padding:'8px 16px', background:'none', border:'1px solid var(--border)',
            color:'var(--text2)', borderRadius:'var(--radius)', fontSize:12, cursor:'pointer' }}>
          Cancel
        </button>
      </div>
    </div>
  )
}

export default function ResearchInbox() {
  const { user } = useAuth()
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState(null)
  const [filter, setFilter] = useState({ ticker:'', sentiment:'', type:'' })

  useEffect(() => { if (user) loadNotes() }, [user])

  const loadNotes = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('research_notes')
      .select('*')
      .order('created_at', { ascending: false })
    setNotes(data || [])
    setLoading(false)
  }

  const saveNote = async (formData) => {
    const { error } = await supabase.from('research_notes').insert({
      ...formData, user_id: user.id,
    })
    if (!error) { setAdding(false); loadNotes() }
  }

  const deleteNote = async (id) => {
    await supabase.from('research_notes').delete().eq('id', id)
    setNotes(ns => ns.filter(n => n.id !== id))
  }

  const syncEmail = async () => {
    setSyncing(true); setSyncResult(null)
    try {
      const res = await fetch('/api/ingest-research')
      const json = await res.json()
      setSyncResult(json)
      if (json.ingested > 0) loadNotes()
    } catch (e) {
      setSyncResult({ error: e.message })
    }
    setSyncing(false)
  }

  const filtered = notes.filter(n => {
    if (filter.ticker && !n.tickers?.some(t => t.includes(filter.ticker.toUpperCase()))) return false
    if (filter.sentiment && n.sentiment !== filter.sentiment) return false
    if (filter.type && n.note_type !== filter.type) return false
    return true
  })

  const byTicker = {}
  notes.forEach(n => n.tickers?.forEach(t => { byTicker[t] = (byTicker[t] || 0) + 1 }))
  const topTickers = Object.entries(byTicker).sort((a,b) => b[1]-a[1]).slice(0, 8)

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', flexDirection:'column' }}>

      {/* Header */}
      <div style={{ padding:'13px 24px 11px', borderBottom:'1px solid var(--border)', background:'var(--surface)', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:3 }}>
              <span style={{ fontFamily:'var(--font-display)', fontSize:20 }}>Research Inbox</span>
              <span style={{ fontSize:9, padding:'2px 8px', borderRadius:10, fontWeight:600,
                background:'rgba(91,138,240,0.12)', color:'var(--accent)', border:'1px solid var(--accent-border)' }}>
                {notes.length} note{notes.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div style={{ fontSize:11, color:'var(--muted)' }}>
              Capture research from Claude.ai conversations · syncs to AI Adviser context · builds over time
            </div>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={syncEmail} disabled={syncing}
              style={{ padding:'7px 14px', background:'none', border:'1px solid var(--border)',
                color: syncing ? 'var(--muted)' : 'var(--text2)', borderRadius:'var(--radius)',
                fontSize:11, cursor: syncing ? 'not-allowed' : 'pointer', fontFamily:'var(--font-mono)' }}>
              {syncing ? '⟳ Syncing…' : '⟳ Sync email'}
            </button>
            <button onClick={() => setAdding(true)} disabled={adding}
              style={{ padding:'7px 16px', background:'var(--accent)', color:'#fff',
                border:'none', borderRadius:'var(--radius)', fontSize:12, fontWeight:600, cursor:'pointer' }}>
              + Add note
            </button>
          </div>
        </div>
        {syncResult && (
          <div style={{ marginTop:8, padding:'6px 12px', borderRadius:'var(--radius)', fontSize:11,
            background: syncResult.error ? 'rgba(240,82,82,0.08)' : syncResult.ingested > 0 ? 'rgba(32,200,120,0.08)' : 'var(--surface2)',
            color: syncResult.error ? 'var(--red)' : syncResult.ingested > 0 ? 'var(--green)' : 'var(--muted)',
            border: `1px solid ${syncResult.error ? 'rgba(240,82,82,0.2)' : syncResult.ingested > 0 ? 'rgba(32,200,120,0.2)' : 'var(--border)'}` }}>
            {syncResult.error
              ? `Error: ${syncResult.error}`
              : syncResult.mode === 'manual'
              ? `ℹ ${syncResult.message} · Subject format: [APEX] TICKER - your title`
              : syncResult.ingested > 0
              ? `✓ Ingested ${syncResult.ingested} new note${syncResult.ingested > 1 ? 's' : ''} from email`
              : `○ No new [APEX] emails found · Send yourself emails with [APEX] in the subject`}
          </div>
        )}
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'18px 24px' }}>

        {/* How it works — shown when empty */}
        {!loading && notes.length === 0 && !adding && (
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)',
            borderRadius:'var(--radius-lg)', padding:'20px 24px', marginBottom:16 }}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:10 }}>How to capture Claude research</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
              {[
                { step:'1', title:'Email yourself', desc:'Finish a research session in Claude.ai. Email yourself with subject: [APEX] EOG - my thesis here. Paste the key insights in the body.', icon:'✉' },
                { step:'2', title:'Type directly', desc:'Click "Add note" to type research directly into the inbox. Good for quick observations from news, earnings calls, or financial filings.', icon:'✎' },
                { step:'3', title:'Context builds automatically', desc:'Every note becomes context for AI Adviser. Next time you ask about EOG, it already knows your thesis and previous observations.', icon:'◎' },
              ].map(item => (
                <div key={item.step} style={{ padding:'12px 14px', background:'var(--surface2)',
                  border:'1px solid var(--border)', borderRadius:'var(--radius)' }}>
                  <div style={{ fontSize:16, marginBottom:6 }}>{item.icon}</div>
                  <div style={{ fontSize:12, fontWeight:600, marginBottom:4 }}>{item.title}</div>
                  <div style={{ fontSize:11, color:'var(--text2)', lineHeight:1.65 }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top tickers */}
        {topTickers.length > 0 && (
          <div style={{ display:'flex', gap:6, marginBottom:14, flexWrap:'wrap', alignItems:'center' }}>
            <span style={{ fontSize:10, color:'var(--muted)' }}>Most researched:</span>
            {topTickers.map(([t, count]) => (
              <button key={t} onClick={() => setFilter(f => ({ ...f, ticker: f.ticker === t ? '' : t }))}
                style={{ fontSize:10, padding:'2px 9px', borderRadius:10, cursor:'pointer',
                  fontFamily:'var(--font-mono)', fontWeight:700, border:'1px solid',
                  background: filter.ticker === t ? 'var(--accent-dim)' : 'var(--surface2)',
                  color: filter.ticker === t ? 'var(--accent)' : 'var(--text2)',
                  borderColor: filter.ticker === t ? 'var(--accent-border)' : 'var(--border)' }}>
                {t} <span style={{ fontWeight:400 }}>({count})</span>
              </button>
            ))}
          </div>
        )}

        {/* Filters */}
        {notes.length > 0 && (
          <div style={{ display:'flex', gap:8, marginBottom:14, alignItems:'center' }}>
            <input value={filter.ticker}
              onChange={e => setFilter(f => ({ ...f, ticker: e.target.value }))}
              placeholder="Filter by ticker…"
              style={{ padding:'6px 10px', background:'var(--surface)', border:'1px solid var(--border)',
                borderRadius:'var(--radius)', color:'var(--text)', fontSize:11, width:140 }} />
            {['', 'bullish','bearish','neutral','watching'].map(s => (
              <button key={s} onClick={() => setFilter(f => ({ ...f, sentiment: s }))}
                style={{ padding:'5px 10px', borderRadius:'var(--radius)', cursor:'pointer', fontSize:10,
                  border:'1px solid', fontFamily:'var(--font-mono)',
                  background: filter.sentiment === s ? 'var(--accent-dim)' : 'var(--surface)',
                  color: filter.sentiment === s ? 'var(--accent)' : 'var(--muted)',
                  borderColor: filter.sentiment === s ? 'var(--accent-border)' : 'var(--border)' }}>
                {s || 'all'}
              </button>
            ))}
            {(filter.ticker || filter.sentiment || filter.type) && (
              <button onClick={() => setFilter({ ticker:'', sentiment:'', type:'' })}
                style={{ fontSize:10, background:'none', border:'none', color:'var(--muted)', cursor:'pointer' }}>
                ✕ clear
              </button>
            )}
          </div>
        )}

        {/* Add form */}
        {adding && <AddNoteForm onSave={saveNote} onCancel={() => setAdding(false)} />}

        {/* Notes list */}
        {loading ? (
          <div style={{ padding:40, color:'var(--muted)', fontFamily:'var(--font-mono)', fontSize:12 }}>Loading research notes…</div>
        ) : filtered.length === 0 && notes.length > 0 ? (
          <div style={{ padding:24, color:'var(--muted)', fontSize:12, textAlign:'center' }}>No notes match the current filter.</div>
        ) : (
          filtered.map(note => <NoteCard key={note.id} note={note} onDelete={deleteNote} />)
        )}

      </div>
    </div>
  )
}
