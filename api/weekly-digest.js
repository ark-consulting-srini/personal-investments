import { createClient } from '@supabase/supabase-js'
import { fetchPrices } from './lib/prices.js'
import { sendEmail } from './lib/email.js'
import { COMPANIES_SCORED } from '../src/lib/data.js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Call Claude to write AI digest
async function generateAIDigest({ stocks, profile, date }) {
  const profileSummary = profile ? `
Investor: ${profile.answers?.style || 'quality'} style, ${profile.answers?.risk || 'moderate'} risk, ${profile.answers?.horizon || 'long'} horizon.
Goals: ${(profile.goals || []).join(', ') || 'not set'}.
AI angle: ${profile.answers?.ai_focus || 'both'}.` : 'No profile set.'

  const stockSummary = stocks.map(s => ({
    ticker: s.ticker, name: s.name, sector: s.sector,
    score: s.score,
    price: s.price ? `$${s.price.toFixed(2)} (${s.changePct >= 0 ? '+' : ''}${s.changePct?.toFixed(2)}%)` : 'price unavailable',
    metrics: { roic: s.roic, fcf: s.fcf, peg: s.peg, oplev: s.oplev },
    note: s.note || null,
  }))

  const prompt = `Write a concise, personalized weekly investment digest for Sri.

${profileSummary}

His watchlist this week:
${JSON.stringify(stockSummary, null, 2)}

Write in 3 sections:
1. **Week in review** (2-3 sentences on what stood out in the watchlist)
2. **Top focus this week** (1-2 stocks worth paying attention to and why, with specific metrics)
3. **One thought** (a brief observation about his portfolio strategy or AI adoption thesis)

Tone: like a smart friend who follows markets, not a formal report. Be specific to his actual stocks.
Keep total length under 300 words. Do not add disclaimers — this is a personal tool.`

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
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    const data = await res.json()
    return data.content?.[0]?.text || null
  } catch {
    return null
  }
}

