import { createClient } from '@supabase/supabase-js'
import { fetchPrices } from './lib/prices.js'
import { sendEmail } from './lib/email.js'
import { COMPANIES_SCORED, TECH_COMPANIES } from '../src/lib/data.js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// ─── Claude: compact structured weekly digest ─────────────────────────────────
async function generateAIDigest({ stocks, profile, date }) {
  const profileSummary = profile?.answers
    ? `${profile.answers.style} style · ${profile.answers.risk} risk · ${profile.answers.horizon} horizon · AI focus: ${profile.answers.ai_focus}`
    : 'No profile set'

  const stockLines = stocks.map(s =>
    `${s.ticker} (${s.sector}) score:${s.score}/5 fcf:${s.fcf}% peg:${s.peg} oplev:${s.oplev}pp price:${s.price ? '$'+s.price.toFixed(2)+'('+( s.changePct>=0?'+':'')+s.changePct?.toFixed(1)+'%)' : 'n/a'}${s.note ? ` note:"${s.note}"` : ''}`
  ).join('\n')

  const prompt = `You are Apex AI — investment research assistant for Sri (data engineer, Fullerton CA, AI adoption thesis).

Profile: ${profileSummary}

Watchlist this week:
${stockLines}

Write a compact weekly digest email in exactly this format — no prose paragraphs, bullets only:

**Week in review**
· [what stood out this week — reference specific tickers and price moves]
· [one metric observation across the watchlist]

**Top focus this week**
· [best opportunity ticker] — [specific reason with metric]
· Signal: [what the data is showing]
· Risk: [honest concern]

**One thought**
· [brief observation on AI adoption thesis or portfolio construction — 1-2 bullets max]

💬 Question to sit with this week: [one research question Sri should investigate]

Rules: max 120 words, bullets only, use real tickers and numbers, be direct.`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.VITE_CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    const data = await res.json()
    return data.content?.[0]?.text || null
  } catch { return null }
}

// ─── Convert markdown bullets to HTML for email ───────────────────────────────
function mdToEmailHtml(text) {
  if (!text) return ''
  const lines = text.split('\n')
  let html = ''

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) { html += '<div style="height:6px"></div>'; continue }

    // Section header **text**
    if (line.match(/^\*\*[^*]+\*\*$/)) {
      const txt = line.slice(2, -2)
      html += `<div style="font-size:10px;font-weight:700;color:#5b8af0;text-transform:uppercase;
        letter-spacing:0.7px;margin:14px 0 5px;display:flex;align-items:center;gap:6px;">
        <span style="width:2px;height:10px;background:#5b8af0;border-radius:1px;display:inline-block"></span>
        ${txt}</div>`
      continue
    }

    // Signal / Risk / Verdict pills
    const pillMatch = line.match(/^[·\-*]\s*(Signal|Risk|Verdict|Watch):\s*(.+)/)
    if (pillMatch) {
      const colors = {
        Signal:  { bg:'#20c87820', color:'#20c878', border:'#20c87840' },
        Risk:    { bg:'#f0525215', color:'#f05252', border:'#f0525230' },
        Verdict: { bg:'#5b8af015', color:'#5b8af0', border:'#5b8af030' },
        Watch:   { bg:'#f4a72415', color:'#f4a724', border:'#f4a72430' },
      }
      const c = colors[pillMatch[1]]
      html += `<div style="display:flex;align-items:flex-start;gap:7px;margin-bottom:4px;">
        <span style="font-size:9px;font-weight:700;padding:2px 6px;border-radius:3px;
          background:${c.bg};color:${c.color};border:1px solid ${c.border};
          flex-shrink:0;margin-top:1px;font-family:monospace;letter-spacing:0.3px;">${pillMatch[1]}</span>
        <span style="font-size:12px;color:#c8cad8;line-height:1.6;">${pillMatch[2]}</span>
      </div>`
      continue
    }

    // 💬 Next question callout
    if (line.startsWith('💬')) {
      html += `<div style="margin-top:12px;padding:8px 12px;background:#5b8af010;
        border-left:2px solid #5b8af0;border-radius:0 4px 4px 0;
        font-size:11px;color:#8890b8;line-height:1.6;">${line}</div>`
      continue
    }

    // Regular bullet
    if (line.match(/^[·\-*•] /)) {
      const txt = line.replace(/^[·\-*•] /, '')
        .replace(/\*\*([^*]+)\*\*/g, '<strong style="color:#e8eaf2;font-weight:600;">$1</strong>')
      html += `<div style="display:flex;gap:7px;margin-bottom:3px;padding-left:2px;">
        <span style="color:#5b8af0;flex-shrink:0;font-size:10px;margin-top:3px;line-height:1;">▸</span>
        <span style="font-size:12px;color:#c8cad8;line-height:1.65;">${txt}</span>
      </div>`
      continue
    }

    // Plain text fallback
    html += `<p style="font-size:12px;color:#8890b8;line-height:1.7;margin:2px 0;">${line}</p>`
  }
  return html
}

