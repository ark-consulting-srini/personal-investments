import { useState, useEffect } from 'react'

// ─── Data — Q4 2025 13F filings ──────────────────────────────────────────────

const BERKSHIRE = {
  name: 'Berkshire Hathaway',
  manager: 'Greg Abel (successor to Warren Buffett)',
  style: 'Value · Long-term · Concentrated',
  aum: '$274B',
  filed: 'Feb 17, 2026',
  period: 'Q4 2025',
  color: '#5b8af0',
  philosophy: 'Buy wonderful companies at fair prices and hold forever. Focus on durable competitive advantages, strong free cash flow, and honest management.',
  holdings: [
    { ticker: 'AAPL', name: 'Apple Inc',          sector: 'Technology',   pct: 22.6, value: 61.9,  shares: '227.9M', change: 'Trimmed -4.3%',  changeDir: -1, note: 'Largest holding despite trimming. Buffett sees it as a consumer products company, not tech.' },
    { ticker: 'AXP',  name: 'American Express',   sector: 'Financials',   pct: 20.5, value: 56.1,  shares: '151.6M', change: 'Unchanged',      changeDir: 0,  note: 'Held since 1991. Classic Buffett: premium brand, pricing power, loyal high-income customer base.' },
    { ticker: 'BAC',  name: 'Bank of America',    sector: 'Financials',   pct: 10.4, value: 28.5,  shares: '517.3M', change: 'Trimmed -8.9%',  changeDir: -1, note: 'Reducing position. Still largest bank holding but selling into strength.' },
    { ticker: 'KO',   name: 'Coca-Cola',          sector: 'Consumer',     pct: 10.2, value: 28.6,  shares: '400M',   change: 'Unchanged',      changeDir: 0,  note: 'Held since 1988. Never sold a share. Epitome of Buffett\'s forever hold philosophy.' },
    { ticker: 'CVX',  name: 'Chevron',            sector: 'Energy',       pct: 7.2,  value: 19.8,  shares: '118.6M', change: 'Adding +2.1%',   changeDir: 1,  note: 'Building position. Signal: Berkshire bullish on energy despite energy transition narrative.' },
    { ticker: 'OXY',  name: 'Occidental Petroleum', sector: 'Energy',     pct: 4.8,  value: 13.1,  shares: '264.2M', change: 'Unchanged',      changeDir: 0,  note: 'Now owns OxyChem outright. Berkshire acquiring OXY chemical unit for ~$10B separately.' },
    { ticker: 'CB',   name: 'Chubb Limited',      sector: 'Insurance',    pct: 3.2,  value: 8.7,   shares: '27.2M',  change: 'Adding +12%',    changeDir: 1,  note: 'Aggressively building. Now owns ~8.5% of Chubb. Major conviction in P&C insurance.' },
    { ticker: 'DVA',  name: 'DaVita Inc',         sector: 'Healthcare',   pct: 1.8,  value: 5.0,   shares: '36.1M',  change: 'Trimmed -1.2%', changeDir: -1, note: 'Kidney dialysis leader. Long-held position, slight trim.' },
    { ticker: 'DPZ',  name: 'Domino\'s Pizza',    sector: 'Consumer',     pct: 1.4,  value: 3.8,   shares: '6.7M',   change: 'Adding +15%',    changeDir: 1,  note: 'New conviction build. Now owns ~9.9% of Domino\'s. Franchise model with global scale.' },
    { ticker: 'GOOGL',name: 'Alphabet Inc',       sector: 'Technology',   pct: 0.9,  value: 2.5,   shares: '8.2M',   change: 'New position',   changeDir: 1,  note: 'New stake revealed Nov 2025. Berkshire entering AI infrastructure via Google Cloud angle.' },
  ]
}

