import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth.jsx'
import { getWatchlist } from '../lib/supabase'
import { format } from 'date-fns'

const PROXY = 'https://api.allorigins.win/get?url='

export default function News() {
  const { user } = useAuth()
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [watchlist, setWatchlist] = useState([])
  const [filter, setFilter] = useState('')
  const [activeTicker, setActiveTicker] = useState('all')

  useEffect(() => {
    if (!user) return
    getWatchlist(user.id).then(({ data }) => {
      setWatchlist(data || [])
      fetchNews((data || []).map(d => d.ticker))
    })
  }, [user])

  const fetchNews = useCallback(async (tickers) => {
    setLoading(true)
    setError(null)
    try {
      const query = tickers.length ? tickers.slice(0,6).join('+') : 'stock+market+investing'
      const url = `${PROXY}${encodeURIComponent(
        `https://query1.finance.yahoo.com/v1/finance/search?q=${query}&newsCount=25&quotesCount=0&enableFuzzyQuery=false`
      )}`
      const res = await fetch(url)
      const outer = await res.json()
      const data = JSON.parse(outer.contents)
      const articles = data?.news || []
      if (!articles.length) throw new Error('No articles')
      setNews(articles.map(a => ({
        uuid: a.uuid, title: a.title, link: a.link,
        publisher: a.publisher, time: a.providerPublishTime,
        thumbnail: a.thumbnail?.resolutions?.[0]?.url || null,
        tickers: a.relatedTickers || [],
      })))
    } catch {
      try {
        const rssUrl = `${PROXY}${encodeURIComponent('https://feeds.finance.yahoo.com/rss/2.0/headline?s=SPY,QQQ&region=US&lang=en-US')}`
        const res = await fetch(rssUrl)
        const outer = await res.json()
        const parser = new DOMParser()
        const xml = parser.parseFromString(outer.contents, 'text/xml')
        const items = Array.from(xml.querySelectorAll('item')).slice(0, 20)
        setNews(items.map(item => ({
          uuid: item.querySelector('guid')?.textContent,
          title: item.querySelector('title')?.textContent,
          link: item.querySelector('link')?.textContent,
          publisher: 'Yahoo Finance', time: Math.floor(new Date(item.querySelector('pubDate')?.textContent).getTime() / 1000),
          thumbnail: null, tickers: [],
        })))
      } catch {
        setError('Unable to load news. Yahoo Finance may be temporarily unavailable.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const allTickers = ['all', ...new Set(news.flatMap(n => n.tickers).slice(0, 12))]
  const filtered = news.filter(n => {
    if (activeTicker !== 'all' && !n.tickers.includes(activeTicker)) return false
    if (filter && !n.title.toLowerCase().includes(filter.toLowerCase())) return false
    return true
  })

  const timeLabel = (ts) => {
    if (!ts) return ''
    try {
      const d = new Date(ts * 1000)
      const diff = Math.floor((new Date() - d) / 60000)
      if (diff < 60) return `${diff}m ago`
      if (diff < 1440) return `${Math.floor(diff/60)}h ago`
      return format(d, 'MMM d')
    } catch { return '' }
  }

  return (
    <div style={{padding:'24px', maxWidth:900}}>
      <div style={{marginBottom:20, display:'flex', justifyContent:'space-between', alignItems:'flex-end'}}>
        <div>
          <h1 style={{fontFamily:'var(--font-display)', fontSize:26}}>News Feed</h1>
          <p style={{color:'var(--text2)', fontSize:13, marginTop:3}}>
            {watchlist.length > 0 ? `Personalized for your ${watchlist.length}-stock watchlist` : 'Top market news'}
          </p>
        </div>
        <div style={{display:'flex', gap:10, alignItems:'center'}}>
          <input placeholder="Filter headlines…" value={filter} onChange={e=>setFilter(e.target.value)}
            style={{background:'var(--surface)', border:'1px solid var(--border2)', color:'var(--text)',
              padding:'7px 12px', borderRadius:'var(--radius)', fontSize:12, outline:'none', width:180}}/>
          <button onClick={()=>fetchNews(watchlist.map(w=>w.ticker))}
            style={{padding:'7px 14px', background:'var(--surface)', border:'1px solid var(--border2)',
              color:'var(--text2)', borderRadius:'var(--radius)', fontSize:12, fontWeight:500}}>
            ↻ Refresh
          </button>
        </div>
      </div>

      {watchlist.length === 0 && !loading && (
        <div style={{background:'rgba(91,138,240,0.08)', border:'1px solid var(--accent-border)',
          borderRadius:'var(--radius)', padding:'12px 16px', marginBottom:20, fontSize:12, color:'var(--accent)'}}>
          💡 Add companies to your Watchlist to see personalized news.
        </div>
      )}

      {!loading && allTickers.length > 1 && (
        <div style={{display:'flex', gap:6, flexWrap:'wrap', marginBottom:16}}>
          {allTickers.map(t => (
            <button key={t} onClick={()=>setActiveTicker(t)}
              style={{padding:'3px 10px', borderRadius:20, fontSize:11, fontFamily:'var(--font-mono)', fontWeight:600,
                background: activeTicker===t?'var(--accent)':'var(--surface)',
                color: activeTicker===t?'#fff':'var(--text2)',
                border:`1px solid ${activeTicker===t?'var(--accent)':'var(--border2)'}`,
                transition:'all 0.15s'}}>
              {t === 'all' ? 'All news' : t}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div style={{color:'var(--muted)', fontFamily:'var(--font-mono)', fontSize:12, padding:20}}>Loading news…</div>
      ) : error ? (
        <div style={{background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)',
          padding:40, textAlign:'center'}}>
          <div style={{fontSize:28, marginBottom:12}}>◎</div>
          <div style={{color:'var(--text2)', marginBottom:12}}>{error}</div>
          <button onClick={()=>fetchNews(watchlist.map(w=>w.ticker))}
            style={{padding:'8px 16px', background:'var(--accent-dim)', border:'1px solid var(--accent-border)',
              color:'var(--accent)', borderRadius:'var(--radius)', fontSize:12, fontWeight:600}}>Try again</button>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)',
          padding:40, textAlign:'center', color:'var(--muted)'}}>No articles match your filter.</div>
      ) : (
        <div style={{display:'flex', flexDirection:'column', gap:1, background:'var(--border)',
          borderRadius:'var(--radius-lg)', overflow:'hidden', border:'1px solid var(--border)'}}>
          {filtered.map((article, i) => (
            <a key={article.uuid||i} href={article.link} target="_blank" rel="noopener noreferrer"
              style={{display:'flex', gap:14, padding:'14px 18px', background:'var(--surface)',
                transition:'background 0.12s', textDecoration:'none', color:'inherit'}}
              onMouseEnter={e=>e.currentTarget.style.background='var(--surface2)'}
              onMouseLeave={e=>e.currentTarget.style.background='var(--surface)'}>
              {article.thumbnail && (
                <img src={article.thumbnail} alt="" onError={e=>e.target.style.display='none'}
                  style={{width:80, height:54, objectFit:'cover', borderRadius:6, flexShrink:0, background:'var(--surface2)'}}/>
              )}
              <div style={{flex:1, minWidth:0}}>
                <div style={{fontSize:13, fontWeight:600, lineHeight:1.4, marginBottom:5,
                  display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden'}}>
                  {article.title}
                </div>
                <div style={{display:'flex', alignItems:'center', gap:8, flexWrap:'wrap'}}>
                  <span style={{fontSize:11, color:'var(--muted)', fontFamily:'var(--font-mono)'}}>{article.publisher}</span>
                  {article.time && <span style={{fontSize:11, color:'var(--muted)'}}>· {timeLabel(article.time)}</span>}
                  {article.tickers?.slice(0,4).map(t => (
                    <span key={t} style={{fontSize:9, background:'var(--accent-dim)', color:'var(--accent)',
                      padding:'1px 6px', borderRadius:3, fontFamily:'var(--font-mono)', fontWeight:600}}>{t}</span>
                  ))}
                </div>
              </div>
              <div style={{color:'var(--muted)', fontSize:14, flexShrink:0, alignSelf:'center'}}>↗</div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
