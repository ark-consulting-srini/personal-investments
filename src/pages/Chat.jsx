import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../hooks/useAuth.jsx'
import { supabase } from '../lib/supabase'
import { COMPANIES_SCORED, TECH_COMPANIES } from '../lib/data'
import { getProfile } from './RiskProfile'
import { formatDisplacementContext, getDisplacement } from '../lib/aiDisplacement'

// ─── Load all user context ────────────────────────────────────────────────────
async function loadUserContext(userId) {
  const [
    { data: watchlist },
    { data: notes },
    { data: portfolio },
    { data: alerts },
    { data: insights },
    { data: research },
    profile,
  ] = await Promise.all([
    supabase.from('watchlist').select('*').eq('user_id', userId),
    supabase.from('notes').select('*').eq('user_id', userId),
    supabase.from('portfolio').select('*').eq('user_id', userId),
    supabase.from('alerts').select('*').eq('user_id', userId),
    supabase.from('ai_insights').select('*').eq('user_id', userId)
      .order('created_at', { ascending: false }).limit(5),
    supabase.from('research_notes').select('*')
      .order('created_at', { ascending: false }).limit(20),
    getProfile(userId),
  ])

  // Unified lookup: main 100 + tech universe
  const ALL_COMPANIES = [
    ...COMPANIES_SCORED,
    ...TECH_COMPANIES.map(t => ({
      ...t,
      // Tech companies use different metric names — map to common schema
      score: t.peg < 1.5 ? 5 : t.peg < 2 ? 4 : t.peg < 2.5 ? 3 : 2,
      roic: t.roic,  // gross margin for tech
      fcf: t.fcf,    // fcf margin for tech
      oplev: t.oplev, // revenue growth for tech
    }))
  ]

  const watchlistEnriched = (watchlist || []).map(w => {
    const co = ALL_COMPANIES.find(c => c.ticker === w.ticker)
    const note = (notes || []).find(n => n.ticker === w.ticker)
    const pos = (portfolio || []).find(p => p.ticker === w.ticker)
    return {
      ticker: w.ticker,
      name: co?.name,
      sector: co?.sector,
      score: co?.score,
      metrics: co ? { roic: co.roic, fcf: co.fcf, peg: co.peg, oplev: co.oplev, debt: co.debt } : null,
      note: note?.content || null,
      owned: pos?.owned || false,
      shares: pos?.shares || null,
      purchasePrice: pos?.purchase_price || null,
    }
  })

  const ownedPositions = watchlistEnriched.filter(w => w.owned)

  const profileSummary = profile?.answers ? `
Investor profile:
- Time horizon: ${profile.answers.horizon}
- Risk tolerance: ${profile.answers.risk}
- Investment style: ${profile.answers.style}
- Concentration preference: ${profile.answers.concentration}
- AI adoption focus: ${profile.answers.ai_focus}
- Goals: ${(profile.goals || []).join(', ')}
- Additional context: ${profile.additional_context || 'none'}` : 'No investor profile set.'

  const recentInsights = (insights || []).map(i =>
    `[${i.type} · ${new Date(i.created_at).toLocaleDateString()}]: ${i.content.slice(0, 300)}...`
  ).join('\n\n')

  return {
    systemPrompt: `You are Apex AI — a personal investment research assistant built specifically for Sri, a data engineer based in Fullerton, California who works with Azure Databricks, Python, Spark, and SQL.

Sri uses this app to research non-tech S&P 500 companies for AI adoption potential as an investment thesis. He is NOT a professional investor — this is personal research.

━━━ SRI'S INVESTOR PROFILE ━━━
${profileSummary}

━━━ WATCHLIST (${watchlistEnriched.length} stocks) ━━━
${watchlistEnriched.map(w => `
${w.ticker} — ${w.name} (${w.sector}) · Score: ${w.score}/5
  Metrics: ROIC-WACC ${w.metrics?.roic}% · FCF ${w.metrics?.fcf}% · PEG ${w.metrics?.peg} · Op.Lev ${w.metrics?.oplev}pp · Debt/EBITDA ${w.metrics?.debt}x
  ${w.note ? `His note: "${w.note}"` : 'No note yet'}
  ${w.owned ? `OWNS: ${w.shares} shares @ $${w.purchasePrice}` : 'Watching, not owned'}`
).join('\n')}

━━━ PORTFOLIO (${ownedPositions.length} positions) ━━━
${ownedPositions.length ? ownedPositions.map(p =>
  `${p.ticker}: ${p.shares} shares @ $${p.purchasePrice} avg cost`
).join('\n') : 'No owned positions recorded yet.'}

━━━ RECENT AI ADVISER HISTORY ━━━
${recentInsights || 'No previous briefings yet.'}

━━━ TECH & AI UNIVERSE (Sri's 10 picks) ━━━
${TECH_COMPANIES.map(t => `${t.ticker} — ${t.name} (${t.industry})
  Gross Margin: ${t.roic}% · FCF Margin: ${t.fcf}% · Rev Growth: +${t.oplev}% · PEG: ${t.peg}
  Why: ${t.whyItMatters.slice(0, 100)}...
  Moat: ${t.moat}
  Risk: ${t.risks.split(',')[0]}`).join('\n')}

━━━ RESEARCH NOTES (Sri's captured insights) ━━━
${(research || []).length > 0
  ? (research || []).map(r =>
      `[${r.created_at?.slice(0,10)} · ${r.sentiment?.toUpperCase()} · conviction ${r.conviction}/5] ${r.tickers?.join(', ')}: ${r.title}\n  ${r.content?.slice(0,200)}`
    ).join('\n\n')
  : 'No research notes captured yet. Encourage Sri to use Research Inbox.'}

━━━ AI DISPLACEMENT RISK (Citrini 2028 framework) ━━━
${formatDisplacementContext()}

━━━ METRIC REFERENCE ━━━
Main 100: ROIC-WACC >4% = value creating · FCF yield >5% = strong · Op.Leverage positive = AI in margins · PEG <1.5 = fair value · Debt/EBITDA <2 = safe
Tech universe: Gross Margin >50% = strong moat · FCF Margin >20% = cash machine · Rev Growth >20% = momentum · PEG <2 = reasonable for growth

━━━ RESPONSE FORMAT — FOLLOW STRICTLY ━━━
Always respond in this compact structured format. Never write long paragraphs.

Use this structure every time:

**[Short headline — topic + key insight]**
· Bullet one — specific number or metric from Sri's actual data
· Bullet two — honest observation, reference real tickers
· Bullet three — max 10 words each bullet

**[Second section header if needed]**
· Signal: [one specific positive signal]
· Risk: [one honest concern]
· Verdict: [one sentence — "worth investigating" not "buy/sell"]

💬 *Next: [one short follow-up question Sri should explore]*

STRICT RULES:
- Max 120 words total per response
- Bullets only — zero prose paragraphs
- Bold headers to separate sections
- Use Sri's actual tickers and metric numbers (score, FCF%, PEG, etc)
- Signal: / Risk: / Verdict: labels on key conclusions
- Always end with the 💬 Next question line
- For comparisons use side-by-side bullet format
- Be direct and honest — flag real risks`,
    watchlistCount: watchlistEnriched.length,
    ownedCount: ownedPositions.length,
    hasProfile: !!profile?.answers,
  }
}

