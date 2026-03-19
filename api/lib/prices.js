// Fetch live price data from Yahoo Finance (server-side, no CORS proxy needed)
export async function fetchPrice(ticker) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    })
    if (!res.ok) return null
    const data = await res.json()
    const meta = data?.chart?.result?.[0]?.meta
    if (!meta) return null
    const price = meta.regularMarketPrice
    const prev = meta.chartPreviousClose
    return {
      ticker,
      price,
      prev,
      change: price - prev,
      changePct: ((price - prev) / prev) * 100,
    }
  } catch {
    return null
  }
}

export async function fetchPrices(tickers) {
  const results = await Promise.allSettled(tickers.map(t => fetchPrice(t)))
  const prices = {}
  results.forEach((r, i) => {
    if (r.status === 'fulfilled' && r.value) {
      prices[tickers[i]] = r.value
    }
  })
  return prices
}

// Is the US market currently open? (Mon-Fri, 9:30am-4pm ET)
export function isMarketOpen() {
  const now = new Date()
  const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  const day = et.getDay() // 0=Sun, 6=Sat
  if (day === 0 || day === 6) return false
  const hours = et.getHours()
  const mins = et.getMinutes()
  const totalMins = hours * 60 + mins
  return totalMins >= 570 && totalMins <= 960 // 9:30am=570, 4:00pm=960
}