const BRIDGEWATER = {
  name: 'Bridgewater Associates',
  manager: 'Greg Jensen & Co-CIOs (Ray Dalio stepped back)',
  style: 'Macro · Risk Parity · Highly Diversified',
  aum: '$27.4B (13F)',
  filed: 'Feb 13, 2026',
  period: 'Q4 2025',
  color: '#20c878',
  philosophy: 'All Weather risk parity: diversify across asset classes so the portfolio performs in any economic environment — growth, recession, inflation, deflation.',
  holdings: [
    { ticker: 'SPY',  name: 'SPDR S&P 500 ETF',        sector: 'ETF · Broad Market', pct: 11.1, value: 3.0,  shares: '4.3M',   change: 'Unchanged',     changeDir: 0,  note: 'Core macro exposure. Largest single position. Tracks S&P 500 — broad US equity hedge.' },
    { ticker: 'IVV',  name: 'iShares Core S&P 500 ETF', sector: 'ETF · Broad Market', pct: 10.5, value: 2.9,  shares: '3.8M',   change: 'Added +4.8%',   changeDir: 1,  note: 'Second large-cap US ETF. Bridgewater doubles up SPY + IVV for liquidity and flexibility.' },
    { ticker: 'NVDA', name: 'NVIDIA Corp',              sector: 'Technology',          pct: 2.6,  value: 0.71, shares: '6.1M',   change: 'Added +18%',    changeDir: 1,  note: 'Significant AI infrastructure bet. Largest individual stock position. High conviction add.' },
    { ticker: 'LRCX', name: 'Lam Research',             sector: 'Semiconductors',      pct: 1.9,  value: 0.52, shares: '0.8M',   change: 'Added +22%',    changeDir: 1,  note: 'Semiconductor equipment. AI chip supply chain play — makes machines that make chips.' },
    { ticker: 'CRM',  name: 'Salesforce Inc',           sector: 'Technology',          pct: 1.9,  value: 0.51, shares: '1.8M',   change: 'Added +9%',     changeDir: 1,  note: 'Enterprise AI software. Agentforce platform making Salesforce the AI CRM leader.' },
    { ticker: 'GOOGL', name: 'Alphabet Inc',            sector: 'Technology',          pct: 1.8,  value: 0.49, shares: '1.6M',   change: 'Trimmed -8%',   changeDir: -1, note: 'Cloud + AI play. Trimming slightly but maintaining large position in Google\'s AI ecosystem.' },
    { ticker: 'PG',   name: 'Procter & Gamble',         sector: 'Consumer Staples',    pct: 1.4,  value: 0.38, shares: '2.4M',   change: 'Unchanged',     changeDir: 0,  note: 'All Weather defensive staple. Classic Dalio inflation hedge — pricing power consumer brand.' },
    { ticker: 'COST', name: 'Costco Wholesale',         sector: 'Consumer',            pct: 1.2,  value: 0.33, shares: '0.36M',  change: 'Unchanged',     changeDir: 0,  note: 'Membership model with recession resilience. Fits All Weather — holds up in downturns.' },
    { ticker: 'KO',   name: 'Coca-Cola',                sector: 'Consumer Staples',    pct: 1.1,  value: 0.30, shares: '4.7M',   change: 'Unchanged',     changeDir: 0,  note: 'Inflation hedge. Pricing power + global brand = All Weather staple. Shared with Buffett.' },
    { ticker: 'MSFT', name: 'Microsoft Corp',           sector: 'Technology',          pct: 0.9,  value: 0.25, shares: '0.6M',   change: 'Added +6%',     changeDir: 1,  note: 'Azure AI cloud. Copilot integration across enterprise software suite driving AI revenue.' },
  ]
}

const PROXY = 'https://api.allorigins.win/get?url='

