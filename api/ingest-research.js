/**
 * /api/ingest-research
 *
 * Email-to-Apex bridge. Reads Gmail for emails with [APEX] in the subject
 * sent from/to the user's own address, extracts research content,
 * has Claude structure it, then saves to research_notes in Supabase.
 *
 * Triggered by:
 *   - Vercel cron: daily at 7am ET (catches overnight research emails)
 *   - Manual: GET /api/ingest-research from the app
 *
 * Email format (you send to yourself):
 *   Subject: [APEX] EOG - strong thesis, buying at support
 *   Body: Paste your Claude research summary here. Any format works.
 *         Claude will extract ticker, sentiment, conviction, and key points.
 *
 * Multiple tickers: [APEX] EOG, COP - energy sector analysis
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// ─── Parse tickers from subject line ─────────────────────────────────────────
function parseSubject(subject) {
  // Extract content after [APEX]
  const match = subject.match(/\[APEX\]\s*(.+)/i)
  if (!match) return null
  const rest = match[1].trim()

  // Extract tickers — all-caps words of 2-5 chars before the first dash/comma/colon
  const tickerMatch = rest.match(/^([A-Z,\s]+?)(?:\s*[-:—]|$)/)
  const tickers = tickerMatch
    ? tickerMatch[1].split(/[,\s]+/).filter(t => t.match(/^[A-Z]{1,5}$/))
    : []

  // Rest is the title
  const title = rest.replace(/^[A-Z,\s]+[-:—]\s*/, '').trim() || rest

  return { tickers, title }
}

// ─── Use Claude to structure the note ────────────────────────────────────────
async function structureNote(title, tickers, content, claudeKey) {
  const prompt = `You are extracting structured data from an investment research note.

Title: ${title}
Tickers mentioned: ${tickers.join(', ') || 'unknown'}

Research note content:
---
${content.slice(0, 3000)}
---

Return ONLY valid JSON with these exact fields:
{
  "sentiment": "bullish" | "bearish" | "neutral" | "watching",
  "conviction": 1-5 (1=low, 5=high),
  "time_horizon": "short" | "medium" | "long",
  "note_type": "thesis" | "signal" | "warning" | "question" | "observation",
  "summary": "2-3 sentence plain English summary of the key insight",
  "tags": ["array", "of", "relevant", "tags"],
  "additional_tickers": ["any", "tickers", "mentioned", "in", "body", "not", "in", "subject"]
}

Return only JSON. No markdown, no explanation.`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': claudeKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  const data = await res.json()
  const text = data.content?.[0]?.text || '{}'
  try {
    return JSON.parse(text.replace(/```json|```/g, '').trim())
  } catch {
    return { sentiment: 'neutral', conviction: 3, time_horizon: 'medium', note_type: 'observation', summary: content.slice(0, 200), tags: [] }
  }
}

// ─── Fetch Gmail emails with [APEX] subject via Gmail API ─────────────────────
async function fetchApexEmails(gmailToken, processedRefs = new Set()) {
  // Use Gmail REST API directly — search for [APEX] emails
  const query = encodeURIComponent('subject:[APEX]')
  const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${query}&maxResults=20`

  const listRes = await fetch(url, {
    headers: { Authorization: `Bearer ${gmailToken}` },
  })
  if (!listRes.ok) throw new Error(`Gmail list: ${listRes.status}`)
  const list = await listRes.json()
  if (!list.messages?.length) return []

  const emails = []
  for (const msg of list.messages) {
    if (processedRefs.has(msg.id)) continue

    const msgRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
      { headers: { Authorization: `Bearer ${gmailToken}` } }
    )
    if (!msgRes.ok) continue
    const msgData = await msgRes.json()

    const headers = {}
    msgData.payload?.headers?.forEach(h => { headers[h.name.toLowerCase()] = h.value })

    const parsed = parseSubject(headers.subject || '')
    if (!parsed) continue

    // Extract plain text body
    let body = ''
    const extractText = (part) => {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        body += Buffer.from(part.body.data, 'base64').toString('utf-8')
      }
      part.parts?.forEach(extractText)
    }
    extractText(msgData.payload)

    emails.push({
      messageId: msg.id,
      subject: headers.subject,
      date: headers.date,
      tickers: parsed.tickers,
      title: parsed.title,
      body: body.trim() || msgData.snippet || '',
    })
  }
  return emails
}

// ─── Main handler ─────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  // Accept GET (manual trigger from app) or Vercel cron
  const claudeKey = process.env.CLAUDE_API_KEY || process.env.VITE_CLAUDE_API_KEY
  const gmailToken = req.headers['x-gmail-token'] || process.env.GMAIL_ACCESS_TOKEN

  if (!claudeKey) {
    return res.status(500).json({ error: 'CLAUDE_API_KEY not configured' })
  }

  // If no Gmail token, return instructions for the manual workflow
  if (!gmailToken) {
    return res.status(200).json({
      mode: 'manual',
      message: 'Gmail OAuth token not available server-side. Use the in-app Research Inbox to capture notes directly, or send emails with [APEX] in subject and use the Sync button in the app.',
      emailFormat: {
        subject: '[APEX] TICKER - your thesis title',
        body: 'Paste your Claude research summary here. Any format works.',
        example: '[APEX] EOG, COP - Energy thesis: AI data center power demand thesis',
      }
    })
  }

  try {
    // Get already-processed email IDs from Supabase to avoid duplicates
    const { data: existing } = await supabase
      .from('research_notes')
      .select('source_ref')
      .eq('source', 'email')
    const processedRefs = new Set((existing || []).map(r => r.source_ref).filter(Boolean))

    // Fetch new emails
    const emails = await fetchApexEmails(gmailToken, processedRefs)

    if (!emails.length) {
      return res.status(200).json({ ingested: 0, message: 'No new [APEX] emails found' })
    }

    // Process each email through Claude
    const ingested = []
    for (const email of emails) {
      const structured = await structureNote(email.title, email.tickers, email.body, claudeKey)
      const allTickers = [...new Set([...email.tickers, ...(structured.additional_tickers || [])])]

      // We need a user_id — use service role to find by email
      // For now, insert without user_id (public research capture)
      const { data: note, error } = await supabase
        .from('research_notes')
        .insert({
          tickers: allTickers,
          title: email.title,
          content: email.body,
          note_type: structured.note_type || 'observation',
          source: 'email',
          source_ref: email.messageId,
          sentiment: structured.sentiment,
          conviction: structured.conviction,
          time_horizon: structured.time_horizon,
          tags: structured.tags || [],
        })
        .select()
        .single()

      if (!error) ingested.push({ title: email.title, tickers: allTickers, sentiment: structured.sentiment })
    }

    return res.status(200).json({
      ingested: ingested.length,
      notes: ingested,
      message: `Ingested ${ingested.length} research note${ingested.length !== 1 ? 's' : ''} from email`,
    })
  } catch (err) {
    console.error('ingest-research error:', err)
    return res.status(500).json({ error: err.message })
  }
}
