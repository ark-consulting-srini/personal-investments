import { useState, useCallback } from 'react'

// Uses allorigins.win as a CORS proxy to fetch Yahoo Finance data
const PROXY = 'https://api.allorigins.win/get?url='

export function useMarketData() {
  const [prices, setPrices] = useState({})
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchPrice = useCallback(async (ticker) => {
    try {
      const url = encodeURIComponent(
        `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`
      )
      const res = await fetch(`${PROXY}${url}`)
      const outer = await res.json()
      const data = JSON.parse(outer.contents)
      const meta = data?.chart?.result?.[0]?.meta
      if (!meta) return null
      return {
        ticker,
        price: meta.regularMarketPrice,
        prev: meta.chartPreviousClose,
        change: meta.regularMarketPrice - meta.chartPreviousClose,
        changePct: ((meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose) * 100,
        currency: meta.currency,
        marketState: meta.marketState,
      }
    } catch {
      return null
    }
  }, [])

  const fetchPrices = useCallback(async (tickers) => {
    setLoading(true)
    setError(null)
    try {
      const results = await Promise.allSettled(tickers.map(t => fetchPrice(t)))
      const newPrices = {}
      results.forEach((r, i) => {
        if (r.status === 'fulfilled' && r.value) {
          newPrices[tickers[i]] = r.value
        }
      })
      setPrices(prev => ({ ...prev, ...newPrices }))
    } catch (e) {
      setError('Failed to fetch prices')
    } finally {
      setLoading(false)
    }
  }, [fetchPrice])

  const fetchNews = useCallback(async (tickers) => {
    if (!tickers.length) return
    try {
      const query = tickers.slice(0, 5).join(' OR ')
      const url = encodeURIComponent(
        `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&newsCount=20&quotesCount=0`
      )
      const res = await fetch(`${PROXY}${url}`)
      const outer = await res.json()
      const data = JSON.parse(outer.contents)
      const articles = data?.news || []
      setNews(articles.map(a => ({
        title: a.title,
        link: a.link,
        publisher: a.publisher,
        time: a.providerPublishTime,
        thumbnail: a.thumbnail?.resolutions?.[0]?.url,
        relatedTickers: a.relatedTickers || [],
      })))
    } catch {
      // Silently fail — news is non-critical
    }
  }, [])

  return { prices, news, loading, error, fetchPrices, fetchNews }
}