async function fetchPrice(ticker) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`
    const res = await fetch(`${PROXY}${encodeURIComponent(url)}`)
    const json = await res.json()
    const data = JSON.parse(json.contents)
    const quote = data?.chart?.result?.[0]?.meta
    return {
      price: quote?.regularMarketPrice,
      change: quote?.regularMarketChangePercent,
    }
  } catch { return {} }
}

function ChangeChip({ dir, text }) {
  const colors = {
    1:  { bg: 'rgba(32,200,120,0.12)', color: '#20c878', border: 'rgba(32,200,120,0.25)' },
    0:  { bg: 'rgba(136,135,128,0.12)', color: 'var(--muted)', border: 'rgba(136,135,128,0.2)' },
    '-1': { bg: 'rgba(240,82,82,0.1)', color: '#f05252', border: 'rgba(240,82,82,0.2)' },
  }
  const s = colors[dir] || colors[0]
  return (
    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      fontFamily: 'var(--font-mono)', fontWeight: 600, whiteSpace: 'nowrap' }}>
      {text}
    </span>
  )
}

function HoldingCard({ h, livePrice }) {
  const [expanded, setExpanded] = useState(false)
  const priceUp = livePrice?.change >= 0
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', overflow: 'hidden',
      transition: 'border-color 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border2)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
      <div style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
        onClick={() => setExpanded(v => !v)}>
        {/* Rank bar */}
        <div style={{ width: 3, height: 36, borderRadius: 2, flexShrink: 0,
          background: `linear-gradient(to bottom, var(--accent), transparent)`, opacity: 0.6 }}/>
        {/* Ticker + name */}
        <div style={{ minWidth: 80 }}>
          <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontWeight: 700, fontSize: 14 }}>{h.ticker}</div>
          <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 1 }}>{h.sector}</div>
        </div>
        <div style={{ flex: 1, fontSize: 12, color: 'var(--text2)', fontWeight: 500 }}>{h.name}</div>
        {/* Allocation bar */}
        <div style={{ width: 100, display: 'flex', flexDirection: 'column', gap: 3, flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>Portfolio %</span>
            <span style={{ fontSize: 11, color: 'var(--text)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{h.pct}%</span>
          </div>
          <div style={{ height: 4, background: 'var(--border2)', borderRadius: 2 }}>
            <div style={{ height: 4, borderRadius: 2, background: 'var(--accent)',
              width: `${Math.min(100, (h.pct / 25) * 100)}%` }}/>
          </div>
        </div>
        {/* Value */}
        <div style={{ width: 70, textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text)', fontWeight: 600 }}>${h.value}B</div>
          <div style={{ fontSize: 9, color: 'var(--muted)', marginTop: 1 }}>mkt value</div>
        </div>
        {/* Change chip */}
        <div style={{ width: 110, textAlign: 'right', flexShrink: 0 }}>
          <ChangeChip dir={h.changeDir} text={h.change} />
        </div>
        {/* Live price */}
        <div style={{ width: 80, textAlign: 'right', flexShrink: 0 }}>
          {livePrice?.price ? (
            <>
              <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text)', fontWeight: 600 }}>
                ${livePrice.price.toFixed(2)}
              </div>
              <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: priceUp ? '#20c878' : '#f05252' }}>
                {priceUp ? '+' : ''}{livePrice.change?.toFixed(2)}%
              </div>
            </>
          ) : (
            <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>—</div>
          )}
        </div>
        <div style={{ fontSize: 10, color: 'var(--muted)', flexShrink: 0 }}>{expanded ? '▲' : '▼'}</div>
      </div>
      {expanded && (
        <div style={{ padding: '10px 16px 14px 31px', borderTop: '1px solid var(--border)',
          background: 'var(--surface2)' }}>
          <div style={{ display: 'flex', gap: 24, marginBottom: 8, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 2 }}>Shares held</div>
              <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>{h.shares}</div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 2 }}>Portfolio weight</div>
              <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>{h.pct}%</div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 2 }}>Market value</div>
              <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>${h.value}B</div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.7,
            borderLeft: '2px solid var(--accent)', paddingLeft: 10 }}>
            {h.note}
          </div>
        </div>
      )}
    </div>
  )
}

function FundTab({ fund }) {
  const [prices, setPrices] = useState({})
  const [loadingPrices, setLoadingPrices] = useState(false)

  const loadPrices = async () => {
    setLoadingPrices(true)
    const results = {}
    await Promise.all(fund.holdings.map(async h => {
      // Skip ETFs from live price fetch — Yahoo handles them but they're less useful
      const p = await fetchPrice(h.ticker)
      if (p.price) results[h.ticker] = p
    }))
    setPrices(results)
    setLoadingPrices(false)
  }

  const totalPct = fund.holdings.reduce((s, h) => s + h.pct, 0)

  return (
    <div>
      {/* Fund header */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, marginBottom: 20 }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '16px 20px',
          borderLeft: `3px solid ${fund.color}` }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Investment philosophy</div>
          <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7 }}>{fund.philosophy}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 180 }}>
          {[
            { label: 'Manager', val: fund.manager },
            { label: 'Style', val: fund.style },
            { label: '13F AUM', val: fund.aum },
            { label: 'Period', val: `${fund.period} · filed ${fund.filed}` },
          ].map(item => (
            <div key={item.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: '7px 12px' }}>
              <div style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{item.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text)', marginTop: 2, fontWeight: 500 }}>{item.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Sector breakdown pills */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        {Object.entries(
          fund.holdings.reduce((acc, h) => {
            const s = h.sector.split(' · ')[0]
            acc[s] = (acc[s] || 0) + h.pct
            return acc
          }, {})
        ).sort((a, b) => b[1] - a[1]).map(([sector, pct]) => (
          <div key={sector} style={{ fontSize: 10, padding: '3px 10px', borderRadius: 20,
            background: 'var(--surface)', border: '1px solid var(--border)',
            color: 'var(--text2)', fontFamily: 'var(--font-mono)' }}>
            {sector} <span style={{ color: fund.color, fontWeight: 600 }}>{pct.toFixed(1)}%</span>
          </div>
        ))}
        <div style={{ fontSize: 10, padding: '3px 10px', borderRadius: 20,
          background: 'var(--surface)', border: '1px solid var(--border)',
          color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
          Top 10 = {totalPct.toFixed(1)}% of 13F
        </div>
      </div>

      {/* Table header */}
      <div style={{ display: 'grid', padding: '6px 16px 6px 31px',
        gridTemplateColumns: '80px 1fr 100px 70px 110px 80px 20px',
        gap: 12, marginBottom: 4 }}>
        {['Ticker', 'Name', 'Weight', 'Value', 'Q4 Change', 'Price', ''].map(h => (
          <div key={h} style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase',
            letterSpacing: '0.5px', fontFamily: 'var(--font-mono)' }}>{h}</div>
        ))}
      </div>

      {/* Holdings */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {fund.holdings.map(h => (
          <HoldingCard key={h.ticker} h={h} livePrice={prices[h.ticker]} />
        ))}
      </div>

      {/* Live prices button */}
      <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={loadPrices} disabled={loadingPrices}
          style={{ padding: '8px 16px', background: 'var(--surface)',
            border: `1px solid ${fund.color}40`, color: fund.color,
            borderRadius: 'var(--radius)', fontSize: 12, fontWeight: 600,
            opacity: loadingPrices ? 0.6 : 1, cursor: 'pointer' }}>
          {loadingPrices ? 'Loading prices…' : '↻ Load live prices'}
        </button>
        <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
          Data: Q4 2025 13F · Prices: live via Yahoo Finance
        </span>
      </div>

      <div style={{ marginTop: 10, fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)', lineHeight: 1.7 }}>
        ⚠ 13F filings are reported 45 days after quarter end. Holdings may have changed since {fund.filed}.
        Portfolio % based on disclosed 13F equity value only — does not include cash, bonds, or private holdings.
        Not financial advice.
      </div>
    </div>
  )
}

const COMPARISON_STOCKS = ['AAPL', 'AXP', 'KO', 'CVX', 'GOOGL', 'MSFT', 'COST', 'PG']

export default function GuruHoldings() {
  const [activeTab, setActiveTab] = useState('berkshire')

  const tabs = [
    { id: 'berkshire',   label: '🏦 Berkshire Hathaway', sub: 'Greg Abel · Value' },
    { id: 'bridgewater', label: '🌊 Bridgewater',        sub: 'Dalio · All Weather' },
    { id: 'compare',     label: '⚖ Compare',             sub: 'Overlap analysis' },
  ]

  // Stocks held by both
  const brkTickers = new Set(BERKSHIRE.holdings.map(h => h.ticker))
  const bwTickers = new Set(BRIDGEWATER.holdings.map(h => h.ticker))
  const overlap = BERKSHIRE.holdings.filter(h => bwTickers.has(h.ticker))

  return (
    <div style={{ padding: '24px', maxWidth: 1000 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, marginBottom: 4 }}>Guru Holdings</h1>
        <p style={{ color: 'var(--text2)', fontSize: 13 }}>
          Top 10 positions from the world's best investors · Q4 2025 13F filings
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ padding: '10px 16px', background: 'none', border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--accent)' : 'var(--text2)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: -1,
              transition: 'all 0.15s' }}>
            {tab.label}
            <div style={{ fontSize: 9, color: 'var(--muted)', fontFamily: 'var(--font-mono)',
              marginTop: 2, fontWeight: 400 }}>{tab.sub}</div>
          </button>
        ))}
      </div>

      {activeTab === 'berkshire' && <FundTab fund={BERKSHIRE} />}
      {activeTab === 'bridgewater' && <FundTab fund={BRIDGEWATER} />}

      {/* Compare tab */}
      {activeTab === 'compare' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            {[
              { fund: BERKSHIRE, desc: '42 stocks · 1% turnover · Permanent holds' },
              { fund: BRIDGEWATER, desc: '1,040 positions · 22% turnover · Risk parity' },
            ].map(({ fund, desc }) => (
              <div key={fund.name} style={{ background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)', padding: '14px 16px',
                borderTop: `2px solid ${fund.color}` }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{fund.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 10 }}>{desc}</div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>AUM (13F)</div>
                    <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-mono)', color: fund.color }}>{fund.aum}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Top 10 weight</div>
                    <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-mono)', color: fund.color }}>
                      {fund.holdings.reduce((s, h) => s + h.pct, 0).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Overlap */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '16px 20px', marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
              Stocks held by both — the real signal
            </div>
            {overlap.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>No overlap in top 10s.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {overlap.map(h => {
                  const bw = BRIDGEWATER.holdings.find(b => b.ticker === h.ticker)
                  return (
                    <div key={h.ticker} style={{ display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 14px', background: 'var(--surface2)',
                      borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent)', width: 60 }}>{h.ticker}</span>
                      <span style={{ fontSize: 12, flex: 1 }}>{h.name}</span>
                      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: BERKSHIRE.color }}>
                        BRK: {h.pct}%
                      </span>
                      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: BRIDGEWATER.color }}>
                        BW: {bw?.pct}%
                      </span>
                      <span style={{ fontSize: 10, color: '#f4a724', background: 'rgba(244,167,36,0.1)',
                        border: '1px solid rgba(244,167,36,0.2)', padding: '2px 8px', borderRadius: 10,
                        fontWeight: 600 }}>Both own this</span>
                    </div>
                  )
                })}
              </div>
            )}
            <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text2)', lineHeight: 1.7 }}>
              When two very different investment philosophies (deep value vs macro risk parity)
              converge on the same stock, it's worth paying attention. These names pass both a
              fundamental quality screen <em>and</em> a macro regime screen.
            </div>
          </div>

          {/* Philosophy comparison */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '16px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Style comparison</div>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr', gap: 8 }}>
              {[
                ['Concentration', 'Top 10 = 82% of portfolio', 'Top 10 = 33% of portfolio'],
                ['Turnover', '~1% per quarter', '~22% per quarter'],
                ['Holding period', 'Decades (KO since 1988)', 'Months to years'],
                ['Primary edge', 'Business quality + moat', 'Macro regime + risk balance'],
                ['AI exposure', 'AAPL, GOOGL (new)', 'NVDA, LRCX, CRM, MSFT'],
                ['Energy view', 'Bullish (CVX, OXY)', 'Minimal direct exposure'],
              ].map(([dim, brk, bw], i) => (
                <>
                  <div key={`d${i}`} style={{ fontSize: 11, color: 'var(--muted)', padding: '6px 0',
                    borderBottom: '1px solid var(--border)', fontWeight: 500 }}>{dim}</div>
                  <div key={`b${i}`} style={{ fontSize: 11, color: 'var(--text2)', padding: '6px 8px',
                    borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'var(--surface2)' : 'transparent',
                    borderRadius: 4 }}>{brk}</div>
                  <div key={`w${i}`} style={{ fontSize: 11, color: 'var(--text2)', padding: '6px 8px',
                    borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'var(--surface2)' : 'transparent',
                    borderRadius: 4 }}>{bw}</div>
                </>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
