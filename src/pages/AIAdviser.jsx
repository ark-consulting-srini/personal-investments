import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../hooks/useAuth.jsx'
import { supabase } from '../lib/supabase'
import { COMPANIES_SCORED, TECH_COMPANIES } from '../lib/data'
import { formatDisplacementContext, getDisplacement } from '../lib/aiDisplacement'
import { getProfile } from './RiskProfile'

// Simple markdown renderer
function Markdown({ text }) {
  if (!text) return null
  const lines = text.split('\n')
  const elements = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim()) { elements.push(<div key={i} style={{height:8}}/>); i++; continue }
    if (line.startsWith('### ')) {
      elements.push(<div key={i} style={{fontSize:13, fontWeight:600, color:'var(--accent)', marginTop:16, marginBottom:4}}>{inline(line.slice(4))}</div>)
    } else if (line.startsWith('## ')) {
      elements.push(<div key={i} style={{fontSize:15, fontWeight:600, color:'var(--text)', marginTop:20, marginBottom:6, borderBottom:'1px solid var(--border)', paddingBottom:6}}>{inline(line.slice(3))}</div>)
    } else if (line.startsWith('# ')) {
      elements.push(<div key={i} style={{fontSize:17, fontWeight:600, color:'var(--text)', marginTop:4, marginBottom:10}}>{inline(line.slice(2))}</div>)
    } else if (line.startsWith('---')) {
      elements.push(<hr key={i} style={{border:'none', borderTop:'1px solid var(--border)', margin:'12px 0'}}/>)
    } else if (line.match(/^[-*] /)) {
      elements.push(
        <div key={i} style={{display:'flex', gap:8, marginBottom:4, paddingLeft:8}}>
          <span style={{color:'var(--accent)', flexShrink:0, marginTop:2}}>·</span>
          <span style={{fontSize:13, lineHeight:1.75, color:'var(--text)'}}>{inline(line.slice(2))}</span>
        </div>
      )
    } else {
      elements.push(<p key={i} style={{fontSize:13, lineHeight:1.85, color:'var(--text)', marginBottom:4}}>{inline(line)}</p>)
    }
    i++
  }
  return <div>{elements}</div>
}

function inline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i} style={{color:'var(--text)', fontWeight:600}}>{part.slice(2,-2)}</strong>
    if (part.startsWith('*') && part.endsWith('*'))
      return <em key={i}>{part.slice(1,-1)}</em>
    return part
  })
}


// ─── Supabase helpers ────────────────────────────────────────────────────────
async function getWatchlistWithNotes(userId) {
  const [{ data: wl }, { data: notes }, { data: portfolio }, { data: research }] = await Promise.all([
    supabase.from('watchlist').select('*').eq('user_id', userId),
    supabase.from('notes').select('*').eq('user_id', userId),
    supabase.from('portfolio').select('*').eq('user_id', userId),
    supabase.from('research_notes').select('*')
      .order('created_at', { ascending: false }).limit(30),
  ])
  return { watchlist: wl || [], notes: notes || [], portfolio: portfolio || [], research: research || [] }
}

async function saveInsight(userId, content, type = 'briefing') {
  await supabase.from('ai_insights').insert({ user_id: userId, content, type })
}

async function getInsights(userId) {
  const { data } = await supabase.from('ai_insights').select('*')
    .eq('user_id', userId).order('created_at', { ascending: false }).limit(10)
  return data || []
}

// ─── Build context ────────────────────────────────────────────────────────────
function buildContext({ profile, watchlist, notes, portfolio, research = [] }) {
  const watchlistTickers = watchlist.map(w => {
    const co = COMPANIES_SCORED.find(c => c.ticker === w.ticker)
    const note = notes.find(n => n.ticker === w.ticker)
    const pos = portfolio.find(p => p.ticker === w.ticker)
    if (!co) return null
    return {
      ticker: co.ticker, name: co.name, sector: co.sector, industry: co.industry,
      score: co.score,
      metrics: { roic: co.roic, fcf: co.fcf, evebitda: co.evebitda,
        oplev: co.oplev, revpemp: co.revpemp, debt: co.debt, peg: co.peg },
      myNote: note?.content || null,
      owned: pos?.owned || false, shares: pos?.shares || null,
      purchasePrice: pos?.purchase_price || null,
      trackingPrice: pos?.tracking_price || null,
      trackingSince: pos?.tracking_date || null,
    }
  }).filter(Boolean)

  // Summarise research notes for context injection — group by ticker
  const researchByTicker = {}
  research.forEach(r => {
    r.tickers?.forEach(t => {
      if (!researchByTicker[t]) researchByTicker[t] = []
      researchByTicker[t].push({
        date: r.created_at?.slice(0, 10),
        title: r.title,
        sentiment: r.sentiment,
        conviction: r.conviction,
        horizon: r.time_horizon,
        type: r.note_type,
        content: r.content?.slice(0, 400),
        source: r.source,
      })
    })
  })

  const researchSummary = Object.keys(researchByTicker).length > 0
    ? Object.entries(researchByTicker).map(([ticker, entries]) =>
        `${ticker} (${entries.length} note${entries.length > 1 ? 's' : ''}):\n` +
        entries.map(e => `  [${e.date}] ${e.sentiment?.toUpperCase()} · ${e.title} (conviction ${e.conviction}/5, ${e.horizon}-term)\n  ${e.content}`).join('\n')
      ).join('\n\n')
    : null

  const profileSummary = profile ? `
Investor Profile:
- Horizon: ${profile.answers?.horizon || 'not set'}
- Risk tolerance: ${profile.answers?.risk || 'not set'}
- Style: ${profile.answers?.style || 'not set'}
- Concentration: ${profile.answers?.concentration || 'not set'}
- AI angle: ${profile.answers?.ai_focus || 'not set'}
- Goals: ${(profile.goals || []).join(', ') || 'not set'}
- Context: ${profile.additional_context || 'none'}` : 'No investor profile set yet.'

  return { profileSummary, watchlistTickers, researchSummary, researchNoteCount: research.length }
}

