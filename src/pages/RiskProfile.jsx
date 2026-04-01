import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth.jsx'
import { supabase } from '../lib/supabase'

const QUESTIONS = [
  {
    id: 'horizon',
    label: 'Investment horizon',
    sub: 'How long do you plan to hold before needing the money?',
    options: [
      { val: 'short',  label: '< 2 years',    desc: 'Short term' },
      { val: 'medium', label: '2–5 years',     desc: 'Medium term' },
      { val: 'long',   label: '5–10 years',    desc: 'Long term' },
      { val: 'vlong',  label: '10+ years',     desc: 'Very long term' },
    ]
  },
  {
    id: 'risk',
    label: 'Risk tolerance',
    sub: 'If your portfolio dropped 25% in a month, what would you do?',
    options: [
      { val: 'conservative', label: 'Sell everything', desc: 'Capital preservation first' },
      { val: 'moderate',     label: 'Hold and monitor', desc: 'Balanced approach' },
      { val: 'aggressive',   label: 'Buy more',         desc: 'Long-term conviction' },
      { val: 'very_aggressive', label: 'Buy aggressively', desc: 'Maximum growth' },
    ]
  },
  {
    id: 'style',
    label: 'Investment style',
    sub: 'Which best describes how you pick stocks?',
    options: [
      { val: 'value',   label: 'Value',   desc: 'Undervalued vs fundamentals' },
      { val: 'growth',  label: 'Growth',  desc: 'High earnings growth potential' },
      { val: 'income',  label: 'Income',  desc: 'Dividends and cash flow' },
      { val: 'quality', label: 'Quality', desc: 'Strong moats, high ROIC' },
    ]
  },
  {
    id: 'concentration',
    label: 'Portfolio concentration',
    sub: 'How do you prefer to invest?',
    options: [
      { val: 'concentrated', label: 'Concentrated', desc: '5–10 high-conviction stocks' },
      { val: 'moderate',     label: 'Moderate',     desc: '10–20 diversified picks' },
      { val: 'diversified',  label: 'Diversified',  desc: '20+ across sectors' },
    ]
  },
  {
    id: 'ai_focus',
    label: 'AI investment thesis',
    sub: 'Your specific angle on AI-era investing for non-tech companies',
    options: [
      { val: 'adopters',    label: 'AI adopters',    desc: 'Companies using AI to cut costs' },
      { val: 'beneficiaries', label: 'AI beneficiaries', desc: 'Revenue growth from AI tailwinds' },
      { val: 'both',        label: 'Both angles',    desc: 'Operational + revenue upside' },
      { val: 'skeptical',   label: 'Show me proof',  desc: 'Only when ROI is proven' },
    ]
  },
]

const GOALS_OPTIONS = [
  'Long-term wealth building',
  'Retirement funding',
  'Beat the S&P 500',
  'Dividend income',
  'Capital preservation with growth',
  'Sector-specific opportunities',
]

export async function getProfile(userId) {
  const { data } = await supabase.from('risk_profiles').select('*').eq('user_id', userId).single()
  return data
}