// ─── Email HTML template ──────────────────────────────────────────────────────
function digestEmailHtml({ stocks, aiContent, date }) {
  const rows = stocks.map(s => {
    const up = (s.changePct || 0) >= 0
    const scoreColor = s.score >= 4 ? '#20c878' : s.score === 3 ? '#f4a724' : '#f05252'
    return `<tr style="border-bottom:1px solid #1f2235;">
      <td style="padding:8px 12px;font-family:monospace;color:#5b8af0;font-weight:700;font-size:12px;">${s.ticker}</td>
      <td style="padding:8px 12px;color:#c8cad8;font-size:11px;">${s.name}</td>
      <td style="padding:8px 12px;font-family:monospace;font-size:12px;color:#e8eaf2;text-align:right;">${s.price ? '$'+s.price.toFixed(2) : '—'}</td>
      <td style="padding:8px 12px;font-family:monospace;font-size:12px;color:${up?'#20c878':'#f05252'};text-align:right;">${s.changePct != null ? (up?'+':'')+s.changePct.toFixed(2)+'%' : '—'}</td>
      <td style="padding:8px 12px;text-align:center;">
        <span style="background:${scoreColor}22;color:${scoreColor};padding:2px 7px;border-radius:3px;font-family:monospace;font-size:10px;font-weight:700;">${s.score}/5</span>
      </td>
    </tr>`
  }).join('')

  const aiHtml = mdToEmailHtml(aiContent)

  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#0a0c10;font-family:'Helvetica Neue',Arial,sans-serif;">
<div style="max-width:600px;margin:28px auto;background:#111318;border:1px solid #1f2235;border-radius:10px;overflow:hidden;">

  <!-- Header -->
  <div style="background:#161820;padding:16px 24px;border-bottom:1px solid #1f2235;display:flex;justify-content:space-between;align-items:center;">
    <div>
      <span style="font-size:20px;font-weight:700;color:#e8eaf2;letter-spacing:-0.5px;">Apex</span>
      <span style="font-size:10px;color:#545878;margin-left:8px;font-family:monospace;text-transform:uppercase;letter-spacing:0.5px;">Weekly Digest</span>
    </div>
    <div style="font-size:10px;color:#545878;font-family:monospace;">${date}</div>
  </div>

  <!-- AI Section -->
  ${aiHtml ? `
  <div style="padding:18px 24px;border-bottom:1px solid #1f2235;">
    <div style="font-size:10px;color:#545878;font-family:monospace;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:12px;">
      ✦ AI Adviser · Weekly briefing
    </div>
    ${aiHtml}
  </div>` : ''}

  <!-- Watchlist table -->
  <div style="padding:16px 24px 12px;">
    <div style="font-size:10px;color:#545878;font-family:monospace;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">Watchlist snapshot</div>
    <table style="width:100%;border-collapse:collapse;background:#0d0f14;border:1px solid #1f2235;border-radius:6px;overflow:hidden;">
      <thead>
        <tr style="background:#161820;border-bottom:1px solid #1f2235;">
          <th style="padding:6px 12px;text-align:left;font-size:9px;font-family:monospace;color:#545878;text-transform:uppercase;letter-spacing:0.5px;">Ticker</th>
          <th style="padding:6px 12px;text-align:left;font-size:9px;font-family:monospace;color:#545878;text-transform:uppercase;letter-spacing:0.5px;">Company</th>
          <th style="padding:6px 12px;text-align:right;font-size:9px;font-family:monospace;color:#545878;text-transform:uppercase;letter-spacing:0.5px;">Price</th>
          <th style="padding:6px 12px;text-align:right;font-size:9px;font-family:monospace;color:#545878;text-transform:uppercase;letter-spacing:0.5px;">Chg</th>
          <th style="padding:6px 12px;text-align:center;font-size:9px;font-family:monospace;color:#545878;text-transform:uppercase;letter-spacing:0.5px;">Score</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>

  <!-- CTA -->
  <div style="padding:14px 24px 18px;">
    <a href="${process.env.VITE_APP_URL || 'https://srk-personal-investments.vercel.app'}"
      style="display:block;background:#5b8af0;color:#fff;text-align:center;padding:10px;border-radius:6px;font-weight:600;font-size:13px;text-decoration:none;">
      Open Apex →
    </a>
  </div>

  <!-- Footer -->
  <div style="padding:10px 24px;border-top:1px solid #1f2235;font-size:9px;color:#545878;font-family:monospace;">
    Apex · Personal research only · Not financial advice
  </div>
</div>
</body></html>`
}

// ─── Handler ──────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const { data: watchlistRows } = await supabase.from('watchlist').select('*')
    if (!watchlistRows?.length) return res.status(200).json({ message: 'No watchlist entries' })

    const tickers = [...new Set(watchlistRows.map(r => r.ticker))]
    const prices = await fetchPrices(tickers)

    const { data: { users } } = await supabase.auth.admin.listUsers()
    const userEmailMap = {}
    users?.forEach(u => { userEmailMap[u.id] = u.email })

    const byUser = {}
    watchlistRows.forEach(row => {
      if (!byUser[row.user_id]) byUser[row.user_id] = []
      byUser[row.user_id].push(row)
    })

    const date = new Date().toLocaleDateString('en-US', {
      weekday:'long', year:'numeric', month:'long', day:'numeric', timeZone:'America/New_York'
    })

    const sent = []

    for (const [userId, items] of Object.entries(byUser)) {
      const userEmail = userEmailMap[userId]
      if (!userEmail) continue

      const [{ data: profile }, { data: notes }] = await Promise.all([
        supabase.from('risk_profiles').select('*').eq('user_id', userId).single(),
        supabase.from('notes').select('*').eq('user_id', userId),
      ])

      // Unified lookup — covers main 100 + tech universe
      const ALL_COMPANIES = [
        ...COMPANIES_SCORED,
        ...TECH_COMPANIES.map(t => ({
          ...t,
          score: t.peg < 1.5 ? 5 : t.peg < 2 ? 4 : t.peg < 2.5 ? 3 : 2,
        }))
      ]

      const stocks = items.map(item => {
        const pr = prices[item.ticker]
        const co = ALL_COMPANIES.find(c => c.ticker === item.ticker)
        const note = notes?.find(n => n.ticker === item.ticker)
        return {
          ticker: item.ticker, name: item.name,
          sector: item.sector || co?.sector,
          price: pr?.price ?? null, changePct: pr?.changePct ?? null,
          score: co?.score ?? '—',
          fcf: co?.fcf, peg: co?.peg, oplev: co?.oplev,
          note: note?.content || null,
        }
      }).sort((a, b) => (b.score || 0) - (a.score || 0))

      let aiContent = null
      if (process.env.VITE_CLAUDE_API_KEY) {
        aiContent = await generateAIDigest({ stocks, profile, date })
      }

      await sendEmail({
        to: userEmail,
        subject: `Apex Weekly · ${new Date().toLocaleDateString('en-US',{month:'short',day:'numeric'})}`,
        html: digestEmailHtml({ stocks, aiContent, date }),
      })

      sent.push({ user: userEmail, stocks: stocks.length, hasAI: !!aiContent })
    }

    return res.status(200).json({ success: true, digestsSent: sent.length, details: sent })
  } catch (err) {
    console.error('Weekly digest error:', err)
    return res.status(500).json({ error: err.message })
  }
}