// ─── Entry signal detection ───────────────────────────────────────────────────
function detectSignals(watchlistTickers) {
  const signals = []
  for (const stock of watchlistTickers) {
    const m = stock.metrics
    const s = []

    if (m.oplev > 0 && m.oplev <= 1.5)
      s.push({ type: 'positive', label: 'AI showing up', detail: `Op. leverage turned positive at +${m.oplev}pp — margins expanding` })
    if (m.oplev > 1.5)
      s.push({ type: 'strong', label: 'Strong AI signal', detail: `Operating leverage ${m.oplev}pp — AI is clearly in the numbers` })
    if (stock.score >= 4 && stock.score < 5)
      s.push({ type: 'positive', label: 'Score 4/5', detail: 'Composite score in Watch/Buy zone across all 7 metrics' })
    if (stock.score === 5)
      s.push({ type: 'strong', label: 'Score 5/5', detail: 'Top composite score — strong across all metrics' })
    if (stock.trackingPrice && m.peg < stock.trackingPrice * 0.95)
      s.push({ type: 'opportunity', label: '>5% below baseline', detail: `Trading ${((1 - m.peg / stock.trackingPrice) * 100).toFixed(1)}% below your tracking price` })
    if (m.peg < 1.5 && m.peg > 0)
      s.push({ type: 'positive', label: 'PEG < 1.5', detail: `PEG of ${m.peg} — fairly valued relative to growth` })
    if (m.peg < 1.0 && m.peg > 0)
      s.push({ type: 'strong', label: 'PEG < 1.0', detail: `PEG of ${m.peg} — potentially undervalued vs growth` })
    if (m.fcf >= 5)
      s.push({ type: 'positive', label: 'FCF yield ≥5%', detail: `FCF yield of ${m.fcf}% — strong cash generation` })
    if (m.fcf >= 7)
      s.push({ type: 'strong', label: 'High FCF yield', detail: `FCF yield of ${m.fcf}% — exceptional cash generation` })

    if (s.length > 0) signals.push({ ...stock, signals: s })
  }
  return signals.sort((a, b) => b.signals.length - a.signals.length)
}

// ─── Sector analysis ──────────────────────────────────────────────────────────
function analyzeSectors(watchlistTickers) {
  const sectors = {}
  for (const stock of watchlistTickers) {
    if (!sectors[stock.sector]) sectors[stock.sector] = { stocks: [], totalScore: 0, avgOplev: 0, avgFcf: 0 }
    sectors[stock.sector].stocks.push(stock)
    sectors[stock.sector].totalScore += stock.score
  }
  return Object.entries(sectors).map(([sector, data]) => ({
    sector,
    count: data.stocks.length,
    avgScore: (data.totalScore / data.stocks.length).toFixed(1),
    avgOplev: (data.stocks.reduce((s, st) => s + st.metrics.oplev, 0) / data.stocks.length).toFixed(1),
    avgFcf: (data.stocks.reduce((s, st) => s + st.metrics.fcf, 0) / data.stocks.length).toFixed(1),
    stocks: data.stocks,
  })).sort((a, b) => b.avgScore - a.avgScore)
}

// ─── Claude API ───────────────────────────────────────────────────────────────
async function callClaude(messages, systemPrompt) {
  const response = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      system: systemPrompt,
      messages,
    })
  })
  const data = await response.json()
  if (data.error) throw new Error(typeof data.error === 'string' ? data.error : data.error.message)
  return data.content?.[0]?.text || 'No response.'
}

const SIGNAL_COLORS = {
  strong: { bg: 'rgba(32,200,120,0.15)', color: '#20c878', border: 'rgba(32,200,120,0.3)' },
  positive: { bg: 'rgba(91,138,240,0.12)', color: '#5b8af0', border: 'rgba(91,138,240,0.25)' },
  opportunity: { bg: 'rgba(244,167,36,0.12)', color: '#f4a724', border: 'rgba(244,167,36,0.25)' },
}