function digestEmailHtml({ stocks, aiContent, date, userEmail }) {
  const rows = stocks.map(s => {
    const up = s.changePct >= 0
    const scoreColor = s.score >= 4 ? '#20c878' : s.score === 3 ? '#f4a724' : '#f05252'
    return `
    <tr style="border-bottom:1px solid #1f2235;">
      <td style="padding:10px 12px;font-family:monospace;color:#5b8af0;font-weight:700;font-size:13px;">${s.ticker}</td>
      <td style="padding:10px 12px;color:#e8eaf2;font-size:12px;">${s.name}</td>
      <td style="padding:10px 12px;font-family:monospace;font-size:13px;color:#e8eaf2;text-align:right;">
        ${s.price ? `$${s.price.toFixed(2)}` : '—'}
      </td>
      <td style="padding:10px 12px;font-family:monospace;font-size:13px;color:${up?'#20c878':'#f05252'};text-align:right;">
        ${s.changePct != null ? `${up?'+':''}${s.changePct.toFixed(2)}%` : '—'}
      </td>
      <td style="padding:10px 12px;text-align:center;">
        <span style="background:${scoreColor}22;color:${scoreColor};padding:2px 8px;border-radius:4px;font-family:monospace;font-size:11px;font-weight:600;">${s.score}/5</span>
      </td>
    </tr>`
  }).join('')

  const aiSection = aiContent ? `
  <div style="padding:20px 28px;border-bottom:1px solid #1f2235;">
    <div style="font-size:11px;color:#545878;font-family:monospace;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;">✦ AI ADVISER NOTES</div>
    <div style="font-size:13px;color:#c8cad8;line-height:1.8;white-space:pre-wrap;">${aiContent}</div>
  </div>` : ''

  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0a0c10;font-family:'Helvetica Neue',Arial,sans-serif;">
<div style="max-width:640px;margin:32px auto;background:#111318;border:1px solid #1f2235;border-radius:12px;overflow:hidden;">
  <div style="background:#161820;padding:20px 28px;border-bottom:1px solid #1f2235;display:flex;justify-content:space-between;align-items:center;">
    <div>
      <span style="font-size:22px;font-weight:700;color:#e8eaf2;letter-spacing:-0.5px;">Apex</span>
      <span style="font-size:11px;color:#545878;margin-left:10px;font-family:monospace;">WEEKLY DIGEST</span>
    </div>
    <div style="font-size:11px;color:#545878;font-family:monospace;">${date}</div>
  </div>

  ${aiSection}

  <div style="padding:20px 28px 12px;">
    <div style="font-size:11px;color:#545878;font-family:monospace;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;">WATCHLIST SNAPSHOT</div>
    <table style="width:100%;border-collapse:collapse;background:#0a0c10;border-radius:8px;overflow:hidden;border:1px solid #1f2235;">
      <thead>
        <tr style="background:#161820;border-bottom:1px solid #1f2235;">
          <th style="padding:8px 12px;text-align:left;font-size:9px;font-family:monospace;color:#545878;text-transform:uppercase;letter-spacing:0.5px;">Ticker</th>
          <th style="padding:8px 12px;text-align:left;font-size:9px;font-family:monospace;color:#545878;text-transform:uppercase;letter-spacing:0.5px;">Company</th>
          <th style="padding:8px 12px;text-align:right;font-size:9px;font-family:monospace;color:#545878;text-transform:uppercase;letter-spacing:0.5px;">Price</th>
          <th style="padding:8px 12px;text-align:right;font-size:9px;font-family:monospace;color:#545878;text-transform:uppercase;letter-spacing:0.5px;">Day Chg</th>
          <th style="padding:8px 12px;text-align:center;font-size:9px;font-family:monospace;color:#545878;text-transform:uppercase;letter-spacing:0.5px;">Score</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>

  <div style="padding:16px 28px 20px;">
    <a href="${process.env.VITE_APP_URL || 'https://personal-investments-41mm.vercel.app'}"
      style="display:block;background:#5b8af0;color:#fff;text-align:center;padding:12px;border-radius:8px;font-weight:600;font-size:14px;text-decoration:none;">
      Open Apex Dashboard →
    </a>
  </div>

  <div style="padding:14px 28px;border-top:1px solid #1f2235;font-size:10px;color:#545878;font-family:monospace;">
    Apex Investment Research · Weekly digest · Personal use only · Not financial advice
  </div>
</div>
</body></html>`
}

export default async function handler(req, res) {
  const authHeader = req.headers.authorization
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
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

      // Get user's risk profile and notes
      const [{ data: profile }, { data: notes }] = await Promise.all([
        supabase.from('risk_profiles').select('*').eq('user_id', userId).single(),
        supabase.from('notes').select('*').eq('user_id', userId),
      ])

      const stocks = items.map(item => {
        const pr = prices[item.ticker]
        const co = COMPANIES_SCORED.find(c => c.ticker === item.ticker)
        const note = notes?.find(n => n.ticker === item.ticker)
        return {
          ticker: item.ticker, name: item.name,
          sector: item.sector || co?.sector,
          price: pr?.price ?? null, changePct: pr?.changePct ?? null,
          score: co?.score ?? '—',
          roic: co?.roic, fcf: co?.fcf, peg: co?.peg, oplev: co?.oplev,
          note: note?.content || null,
        }
      }).sort((a, b) => (b.score || 0) - (a.score || 0))

      // Generate AI content if Claude key is available
      let aiContent = null
      if (process.env.VITE_CLAUDE_API_KEY) {
        aiContent = await generateAIDigest({ stocks, profile, date })
      }

      await sendEmail({
        to: userEmail,
        subject: `📊 Apex Weekly — ${date}`,
        html: digestEmailHtml({ stocks, aiContent, date, userEmail }),
      })

      sent.push({ user: userEmail, stocks: stocks.length, hasAI: !!aiContent })
    }

    return res.status(200).json({ success: true, digestsSent: sent.length, details: sent })
  } catch (err) {
    console.error('Weekly digest error:', err)
    return res.status(500).json({ error: err.message })
  }
}