// ─── Save / load chat history from Supabase ───────────────────────────────────
async function saveChatHistory(userId, messages) {
  await supabase.from('ai_insights').upsert({
    user_id: userId,
    type: 'chat_history',
    content: JSON.stringify(messages.slice(-40)), // keep last 40 messages
  }, { onConflict: 'user_id,type' }).select()
}

async function loadChatHistory(userId) {
  const { data } = await supabase.from('ai_insights')
    .select('content').eq('user_id', userId).eq('type', 'chat_history').single()
  if (data?.content) {
    try { return JSON.parse(data.content) } catch { return [] }
  }
  return []
}

// ─── Suggested prompts by category ───────────────────────────────────────────
const PROMPT_CATEGORIES = [
  {
    label: 'My portfolio',
    icon: '◆',
    prompts: [
      'Give me a health check on my current watchlist',
      'Which stock in my watchlist has the best risk/reward right now?',
      'Am I too concentrated in any one sector?',
      'What\'s the weakest position in my portfolio and why?',
    ]
  },
  {
    label: 'Thesis & strategy',
    icon: '◈',
    prompts: [
      'Stress test my AI adoption thesis — what could go wrong?',
      'How would a recession affect my current watchlist?',
      'What does operating leverage actually tell me about AI adoption?',
      'Should I be looking at energy or financials more?',
    ]
  },
  {
    label: 'Value stocks',
    icon: '△',
    prompts: [
      'Compare JPM and BAC — which is the better AI play?',
      'Make the bear case for EOG Resources',
      'Why is PGR scoring 5/5 — is the valuation still reasonable?',
      'Walk me through what AXP\'s AI strategy actually looks like',
    ]
  },
  {
    label: 'Tech & AI',
    icon: '▲',
    prompts: [
      'Compare NVDA and TSM — which has more durable advantage?',
      'Is PLTR worth the valuation risk given its defense AI moat?',
      'How does DDOG fit into the AI infrastructure stack?',
      'Break down the bull and bear case for MSFT\'s AI bet',
    ]
  },
  {
    label: 'Market & macro',
    icon: '◎',
    prompts: [
      'How should I think about energy stocks with oil price volatility?',
      'What sectors benefit most from AI adoption in the next 2-3 years?',
      'What are Berkshire and Bridgewater signaling about the market?',
      'How does the current rate environment affect my watchlist?',
    ]
  },
]

