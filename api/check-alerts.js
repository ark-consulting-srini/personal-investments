import { createClient } from '@supabase/supabase-js'
import { fetchPrices, isMarketOpen } from './lib/prices.js'
import { sendEmail, thresholdAlertHtml, bigMoveAlertHtml } from './lib/email.js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // server-side: use service role key
)

const BIG_MOVE_THRESHOLD = 3.0 // percent

export default async function handler(req, res) {
  // Verify this is called by Vercel Cron (or allow manual trigger with secret)
  const authHeader = req.headers.authorization
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Skip if market is closed
  if (!isMarketOpen()) {
    return res.status(200).json({ message: 'Market closed, skipping check' })
  }

  try {
    // 1. Get all users and their watchlists + alerts
    const { data: watchlistRows } = await supabase
      .from('watchlist')
      .select('user_id, ticker, name')

    if (!watchlistRows?.length) {
      return res.status(200).json({ message: 'No watchlist entries' })
    }

    // 2. Get unique tickers and fetch prices
    const tickers = [...new Set(watchlistRows.map(r => r.ticker))]
    const prices = await fetchPrices(tickers)

    // 3. Get all untriggered alerts
    const { data: alerts } = await supabase
      .from('alerts')
      .select('*, user:user_id(email:auth.users(email))')
      .eq('triggered', false)

    // Get user emails from auth
    const { data: { users } } = await supabase.auth.admin.listUsers()
    const userEmailMap = {}
    users?.forEach(u => { userEmailMap[u.id] = u.email })

    const emailsSent = []

    // 4. Check threshold alerts
    for (const alert of (alerts || [])) {
      const pr = prices[alert.ticker]
      if (!pr) continue

      const triggered =
        (alert.type === 'above' && pr.price >= alert.target_price) ||
        (alert.type === 'below' && pr.price <= alert.target_price)

      if (!triggered) continue

      const userEmail = userEmailMap[alert.user_id]
      if (!userEmail) continue

      // Mark alert as triggered
      await supabase
        .from('alerts')
        .update({ triggered: true, triggered_at: new Date().toISOString() })
        .eq('id', alert.id)

      // Find company name
      const wl = watchlistRows.find(w => w.ticker === alert.ticker && w.user_id === alert.user_id)
      const name = wl?.name || alert.ticker

      // Send email
      await sendEmail({
        to: userEmail,
        subject: `🎯 ${alert.ticker} ${alert.type === 'above' ? 'rose above' : 'fell below'} $${parseFloat(alert.target_price).toFixed(2)}`,
        html: thresholdAlertHtml({
          ticker: alert.ticker,
          name,
          currentPrice: pr.price,
          targetPrice: parseFloat(alert.target_price),
          direction: alert.type,
          change: pr.changePct,
        }),
      })
      emailsSent.push({ type: 'threshold', ticker: alert.ticker, user: userEmail })
    }

    // 5. Check big moves for each user's watchlist
    // Group watchlist by user
    const byUser = {}
    watchlistRows.forEach(row => {
      if (!byUser[row.user_id]) byUser[row.user_id] = []
      byUser[row.user_id].push(row)
    })

    for (const [userId, items] of Object.entries(byUser)) {
      const userEmail = userEmailMap[userId]
      if (!userEmail) continue

      for (const item of items) {
        const pr = prices[item.ticker]
        if (!pr) continue

        const isBigMove = Math.abs(pr.changePct) >= BIG_MOVE_THRESHOLD

        if (!isBigMove) continue

        // Check if we already sent a big move alert for this ticker today
        const today = new Date().toISOString().split('T')[0]
        const { data: existing } = await supabase
          .from('sent_alerts_log')
          .select('id')
          .eq('user_id', userId)
          .eq('ticker', item.ticker)
          .eq('type', 'big_move')
          .gte('sent_at', `${today}T00:00:00.000Z`)
          .limit(1)

        if (existing?.length) continue // already sent today

        await sendEmail({
          to: userEmail,
          subject: `📈 ${item.ticker} ${pr.changePct >= 0 ? 'up' : 'down'} ${Math.abs(pr.changePct).toFixed(1)}% today`,
          html: bigMoveAlertHtml({
            ticker: item.ticker,
            name: item.name,
            currentPrice: pr.price,
            changePct: pr.changePct,
            prevClose: pr.prev,
          }),
        })

        // Log it so we don't send twice in a day
        await supabase.from('sent_alerts_log').insert({
          user_id: userId,
          ticker: item.ticker,
          type: 'big_move',
          sent_at: new Date().toISOString(),
        })

        emailsSent.push({ type: 'big_move', ticker: item.ticker, user: userEmail })
      }
    }

    return res.status(200).json({
      success: true,
      checked: tickers.length,
      emailsSent: emailsSent.length,
      details: emailsSent,
    })

  } catch (err) {
    console.error('Cron error:', err)
    return res.status(500).json({ error: err.message })
  }
}