const TABS = [
  { id: 'briefing', label: '✦ Briefing' },
  { id: 'signals',  label: '◈ Signals' },
  { id: 'sectors',  label: '▦ Sectors' },
  { id: 'rebalance',label: '◆ Rebalance' },
  { id: 'chat',     label: '◎ Ask anything' },
]

const SUGGESTED = [
  'Stress test my thesis on JPM',
  'Which stock in my watchlist has the best risk/reward right now?',
  'Am I overexposed to any sector given my risk profile?',
  'Which companies show the strongest AI adoption signals?',
  'Compare the two best opportunities in my watchlist',
  'What should I be cautious about this week?',
  'Build me an investment thesis for PGR',
]

export default function AIAdviser({ initialTab = 'briefing' }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [generatingType, setGeneratingType] = useState(null)
  const [profile, setProfile] = useState(null)
  const [context, setContext] = useState(null)
  const [briefing, setBriefing] = useState(null)
  const [rebalanceAdvice, setRebalanceAdvice] = useState(null)
  const [pastInsights, setPastInsights] = useState([])
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [activeTab, setActiveTab] = useState(initialTab)
  const chatEndRef = useRef(null)

  useEffect(() => { init() }, [user])
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const init = async () => {
    if (!user) return
    const [prof, { watchlist, notes, portfolio }, insights] = await Promise.all([
      getProfile(user.id),
      getWatchlistWithNotes(user.id),
      getInsights(user.id),
    ])
    setProfile(prof)
    setContext(buildContext({ profile: prof, watchlist, notes, portfolio, research }))
    setPastInsights(insights)
    setLoading(false)
  }

  const systemPrompt = (ctx) => `You are Apex, a personal investment adviser for Sri — a data engineer in Fullerton, California who works with Azure Databricks, Python, Spark, and SQL professionally. Sri analyzes non-tech S&P 500 companies for AI adoption potential as an investment thesis. He is NOT a professional investor — this is personal research.

${ctx?.profileSummary || ''}

━━━ WATCHLIST (${ctx?.watchlistTickers?.length || 0} stocks) ━━━
${(ctx?.watchlistTickers || []).map(w =>
  `${w.ticker} — ${w.name} (${w.sector}) · Score: ${w.score}/5
  Metrics: ROIC-WACC ${w.metrics?.roic}% · FCF ${w.metrics?.fcf}% · PEG ${w.metrics?.peg} · Op.Lev ${w.metrics?.oplev}pp · Debt/EBITDA ${w.metrics?.debt}x
  ${w.myNote ? `His note: "${w.myNote}"` : 'No note yet'}
  ${w.owned ? `OWNS: ${w.shares} shares @ $${w.purchasePrice}` : 'Watching, not owned'}`
).join('\n')}

━━━ TECH & AI UNIVERSE (10 AI picks) ━━━
${TECH_COMPANIES.map(t =>
  `${t.ticker} — ${t.name} (${t.industry})
  Gross Margin: ${t.roic}% · FCF Margin: ${t.fcf}% · Rev Growth: +${t.oplev}% · PEG: ${t.peg}
  Signal: ${t.aiSignal} · Moat: ${t.moat}
  Risk: ${t.risks?.split(',')[0]}`
).join('\n')}

━━━ METRIC GUIDE ━━━
S&P 100: ROIC-WACC >4% = value creating · FCF yield >4% = healthy · Op.Leverage positive = AI in margins · PEG <1.5 = fair value · Debt/EBITDA <2 = safe · Score 1-5 composite.
Tech/AI: Gross Margin >50% = strong moat · FCF Margin >20% = cash machine · Rev Growth >20% = momentum · PEG <2 = reasonable for growth.

${ctx?.researchSummary ? `━━━ SRI'S RESEARCH NOTES (${ctx.researchNoteCount} total) ━━━
${ctx.researchSummary}
When these notes are relevant, reference them directly — his past research is part of the conversation.` : ''}

━━━ RESPONSE FORMAT ━━━
Use compact structured format for chat responses:
**[Short headline — topic + key insight]**
· Bullet — specific number or metric from Sri's actual data
· Bullet — honest observation, reference real tickers
· Signal: [one positive signal] · Risk: [one honest concern]
· Verdict: [one sentence — "worth investigating" not "buy/sell"]
💬 *Next: [one short follow-up question]*

For briefings and longer analysis: use full prose with headers. For quick questions: bullets only, max 120 words.
Be specific, reference actual tickers and metrics. Be honest about risks. Frame as "worth investigating" not "buy/sell".`

  const generateBriefing = async () => {
    if (!context || generating) return
    setGenerating(true); setGeneratingType('briefing'); setActiveTab('briefing')
    try {
      const text = await callClaude([{ role: 'user', content: `Generate a personalized weekly investment briefing for Sri. Structure:
1. **Portfolio snapshot** — health check on owned positions
2. **Top 2-3 opportunities** — most compelling watchlist stocks by metrics
3. **Watch out for** — 1-2 risks in current watchlist
4. **AI adoption signal** — which company shows strongest AI evidence (operating leverage + rev/employee)
5. **One actionable insight** — most important thing to focus on this week

Be specific, reference actual tickers and metrics. Speak like a thoughtful adviser.` }], systemPrompt(context))
      setBriefing(text)
      if (user) await saveInsight(user.id, text, 'briefing')
    } catch (e) {
      setBriefing(`Error: ${e.message}. Make sure VITE_CLAUDE_API_KEY is set in Vercel environment variables.`)
    }
    setGenerating(false); setGeneratingType(null)
  }

  const generateRebalance = async () => {
    if (!context || generating) return
    setGenerating(true); setGeneratingType('rebalance'); setActiveTab('rebalance')
    try {
      const sectors = analyzeSectors(context.watchlistTickers || [])
      const text = await callClaude([{ role: 'user', content: `Analyze Sri's watchlist for portfolio concentration and rebalancing opportunities.

Current sector breakdown:
${JSON.stringify(sectors, null, 2)}

Owned positions: ${(context.watchlistTickers || []).filter(t => t.owned).map(t => `${t.ticker} (${t.shares} shares @ $${t.purchasePrice})`).join(', ') || 'None recorded yet'}

Given Sri's profile (${profile?.answers?.risk || 'moderate'} risk, ${profile?.answers?.style || 'quality'} style, ${profile?.answers?.concentration || 'moderate'} concentration preference):

1. Is he overweight any sector?
2. Are there concentration risks?
3. Which sectors are under-represented given his AI adoption thesis?
4. What's one rebalancing move worth considering?

Be specific and honest. Don't pad the response.` }], systemPrompt(context))
      setRebalanceAdvice(text)
    } catch (e) {
      setRebalanceAdvice(`Error: ${e.message}`)
    }
    setGenerating(false); setGeneratingType(null)
  }

  const sendMessage = async () => {
    if (!input.trim() || chatLoading) return
    const userMsg = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setChatLoading(true)
    try {
      const reply = await callClaude(newMessages, systemPrompt(context))
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
      if (user && (input.toLowerCase().includes('thesis') || input.toLowerCase().includes('stress test'))) {
        await saveInsight(user.id, `Q: ${input}\n\nA: ${reply}`, 'thesis')
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${e.message}. Check VITE_CLAUDE_API_KEY in Vercel.` }])
    }
    setChatLoading(false)
  }

  const signals = context ? detectSignals(context.watchlistTickers || []) : []
  const sectors = context ? analyzeSectors(context.watchlistTickers || []) : []
  const noWatchlist = !context?.watchlistTickers?.length
  const noProfile = !profile?.answers

  if (loading) return (
    <div style={{padding:40, color:'var(--muted)', fontFamily:'var(--font-mono)', fontSize:12}}>Loading your data…</div>
  )

  return (
    <div style={{display:'flex', height:'100vh', overflow:'hidden'}}>
      {/* Left panel */}
      <div style={{width:280, flexShrink:0, borderRight:'1px solid var(--border)',
        display:'flex', flexDirection:'column', background:'var(--surface)', overflow:'hidden'}}>
        <div style={{padding:'18px 16px 12px', borderBottom:'1px solid var(--border)'}}>
          <div style={{fontFamily:'var(--font-display)', fontSize:20, marginBottom:2}}>AI Adviser</div>
          <div style={{fontSize:10, color:'var(--muted)', fontFamily:'var(--font-mono)'}}>Powered by Claude · Personal use</div>
        </div>

        {/* Status */}
        <div style={{padding:'12px 16px', borderBottom:'1px solid var(--border)'}}>
          {[
            { label:'Risk profile', ok:!noProfile },
            { label:'Watchlist', ok:!noWatchlist, count:context?.watchlistTickers?.length },
            { label:'Portfolio data', ok:context?.watchlistTickers?.some(t=>t.owned) },
            { label:'Stock notes', ok:context?.watchlistTickers?.some(t=>t.myNote) },
          ].map(item => (
            <div key={item.label} style={{display:'flex', alignItems:'center', gap:8, marginBottom:5}}>
              <span style={{fontSize:11, color:item.ok?'var(--green)':'var(--muted)'}}>{item.ok?'✓':'○'}</span>
              <span style={{fontSize:11, color:item.ok?'var(--text)':'var(--text2)'}}>
                {item.label}{item.count?` (${item.count})`:''}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{padding:'12px 16px', borderBottom:'1px solid var(--border)', display:'flex', flexDirection:'column', gap:8}}>
          <button onClick={generateBriefing} disabled={generating||noWatchlist}
            style={{padding:'9px 12px', background:noWatchlist?'var(--border2)':'var(--accent)',
              color:noWatchlist?'var(--muted)':'#fff', border:'none',
              borderRadius:'var(--radius)', fontSize:12, fontWeight:600,
              opacity:generating&&generatingType==='briefing'?0.7:1, cursor:noWatchlist?'not-allowed':'pointer'}}>
            {generating&&generatingType==='briefing' ? '✦ Generating…' : '✦ Weekly briefing'}
          </button>
          <button onClick={generateRebalance} disabled={generating||noWatchlist}
            style={{padding:'9px 12px', background:'transparent',
              border:'1px solid var(--border2)', color:'var(--text2)',
              borderRadius:'var(--radius)', fontSize:12, fontWeight:500,
              opacity:generating&&generatingType==='rebalance'?0.7:1, cursor:noWatchlist?'not-allowed':'pointer'}}>
            {generating&&generatingType==='rebalance' ? '◆ Analyzing…' : '◆ Rebalance check'}
          </button>
        </div>

        {/* Past insights */}
        <div style={{flex:1, overflowY:'auto', padding:'10px 16px'}}>
          <div style={{fontSize:9, color:'var(--muted)', fontFamily:'var(--font-mono)',
            textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:8}}>History</div>
          {pastInsights.map(ins => (
            <div key={ins.id} onClick={()=>{setBriefing(ins.content);setActiveTab('briefing')}}
              style={{padding:'7px 10px', borderRadius:'var(--radius)', marginBottom:4,
                background:'var(--surface2)', cursor:'pointer', border:'1px solid var(--border)',
                transition:'border-color 0.15s'}}
              onMouseEnter={e=>e.currentTarget.style.borderColor='var(--accent)'}
              onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
              <div style={{fontSize:10, fontWeight:600, color:'var(--text2)'}}>
                {ins.type==='briefing'?'✦ Briefing':ins.type==='thesis'?'◈ Thesis':'◆ Analysis'}
              </div>
              <div style={{fontSize:9, color:'var(--muted)', fontFamily:'var(--font-mono)', marginTop:2}}>
                {new Date(ins.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}
              </div>
            </div>
          ))}
        </div>

        <div style={{padding:'10px 16px', borderTop:'1px solid var(--border)',
          fontSize:9, color:'var(--muted)', fontFamily:'var(--font-mono)', textAlign:'center'}}>
          ~$0.02/briefing · ~$0.01/message
        </div>
      </div>

      {/* Right panel */}
      <div style={{flex:1, display:'flex', flexDirection:'column', minWidth:0, overflow:'hidden'}}>
        {/* Tabs */}
        <div style={{display:'flex', borderBottom:'1px solid var(--border)',
          background:'var(--surface)', padding:'0 20px', overflowX:'auto'}}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={()=>setActiveTab(tab.id)}
              style={{padding:'13px 14px', background:'none', border:'none', flexShrink:0,
                borderBottom:activeTab===tab.id?'2px solid var(--accent)':'2px solid transparent',
                color:activeTab===tab.id?'var(--accent)':'var(--text2)',
                fontSize:12, fontWeight:600, cursor:'pointer', transition:'all 0.15s', marginBottom:-1}}>
              {tab.label}
              {tab.id==='signals' && signals.length>0 && (
                <span style={{marginLeft:6, background:'var(--green)', color:'#000',
                  borderRadius:10, padding:'1px 6px', fontSize:9, fontWeight:700}}>
                  {signals.reduce((s,st)=>s+st.signals.length,0)}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── BRIEFING TAB ── */}
        {activeTab==='briefing' && (
          <div style={{flex:1, overflowY:'auto', padding:'24px 28px'}}>
            {!briefing && !generating ? (
              <div style={{textAlign:'center', padding:'50px 40px'}}>
                <div style={{fontSize:36, marginBottom:14, opacity:0.25}}>✦</div>
                <div style={{fontSize:18, fontWeight:600, marginBottom:8, fontFamily:'var(--font-display)'}}>Your weekly briefing</div>
                <div style={{fontSize:13, color:'var(--text2)', lineHeight:1.8, maxWidth:440, margin:'0 auto 24px'}}>
                  Claude will read your entire watchlist, portfolio, notes, and risk profile — then write a briefing that's actually about your situation.
                </div>
                {(noProfile||noWatchlist) && (
                  <div style={{background:'rgba(244,167,36,0.08)', border:'1px solid rgba(244,167,36,0.2)',
                    borderRadius:'var(--radius)', padding:'12px 18px', fontSize:12, color:'var(--amber)',
                    maxWidth:380, margin:'0 auto 20px', textAlign:'left', lineHeight:1.7}}>
                    {noProfile && <div>→ Fill in your Risk Profile for personalized advice</div>}
                    {noWatchlist && <div>→ Add stocks to your Watchlist first</div>}
                  </div>
                )}
                <button onClick={generateBriefing} disabled={noWatchlist}
                  style={{padding:'11px 28px', background:'var(--accent)', color:'#fff',
                    border:'none', borderRadius:'var(--radius)', fontSize:13, fontWeight:600,
                    cursor:noWatchlist?'not-allowed':'pointer', opacity:noWatchlist?0.5:1}}>
                  Generate my briefing
                </button>
              </div>
            ) : generating && generatingType==='briefing' ? (
              <div style={{textAlign:'center', padding:'60px 40px'}}>
                <div style={{fontSize:32, marginBottom:14}}>✦</div>
                <div style={{fontSize:14, color:'var(--text2)'}}>Claude is analyzing your watchlist…</div>
                <div style={{fontSize:11, color:'var(--muted)', marginTop:6, fontFamily:'var(--font-mono)'}}>10–20 seconds</div>
              </div>
            ) : briefing ? (
              <div>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
                  <div style={{fontSize:11, color:'var(--muted)', fontFamily:'var(--font-mono)'}}>
                    {new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}
                  </div>
                  <button onClick={generateBriefing}
                    style={{padding:'5px 12px', background:'var(--accent-dim)', border:'1px solid var(--accent-border)',
                      color:'var(--accent)', borderRadius:'var(--radius)', fontSize:11, fontWeight:600}}>
                    Regenerate
                  </button>
                </div>
                <Markdown text={briefing} />
                <div style={{marginTop:24, paddingTop:16, borderTop:'1px solid var(--border)',
                  fontSize:10, color:'var(--muted)', fontFamily:'var(--font-mono)'}}>
                  ⚠ AI-generated analysis for personal research only. Not financial advice. Verify independently before any investment decision.
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* ── SIGNALS TAB ── */}
        {activeTab==='signals' && (
          <div style={{flex:1, overflowY:'auto', padding:'24px 28px'}}>
            <div style={{marginBottom:20}}>
              <h2 style={{fontFamily:'var(--font-display)', fontSize:22, marginBottom:6}}>Entry Signals</h2>
              <p style={{fontSize:13, color:'var(--text2)', lineHeight:1.6}}>
                Stocks in your watchlist triggering one or more entry conditions. More signals = more compelling.
                Not a buy recommendation — a prompt to look closer.
              </p>
            </div>

            {signals.length === 0 ? (
              <div style={{background:'var(--surface)', border:'1px solid var(--border)',
                borderRadius:'var(--radius-lg)', padding:40, textAlign:'center', color:'var(--muted)'}}>
                <div style={{fontSize:28, marginBottom:12}}>◈</div>
                <div>No entry signals detected in your current watchlist.</div>
                <div style={{fontSize:12, marginTop:6}}>Add more stocks or update your tracking prices.</div>
              </div>
            ) : (
              <div style={{display:'flex', flexDirection:'column', gap:12}}>
                {signals.map(stock => (
                  <div key={stock.ticker} style={{background:'var(--surface)', border:'1px solid var(--border)',
                    borderRadius:'var(--radius-lg)', padding:'16px 18px'}}>
                    <div style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12}}>
                      <div>
                        <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:3}}>
                          <span style={{fontFamily:'var(--font-mono)', color:'var(--accent)', fontWeight:700, fontSize:14}}>{stock.ticker}</span>
                          <span style={{fontSize:12, color:'var(--text2)'}}>{stock.name}</span>
                          <span style={{fontSize:9, background:'var(--surface2)', color:'var(--muted)',
                            padding:'2px 7px', borderRadius:3, fontFamily:'var(--font-mono)'}}>{stock.industry}</span>
                        </div>
                        <div style={{fontSize:11, color:'var(--muted)', fontFamily:'var(--font-mono)'}}>
                          ROIC-WACC {stock.metrics.roic}% · FCF {stock.metrics.fcf}% · PEG {stock.metrics.peg} · Score {stock.score}/5
                        </div>
                      </div>
                      <div style={{textAlign:'right', flexShrink:0}}>
                        <div style={{fontSize:11, color:'var(--muted)', marginBottom:2}}>Signals</div>
                        <div style={{fontSize:20, fontWeight:700, fontFamily:'var(--font-mono)',
                          color:stock.signals.length>=3?'var(--green)':stock.signals.length>=2?'var(--accent)':'var(--amber)'}}>
                          {stock.signals.length}
                        </div>
                      </div>
                    </div>

                    <div style={{display:'flex', flexWrap:'wrap', gap:8}}>
                      {stock.signals.map((sig, i) => {
                        const style = SIGNAL_COLORS[sig.type] || SIGNAL_COLORS.positive
                        return (
                          <div key={i} style={{background:style.bg, border:`1px solid ${style.border}`,
                            borderRadius:'var(--radius)', padding:'6px 12px'}}>
                            <div style={{fontSize:11, fontWeight:600, color:style.color, marginBottom:2}}>{sig.label}</div>
                            <div style={{fontSize:10, color:'var(--text2)'}}>{sig.detail}</div>
                          </div>
                        )
                      })}
                    </div>

                    {stock.myNote && (
                      <div style={{marginTop:10, padding:'8px 12px', background:'var(--surface2)',
                        borderRadius:'var(--radius)', fontSize:11, color:'var(--text2)',
                        borderLeft:'2px solid var(--accent)'}}>
                        <span style={{color:'var(--muted)'}}>Your note: </span>{stock.myNote}
                      </div>
                    )}

                    <a href={`/chat#q=${encodeURIComponent(`Stress test my investment thesis on ${stock.ticker}. Here are the signals I'm seeing: ${stock.signals.map(s=>s.label).join(', ')}. What are the risks I should think about?`)}`}
                      style={{marginTop:12, display:'inline-block', padding:'6px 14px', background:'transparent',
                        border:'1px solid var(--border2)', color:'var(--text2)',
                        borderRadius:'var(--radius)', fontSize:11, fontWeight:500, cursor:'pointer',
                        textDecoration:'none', transition:'all 0.15s'}}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--accent)';e.currentTarget.style.color='var(--accent)'}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border2)';e.currentTarget.style.color='var(--text2)'}}>
                      Ask Claude to stress-test this →
                    </a>
                  </div>
                ))}
              </div>
            )}

            <div style={{marginTop:16, fontSize:10, color:'var(--muted)', fontFamily:'var(--font-mono)'}}>
              Signals based on static FY2025/TTM metrics. Prices not live unless refreshed on Dashboard.
            </div>
          </div>
        )}

        {/* ── SECTORS TAB ── */}
        {activeTab==='sectors' && (
          <div style={{flex:1, overflowY:'auto', padding:'24px 28px'}}>
            <div style={{marginBottom:20}}>
              <h2 style={{fontFamily:'var(--font-display)', fontSize:22, marginBottom:6}}>Sector Rotation</h2>
              <p style={{fontSize:13, color:'var(--text2)', lineHeight:1.6}}>
                Your watchlist breakdown by sector — average scores, AI signal strength, and concentration.
              </p>
            </div>

            {sectors.length === 0 ? (
              <div style={{background:'var(--surface)', border:'1px solid var(--border)',
                borderRadius:'var(--radius-lg)', padding:40, textAlign:'center', color:'var(--muted)'}}>
                Add stocks to your Watchlist to see sector analysis.
              </div>
            ) : (
              <div style={{display:'flex', flexDirection:'column', gap:10}}>
                {sectors.map((sec, i) => {
                  const scoreColor = sec.avgScore >= 4 ? 'var(--green)' : sec.avgScore >= 3 ? 'var(--amber)' : 'var(--red)'
                  const oplevColor = parseFloat(sec.avgOplev) > 1 ? 'var(--green)' : parseFloat(sec.avgOplev) > 0 ? 'var(--amber)' : 'var(--red)'
                  const pct = Math.round((sec.count / (context?.watchlistTickers?.length || 1)) * 100)
                  return (
                    <div key={sec.sector} style={{background:'var(--surface)', border:'1px solid var(--border)',
                      borderRadius:'var(--radius-lg)', padding:'16px 20px'}}>
                      <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:10}}>
                        <div style={{flex:1}}>
                          <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:4}}>
                            <span style={{fontSize:14, fontWeight:700}}>{sec.sector}</span>
                            <span style={{fontSize:11, color:'var(--muted)', fontFamily:'var(--font-mono)'}}>
                              {sec.count} stock{sec.count!==1?'s':''} · {pct}% of watchlist
                            </span>
                          </div>
                          {/* Bar */}
                          <div style={{background:'var(--border2)', borderRadius:2, height:4, width:'100%'}}>
                            <div style={{background:'var(--accent)', height:4, borderRadius:2,
                              width:`${pct}%`, transition:'width 0.4s ease'}}/>
                          </div>
                        </div>
                        <div style={{display:'flex', gap:16, flexShrink:0}}>
                          <div style={{textAlign:'center'}}>
                            <div style={{fontSize:18, fontWeight:700, fontFamily:'var(--font-mono)', color:scoreColor}}>{sec.avgScore}</div>
                            <div style={{fontSize:9, color:'var(--muted)', fontFamily:'var(--font-mono)'}}>AVG SCORE</div>
                          </div>
                          <div style={{textAlign:'center'}}>
                            <div style={{fontSize:18, fontWeight:700, fontFamily:'var(--font-mono)', color:oplevColor}}>
                              {parseFloat(sec.avgOplev)>0?'+':''}{sec.avgOplev}pp
                            </div>
                            <div style={{fontSize:9, color:'var(--muted)', fontFamily:'var(--font-mono)'}}>OP. LEVERAGE</div>
                          </div>
                          <div style={{textAlign:'center'}}>
                            <div style={{fontSize:18, fontWeight:700, fontFamily:'var(--font-mono)', color:'var(--teal)'}}>{sec.avgFcf}%</div>
                            <div style={{fontSize:9, color:'var(--muted)', fontFamily:'var(--font-mono)'}}>FCF YIELD</div>
                          </div>
                        </div>
                      </div>
                      <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
                        {sec.stocks.map(s => (
                          <span key={s.ticker} style={{fontSize:10, fontFamily:'var(--font-mono)', fontWeight:600,
                            color:'var(--accent)', background:'var(--accent-dim)',
                            padding:'2px 7px', borderRadius:3}}>{s.ticker}</span>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div style={{marginTop:16}}>
              <a href="/chat"
                style={{display:'inline-block', padding:'9px 18px', background:'var(--accent-dim)', border:'1px solid var(--accent-border)',
                  color:'var(--accent)', borderRadius:'var(--radius)', fontSize:12, fontWeight:600, cursor:'pointer', textDecoration:'none'}}>
                Ask Claude to analyze my sector exposure →
              </a>
            </div>
          </div>
        )}

        {/* ── REBALANCE TAB ── */}
        {activeTab==='rebalance' && (
          <div style={{flex:1, overflowY:'auto', padding:'24px 28px'}}>
            <div style={{marginBottom:20}}>
              <h2 style={{fontFamily:'var(--font-display)', fontSize:22, marginBottom:6}}>Portfolio Rebalance Advisor</h2>
              <p style={{fontSize:13, color:'var(--text2)', lineHeight:1.6}}>
                Claude reviews your watchlist concentration against your risk profile and flags imbalances.
              </p>
            </div>

            {!rebalanceAdvice && !generating ? (
              <div style={{textAlign:'center', padding:'40px'}}>
                <div style={{fontSize:32, marginBottom:12, opacity:0.25}}>◆</div>
                <div style={{fontSize:15, fontWeight:600, marginBottom:8}}>Rebalance check</div>
                <div style={{fontSize:13, color:'var(--text2)', marginBottom:20, lineHeight:1.7}}>
                  Claude will look at your sector concentration, owned positions, and risk profile to flag any imbalances.
                </div>
                <button onClick={generateRebalance} disabled={noWatchlist}
                  style={{padding:'11px 28px', background:'var(--accent)', color:'#fff',
                    border:'none', borderRadius:'var(--radius)', fontSize:13, fontWeight:600,
                    cursor:noWatchlist?'not-allowed':'pointer', opacity:noWatchlist?0.5:1}}>
                  Run rebalance check
                </button>
              </div>
            ) : generating && generatingType==='rebalance' ? (
              <div style={{textAlign:'center', padding:'60px 40px'}}>
                <div style={{fontSize:28, marginBottom:14}}>◆</div>
                <div style={{fontSize:14, color:'var(--text2)'}}>Analyzing your portfolio concentration…</div>
              </div>
            ) : rebalanceAdvice ? (
              <div>
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:20}}>
                  <div style={{fontSize:11, color:'var(--muted)', fontFamily:'var(--font-mono)'}}>
                    {new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}
                  </div>
                  <button onClick={generateRebalance}
                    style={{padding:'5px 12px', background:'var(--accent-dim)', border:'1px solid var(--accent-border)',
                      color:'var(--accent)', borderRadius:'var(--radius)', fontSize:11, fontWeight:600}}>
                    Re-analyze
                  </button>
                </div>
                <Markdown text={rebalanceAdvice} />
                <div style={{marginTop:24, paddingTop:16, borderTop:'1px solid var(--border)',
                  fontSize:10, color:'var(--muted)', fontFamily:'var(--font-mono)'}}>
                  ⚠ AI-generated analysis only. Not financial advice.
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* ── CHAT TAB ── */}
        {activeTab==='chat' && (
          <div style={{flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 24px'}}>
            <div style={{textAlign:'center', maxWidth:480}}>
              <div style={{fontSize:32, marginBottom:16, opacity:0.15}}>◎</div>
              <div style={{fontFamily:'var(--font-display)', fontSize:20, marginBottom:10}}>Apex Chat</div>
              <div style={{fontSize:13, color:'var(--text2)', lineHeight:1.8, marginBottom:24}}>
                The full chat experience has persistent history, 5 prompt categories,
                context badges, and richer formatting. It knows your entire context —
                watchlist, portfolio, notes, research captures, past briefings.
              </div>
              <a href="/chat"
                style={{display:'inline-block', padding:'11px 28px', background:'var(--accent)', color:'#fff',
                  borderRadius:'var(--radius)', fontSize:13, fontWeight:600, textDecoration:'none',
                  transition:'opacity 0.15s'}}
                onMouseEnter={e=>e.currentTarget.style.opacity='0.85'}
                onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
                Open Apex Chat →
              </a>
              <div style={{marginTop:16, fontSize:11, color:'var(--muted)', fontFamily:'var(--font-mono)'}}>
                or use the Briefing, Signals, Sectors, or Rebalance tabs above for structured analysis
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