// ─── Compact Markdown renderer ───────────────────────────────────────────────
function inline(text) {
  if (typeof text !== 'string') return text
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i} style={{color:'var(--text)',fontWeight:600}}>{part.slice(2,-2)}</strong>
    if (part.startsWith('*') && part.endsWith('*'))
      return <em key={i} style={{color:'var(--text2)',fontStyle:'italic'}}>{part.slice(1,-1)}</em>
    if (part.startsWith('`') && part.endsWith('`'))
      return <code key={i} style={{fontFamily:'var(--font-mono)',fontSize:11,
        background:'rgba(91,138,240,0.12)',padding:'1px 6px',borderRadius:3,
        color:'var(--accent)',border:'1px solid rgba(91,138,240,0.2)'}}>{part.slice(1,-1)}</code>
    return part
  })
}

// Detect special pill tags like [Signal], [Risk], [Verdict]
function PillLine({ text }) {
  const pillMatch = text.match(/^(Signal|Risk|Verdict|Watch|Buy|Hold|Avoid):\s*(.+)/)
  if (pillMatch) {
    const colors = {
      Signal: {bg:'rgba(32,200,120,0.1)',  color:'#20c878', border:'rgba(32,200,120,0.25)'},
      Risk:   {bg:'rgba(240,82,82,0.08)',  color:'#f05252', border:'rgba(240,82,82,0.2)'},
      Verdict:{bg:'rgba(91,138,240,0.1)',  color:'#5b8af0', border:'rgba(91,138,240,0.25)'},
      Watch:  {bg:'rgba(244,167,36,0.1)',  color:'#f4a724', border:'rgba(244,167,36,0.25)'},
      Buy:    {bg:'rgba(32,200,120,0.1)',  color:'#20c878', border:'rgba(32,200,120,0.25)'},
      Hold:   {bg:'rgba(91,138,240,0.1)',  color:'#5b8af0', border:'rgba(91,138,240,0.25)'},
      Avoid:  {bg:'rgba(240,82,82,0.08)',  color:'#f05252', border:'rgba(240,82,82,0.2)'},
    }
    const c = colors[pillMatch[1]] || colors.Verdict
    return (
      <div style={{display:'flex',alignItems:'flex-start',gap:7,marginBottom:4}}>
        <span style={{fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:4,
          background:c.bg,color:c.color,border:`1px solid ${c.border}`,
          flexShrink:0,marginTop:1,fontFamily:'var(--font-mono)',letterSpacing:'0.3px'}}>
          {pillMatch[1]}
        </span>
        <span style={{fontSize:12,color:'var(--text)',lineHeight:1.6}}>{inline(pillMatch[2])}</span>
      </div>
    )
  }
  return (
    <div style={{display:'flex',gap:7,marginBottom:3,paddingLeft:2}}>
      <span style={{color:'var(--accent)',flexShrink:0,fontSize:10,marginTop:2,lineHeight:1}}>▸</span>
      <span style={{fontSize:12,lineHeight:1.65,color:'var(--text)'}}>{inline(text)}</span>
    </div>
  )
}