export async function saveProfile(userId, profile) {
  const { data, error } = await supabase.from('risk_profiles')
    .upsert({ user_id: userId, ...profile, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    .select()
  return { data, error }
}

export default function RiskProfile() {
  const { user } = useAuth()
  const [answers, setAnswers] = useState({})
  const [goals, setGoals] = useState([])
  const [additionalContext, setAdditionalContext] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    getProfile(user.id).then(data => {
      if (data) {
        setAnswers(data.answers || {})
        setGoals(data.goals || [])
        setAdditionalContext(data.additional_context || '')
      }
      setLoading(false)
    })
  }, [user])

  const toggleGoal = (g) => {
    setGoals(prev => prev.includes(g) ? prev.filter(x=>x!==g) : [...prev, g])
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    await saveProfile(user.id, { answers, goals, additional_context: additionalContext })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const complete = QUESTIONS.every(q => answers[q.id])

  if (loading) return (
    <div style={{padding:40, color:'var(--muted)', fontFamily:'var(--font-mono)', fontSize:12}}>Loading…</div>
  )

  return (
    <div style={{padding:'28px', maxWidth:760}}>
      <div style={{marginBottom:28}}>
        <h1 style={{fontFamily:'var(--font-display)', fontSize:28, letterSpacing:'-0.3px'}}>Your Investor Profile</h1>
        <p style={{color:'var(--text2)', fontSize:13, marginTop:6, lineHeight:1.6}}>
          This profile tells the AI adviser who you are as an investor. The more honest you are,
          the more relevant the analysis. This is stored privately and used only to personalize your briefings.
        </p>
      </div>

      {/* Questions */}
      {QUESTIONS.map((q, qi) => (
        <div key={q.id} style={{marginBottom:28}}>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:15, fontWeight:600, marginBottom:3}}>
              <span style={{fontFamily:'var(--font-mono)', color:'var(--accent)', marginRight:8, fontSize:12}}>
                {qi+1}/{QUESTIONS.length}
              </span>
              {q.label}
            </div>
            <div style={{fontSize:12, color:'var(--text2)'}}>{q.sub}</div>
          </div>
          <div style={{display:'grid', gridTemplateColumns:`repeat(${q.options.length}, 1fr)`, gap:8}}>
            {q.options.map(opt => {
              const selected = answers[q.id] === opt.val
              return (
                <button key={opt.val} onClick={()=>setAnswers(a=>({...a,[q.id]:opt.val}))}
                  style={{padding:'12px 14px', borderRadius:'var(--radius-lg)', textAlign:'left',
                    background: selected ? 'var(--accent-dim)' : 'var(--surface)',
                    border: `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
                    color: 'var(--text)', transition:'all 0.15s', cursor:'pointer'}}>
                  <div style={{fontSize:13, fontWeight:600, marginBottom:3, color: selected?'var(--accent)':'var(--text)'}}>
                    {opt.label}
                  </div>
                  <div style={{fontSize:11, color:'var(--text2)'}}>{opt.desc}</div>
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {/* Goals */}
      <div style={{marginBottom:28}}>
        <div style={{fontSize:15, fontWeight:600, marginBottom:4}}>Investment goals</div>
        <div style={{fontSize:12, color:'var(--text2)', marginBottom:12}}>Select all that apply</div>
        <div style={{display:'flex', flexWrap:'wrap', gap:8}}>
          {GOALS_OPTIONS.map(g => {
            const selected = goals.includes(g)
            return (
              <button key={g} onClick={()=>toggleGoal(g)}
                style={{padding:'7px 14px', borderRadius:20, fontSize:12, fontWeight:500,
                  background: selected?'var(--accent)':'var(--surface)',
                  color: selected?'#fff':'var(--text2)',
                  border:`1px solid ${selected?'var(--accent)':'var(--border)'}`,
                  transition:'all 0.15s', cursor:'pointer'}}>
                {g}
              </button>
            )
          })}
        </div>
      </div>

      {/* Additional context */}
      <div style={{marginBottom:28}}>
        <div style={{fontSize:15, fontWeight:600, marginBottom:4}}>Anything else the AI should know?</div>
        <div style={{fontSize:12, color:'var(--text2)', marginBottom:12}}>
          e.g. "I work in data engineering so I understand tech well" · "I'm planning to retire in 15 years" · "I already have index funds, this is my satellite portfolio"
        </div>
        <textarea value={additionalContext} onChange={e=>setAdditionalContext(e.target.value)}
          placeholder="Optional — add any personal context that would help the AI adviser give better advice…"
          style={{width:'100%', background:'var(--surface)', border:'1px solid var(--border)',
            color:'var(--text)', padding:'12px 14px', borderRadius:'var(--radius-lg)',
            fontSize:13, resize:'vertical', minHeight:100, outline:'none',
            fontFamily:'var(--font-body)', lineHeight:1.6}}
          onFocus={e=>e.target.style.borderColor='var(--accent)'}
          onBlur={e=>e.target.style.borderColor='var(--border)'}/>
      </div>

      {/* Save */}
      <button onClick={handleSave} disabled={saving || !complete}
        style={{padding:'11px 28px', background: saved?'var(--green-dim)':complete?'var(--accent)':'var(--border2)',
          color: saved?'var(--green)':complete?'#fff':'var(--muted)',
          border: saved?'1px solid rgba(32,200,120,0.4)':'none',
          borderRadius:'var(--radius)', fontSize:14, fontWeight:600,
          opacity: saving?0.7:1, transition:'all 0.2s', cursor: complete?'pointer':'not-allowed'}}>
        {saving ? 'Saving…' : saved ? '✓ Profile saved' : !complete ? 'Answer all questions to save' : 'Save profile'}
      </button>
    </div>
  )
}