function Markdown({ text }) {
  if (!text) return null
  const lines = text.split('\n')
  const elements = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    if (!trimmed) {
      // Collapsed empty lines — much tighter spacing
      elements.push(<div key={i} style={{height:4}}/>)
    } else if (trimmed.startsWith('## ') || trimmed.startsWith('### ')) {
      const level = trimmed.startsWith('### ') ? 4 : 3
      const txt = trimmed.slice(level)
      elements.push(
        <div key={i} style={{fontSize:11,fontWeight:600,color:'var(--accent)',
          textTransform:'uppercase',letterSpacing:'0.6px',
          marginTop:i===0?0:12,marginBottom:4,
          display:'flex',alignItems:'center',gap:6}}>
          <span style={{width:2,height:10,background:'var(--accent)',
            borderRadius:1,display:'inline-block',flexShrink:0}}/>
          {inline(txt)}
        </div>
      )
    } else if (trimmed.startsWith('# ')) {
      elements.push(
        <div key={i} style={{fontSize:13,fontWeight:600,color:'var(--text)',
          marginTop:i===0?0:10,marginBottom:5}}>{inline(trimmed.slice(2))}</div>
      )
    } else if (trimmed.startsWith('---')) {
      elements.push(<div key={i} style={{height:1,background:'var(--border)',margin:'8px 0'}}/>)
    } else if (trimmed.startsWith('💬')) {
      // Next question — special treatment
      elements.push(
        <div key={i} style={{marginTop:10,padding:'7px 10px',
          background:'rgba(91,138,240,0.06)',border:'1px solid rgba(91,138,240,0.15)',
          borderRadius:'var(--radius)',fontSize:11,color:'var(--text2)',
          borderLeft:'2px solid var(--accent)'}}>
          {inline(trimmed)}
        </div>
      )
    } else if (trimmed.match(/^[-*•] /)) {
      // Detect pill bullets (Signal:, Risk:, Verdict:)
      elements.push(<PillLine key={i} text={trimmed.slice(2)}/>)
    } else if (trimmed.match(/^\d+\. /)) {
      const num = trimmed.match(/^(\d+)\. /)[1]
      elements.push(
        <div key={i} style={{display:'flex',gap:7,marginBottom:3}}>
          <span style={{fontSize:10,fontWeight:700,color:'var(--accent)',
            fontFamily:'var(--font-mono)',flexShrink:0,minWidth:14,marginTop:2}}>{num}.</span>
          <span style={{fontSize:12,lineHeight:1.65,color:'var(--text)'}}>
            {inline(trimmed.replace(/^\d+\. /,''))}
          </span>
        </div>
      )
    } else {
      // Plain text — check if it looks like a section header (bold only line)
      const boldOnly = trimmed.match(/^\*\*([^*]+)\*\*$/)
      if (boldOnly) {
        elements.push(
          <div key={i} style={{fontSize:11,fontWeight:600,color:'var(--accent)',
            textTransform:'uppercase',letterSpacing:'0.6px',
            marginTop:i===0?0:10,marginBottom:3,
            display:'flex',alignItems:'center',gap:6}}>
            <span style={{width:2,height:10,background:'var(--accent)',
              borderRadius:1,display:'inline-block',flexShrink:0}}/>
            {boldOnly[1]}
          </div>
        )
      } else {
        elements.push(
          <p key={i} style={{fontSize:12,lineHeight:1.7,color:'var(--text2)',
            marginBottom:2,marginTop:0}}>{inline(trimmed)}</p>
        )
      }
    }
    i++
  }
  return <div style={{lineHeight:1}}>{elements}</div>
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Chat() {
  const { user } = useAuth()
  const [ctx, setCtx] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [initLoading, setInitLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState(0)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [savingHistory, setSavingHistory] = useState(false)
  const chatEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => { init() }, [user])
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const init = async () => {
    if (!user) return
    const [context, history] = await Promise.all([
      loadUserContext(user.id),
      loadChatHistory(user.id),
    ])
    setCtx(context)
    if (history.length > 0) {
      setMessages(history)
      setShowSuggestions(false)
    }
    setInitLoading(false)
  }

  const send = async (text) => {
    const userText = (text || input).trim()
    if (!userText || loading) return
    setInput('')
    setShowSuggestions(false)
    const newMessages = [...messages, { role: 'user', content: userText }]
    setMessages(newMessages)
    setLoading(true)

    try {
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1000,
          system: ctx.systemPrompt,
          messages: newMessages,
        })
      })
      const data = await res.json()
      if (data.error) throw new Error(typeof data.error === 'string' ? data.error : data.error.message)
      const reply = data.content?.[0]?.text || 'No response.'
      const updated = [...newMessages, { role: 'assistant', content: reply }]
      setMessages(updated)

      // Save history to Supabase in background
      setSavingHistory(true)
      await saveChatHistory(user.id, updated)
      setSavingHistory(false)
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${e.message}. Make sure VITE_CLAUDE_API_KEY is set in Vercel environment variables.`
      }])
    }
    setLoading(false)
    inputRef.current?.focus()
  }

  const clearHistory = async () => {
    if (!window.confirm('Clear chat history? This cannot be undone.')) return
    setMessages([])
    setShowSuggestions(true)
    await supabase.from('ai_insights')
      .delete().eq('user_id', user.id).eq('type', 'chat_history')
  }

  if (initLoading) return (
    <div style={{padding:40,color:'var(--muted)',fontFamily:'var(--font-mono)',fontSize:12}}>
      Loading your context…
    </div>
  )

  return (
    <div style={{display:'flex',height:'100vh',overflow:'hidden',flexDirection:'column'}}>

      {/* Header */}
      <div style={{padding:'14px 24px',borderBottom:'1px solid var(--border)',
        background:'var(--surface)',display:'flex',alignItems:'center',
        justifyContent:'space-between',flexShrink:0}}>
        <div>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontFamily:'var(--font-display)',fontSize:20}}>Apex Chat</span>
            <span style={{fontSize:10,background:'var(--accent-dim)',color:'var(--accent)',
              border:'1px solid var(--accent-border)',padding:'2px 8px',borderRadius:10,
              fontWeight:600,fontFamily:'var(--font-mono)'}}>AI · Personal</span>
          </div>
          <div style={{fontSize:11,color:'var(--muted)',marginTop:2}}>
            Knows your watchlist · portfolio · notes · risk profile · conversation history
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          {/* Context status */}
          <div style={{display:'flex',gap:8}}>
            {[
              {label:'Profile', ok: ctx?.hasProfile},
              {label:`${ctx?.watchlistCount || 0} stocks`, ok: ctx?.watchlistCount > 0},
              {label:`${ctx?.ownedCount || 0} owned`, ok: ctx?.ownedCount > 0},
              {label:`${messages.length} msgs`, ok: messages.length > 0},
            ].map(item => (
              <div key={item.label} style={{fontSize:10,padding:'3px 8px',borderRadius:10,
                background:item.ok?'rgba(32,200,120,0.1)':'var(--surface2)',
                color:item.ok?'var(--green)':'var(--muted)',
                border:`1px solid ${item.ok?'rgba(32,200,120,0.2)':'var(--border)'}`,
                fontFamily:'var(--font-mono)'}}>
                {item.ok ? '✓' : '○'} {item.label}
              </div>
            ))}
          </div>
          {messages.length > 0 && (
            <button onClick={clearHistory}
              style={{padding:'5px 12px',background:'transparent',border:'1px solid var(--border2)',
                color:'var(--muted)',borderRadius:'var(--radius)',fontSize:11,cursor:'pointer'}}
              onMouseEnter={e=>{e.target.style.borderColor='var(--red)';e.target.style.color='var(--red)'}}
              onMouseLeave={e=>{e.target.style.borderColor='var(--border2)';e.target.style.color='var(--muted)'}}>
              Clear history
            </button>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div style={{flex:1,overflowY:'auto',padding:'14px 20px',display:'flex',flexDirection:'column',gap:8}}>

        {/* Welcome + suggestions */}
        {showSuggestions && messages.length === 0 && (
          <div>
            <div style={{maxWidth:560,margin:'0 auto 28px',textAlign:'center',paddingTop:20}}>
              <div style={{fontSize:32,marginBottom:12,opacity:0.2}}>◎</div>
              <div style={{fontSize:18,fontWeight:600,fontFamily:'var(--font-display)',marginBottom:8}}>
                Your investment research partner
              </div>
              <div style={{fontSize:13,color:'var(--text2)',lineHeight:1.8}}>
                I know your entire context — watchlist, portfolio, notes, risk profile, and past briefings.
                Ask me anything about your investments, strategy, or specific stocks.
              </div>
            </div>

            {/* Category tabs */}
            <div style={{display:'flex',gap:8,justifyContent:'center',marginBottom:16}}>
              {PROMPT_CATEGORIES.map((cat, i) => (
                <button key={i} onClick={() => setActiveCategory(i)}
                  style={{padding:'6px 14px',borderRadius:20,fontSize:12,fontWeight:500,
                    background:activeCategory===i?'var(--accent)':'var(--surface)',
                    color:activeCategory===i?'#fff':'var(--text2)',
                    border:`1px solid ${activeCategory===i?'var(--accent)':'var(--border)'}`,
                    cursor:'pointer',transition:'all 0.15s'}}>
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>

            {/* Prompt suggestions */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,maxWidth:700,margin:'0 auto'}}>
              {PROMPT_CATEGORIES[activeCategory].prompts.map((p, i) => (
                <button key={i} onClick={() => send(p)}
                  style={{padding:'12px 14px',background:'var(--surface)',
                    border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',
                    color:'var(--text2)',fontSize:12,textAlign:'left',cursor:'pointer',
                    transition:'all 0.15s',lineHeight:1.5}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--accent)';e.currentTarget.style.color='var(--text)'}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text2)'}}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, i) => (
          <div key={i} style={{display:'flex',
            justifyContent:msg.role==='user'?'flex-end':'flex-start',gap:10}}>
            {msg.role === 'assistant' && (
              <div style={{width:24,height:24,borderRadius:'50%',background:'var(--accent-dim)',
                border:'1px solid var(--accent-border)',display:'flex',alignItems:'center',
                justifyContent:'center',fontSize:10,flexShrink:0,marginTop:1}}>✦</div>
            )}
            <div style={{maxWidth:'82%',padding:msg.role==='user'?'8px 14px':'10px 14px',
              borderRadius:msg.role==='user'?'14px 14px 3px 14px':'6px 14px 14px 14px',
              background:msg.role==='user'?'var(--accent)':'var(--surface)',
              color:msg.role==='user'?'#fff':'var(--text)',
              border:msg.role==='assistant'?'1px solid var(--border)':'none',
              fontSize:12,lineHeight:1.5}}>
              {msg.role === 'assistant'
                ? <Markdown text={msg.content} />
                : msg.content}
            </div>
            {msg.role === 'user' && (
              <div style={{width:24,height:24,borderRadius:'50%',background:'var(--accent)',
                display:'flex',alignItems:'center',justifyContent:'center',
                fontSize:10,fontWeight:600,color:'#fff',flexShrink:0,marginTop:1}}>
                {user?.email?.[0]?.toUpperCase() || 'S'}
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:24,height:24,borderRadius:'50%',background:'var(--accent-dim)',
              border:'1px solid var(--accent-border)',display:'flex',alignItems:'center',
              justifyContent:'center',fontSize:10}}>✦</div>
            <div style={{padding:'8px 12px',background:'var(--surface)',
              border:'1px solid var(--border)',borderRadius:'6px 14px 14px 14px'}}>
              <div style={{display:'flex',gap:5,alignItems:'center'}}>
                {[0,1,2].map(j => (
                  <div key={j} style={{width:6,height:6,borderRadius:'50%',
                    background:'var(--accent)',opacity:0.6,
                    animation:`pulse 1.2s ease-in-out ${j*0.2}s infinite`}}/>
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef}/>
      </div>

      {/* Suggested follow-ups after messages */}
      {messages.length > 0 && !loading && !showSuggestions && (
        <div style={{padding:'8px 24px',borderTop:'1px solid var(--border)',
          background:'var(--surface)',flexShrink:0,overflowX:'auto'}}>
          <div style={{display:'flex',gap:6,whiteSpace:'nowrap'}}>
            <span style={{fontSize:10,color:'var(--muted)',alignSelf:'center',marginRight:4}}>Try:</span>
            {PROMPT_CATEGORIES[activeCategory].prompts.slice(0,3).map((p, i) => (
              <button key={i} onClick={() => send(p)}
                style={{padding:'4px 12px',background:'var(--surface2)',
                  border:'1px solid var(--border)',borderRadius:20,
                  color:'var(--text2)',fontSize:11,cursor:'pointer',
                  transition:'all 0.15s',whiteSpace:'nowrap',flexShrink:0}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--accent)';e.currentTarget.style.color='var(--accent)'}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text2)'}}>
                {p.length > 45 ? p.slice(0,45)+'…' : p}
              </button>
            ))}
            <select value={activeCategory} onChange={e=>setActiveCategory(Number(e.target.value))}
              style={{padding:'4px 8px',background:'var(--surface2)',border:'1px solid var(--border)',
                color:'var(--text2)',borderRadius:20,fontSize:11,cursor:'pointer'}}>
              {PROMPT_CATEGORIES.map((c,i) => <option key={i} value={i}>{c.icon} {c.label}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Input area */}
      <div style={{padding:'10px 20px',borderTop:'1px solid var(--border)',
        background:'var(--surface)',flexShrink:0}}>
        <div style={{display:'flex',gap:10,alignItems:'flex-end'}}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
            }}
            placeholder="Ask anything about your investments, strategy, or specific stocks… (Enter to send, Shift+Enter for new line)"
            rows={1}
            style={{flex:1,background:'var(--surface2)',border:'1px solid var(--border2)',
              color:'var(--text)',padding:'8px 12px',borderRadius:'var(--radius)',
              fontSize:12,outline:'none',resize:'none',lineHeight:1.5,
              fontFamily:'var(--font-sans)'}}
            onFocus={e=>e.target.style.borderColor='var(--accent)'}
            onBlur={e=>e.target.style.borderColor='var(--border2)'}
          />
          <button onClick={() => send()} disabled={!input.trim() || loading}
            style={{padding:'8px 16px',background:'var(--accent)',color:'#fff',
              border:'none',borderRadius:'var(--radius)',fontSize:12,fontWeight:600,
              opacity:!input.trim()||loading?0.4:1,cursor:'pointer',
              transition:'opacity 0.15s',flexShrink:0,height:36}}>
            {loading ? '…' : '↑ Send'}
          </button>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',marginTop:6}}>
          <div style={{fontSize:10,color:'var(--muted)',fontFamily:'var(--font-mono)'}}>
            History auto-saved · Knows your {ctx?.watchlistCount || 0} watchlist stocks · Shift+Enter for new line
          </div>
          <div style={{fontSize:10,color:'var(--muted)',fontFamily:'var(--font-mono)'}}>
            {savingHistory ? 'Saving…' : messages.length > 0 ? `${messages.length} messages` : ''}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.3); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
