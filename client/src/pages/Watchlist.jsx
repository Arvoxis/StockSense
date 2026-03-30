import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Star, RefreshCw, Download, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import useWatchlistStore from '../stores/watchlistStore'
import { SkeletonTable } from '../components/Skeleton'

function SentimentBadge({ sentiment }) {
  const s = (sentiment || '').toLowerCase()
  if (s === 'bullish') return <span className="badge badge-green">Bullish</span>
  if (s === 'bearish') return <span className="badge badge-red">Bearish</span>
  return <span className="badge badge-grey">Neutral</span>
}

function SortIcon({ col, sortBy, dir }) {
  if (sortBy !== col) return <ChevronUp size={12} color="transparent" />
  return dir === 'asc' ? <ChevronUp size={12} color="var(--accent-blue)" /> : <ChevronDown size={12} color="var(--accent-blue)" />
}

export default function Watchlist() {
  const { items, loading, fetch, remove, scores, refreshScores, scoresLoading } = useWatchlistStore()
  const [sortBy, setSortBy] = useState('ticker')
  const [sortDir, setSortDir] = useState('asc')
  const navigate = useNavigate()

  useEffect(() => {
    fetch()
  }, [])

  function handleSort(col) {
    if (sortBy === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortBy(col); setSortDir('asc') }
  }

  function exportCSV() {
    const headers = ['Ticker', 'Company', 'Price', 'Change%', 'Volume', 'RSI', 'AI Score', 'Sentiment']
    const rows = sorted.map((item) => {
      const ticker = item.ticker || item.symbol || item
      return [
        ticker,
        item.name || item.companyName || '',
        item.price || item.currentPrice || '',
        item.changePercent || item.change || '',
        item.volume || '',
        item.rsi || '',
        scores[ticker] || item.aiScore || '',
        item.sentiment || '',
      ]
    })
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'watchlist.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const sorted = [...items].sort((a, b) => {
    const getVal = (item) => {
      const ticker = item.ticker || item.symbol || item
      const map = {
        ticker,
        company: item.name || item.companyName || '',
        price: parseFloat(item.price || item.currentPrice || 0),
        changePercent: parseFloat(item.changePercent || item.change || 0),
        volume: parseFloat(item.volume || 0),
        rsi: parseFloat(item.rsi || 0),
        aiScore: parseFloat(scores[ticker] || item.aiScore || 0),
        sentiment: item.sentiment || '',
      }
      return map[sortBy] ?? ''
    }
    const av = getVal(a), bv = getVal(b)
    if (av < bv) return sortDir === 'asc' ? -1 : 1
    if (av > bv) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  const cols = [
    { key: 'ticker', label: 'Ticker' },
    { key: 'company', label: 'Company' },
    { key: 'price', label: 'Price' },
    { key: 'changePercent', label: 'Change%' },
    { key: 'volume', label: 'Volume' },
    { key: 'rsi', label: 'RSI' },
    { key: 'aiScore', label: 'AI Score' },
    { key: 'sentiment', label: 'Sentiment' },
    { key: 'remove', label: '' },
  ]

  return (
    <div className="page-enter" style={{ maxWidth: 1300 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Watchlist</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
            {items.length} stock{items.length !== 1 ? 's' : ''} tracked
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={refreshScores}
            disabled={scoresLoading}
            className="btn btn-outline"
            style={{ gap: 6 }}
          >
            <RefreshCw size={14} style={{ animation: scoresLoading ? 'spin 1s linear infinite' : 'none' }} />
            Refresh AI Scores
          </button>
          <button onClick={exportCSV} className="btn btn-outline" style={{ gap: 6 }} disabled={items.length === 0}>
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="table-wrapper">
        {loading ? (
          <SkeletonTable rows={6} cols={8} />
        ) : sorted.length === 0 ? (
          <div className="empty-state">
            <Star size={36} />
            <p style={{ fontSize: 15, fontWeight: 600 }}>Your watchlist is empty</p>
            <p style={{ fontSize: 13 }}>Search a ticker to get started</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                {cols.map(({ key, label }) => (
                  <th
                    key={key}
                    onClick={() => key !== 'remove' && handleSort(key)}
                    style={{ userSelect: 'none', cursor: key !== 'remove' ? 'pointer' : 'default' }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {label}
                      {key !== 'remove' && <SortIcon col={key} sortBy={sortBy} dir={sortDir} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((item, i) => {
                const ticker = item.ticker || item.symbol || item
                const price = item.price || item.currentPrice
                const cp = item.changePercent || item.change
                const isPos = parseFloat(cp || 0) >= 0
                const score = scores[ticker] || item.aiScore
                const s = parseInt(score)
                const scoreColor = s >= 8 ? 'var(--accent-green)' : s >= 6 ? 'var(--accent-blue)' : s >= 4 ? 'var(--accent-yellow)' : 'var(--accent-red)'

                return (
                  <tr key={i} style={{ cursor: 'pointer' }} onClick={() => navigate(`/stock/${ticker}`)}>
                    <td>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: 'var(--accent-green)', fontSize: 13 }}>{ticker}</span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', maxWidth: 160 }} className="truncate">{item.name || item.companyName || '—'}</td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>
                      {price ? `$${parseFloat(price).toFixed(2)}` : '—'}
                    </td>
                    <td>
                      {cp != null ? (
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: isPos ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 600 }}>
                          {isPos ? '+' : ''}{parseFloat(cp).toFixed(2)}%
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                      {item.volume ? `${(item.volume / 1e6).toFixed(2)}M` : '—'}
                    </td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>
                      {item.rsi != null ? (
                        <span style={{ color: item.rsi > 70 ? 'var(--accent-red)' : item.rsi < 30 ? 'var(--accent-green)' : 'var(--text-primary)' }}>
                          {parseFloat(item.rsi).toFixed(1)}
                        </span>
                      ) : (
                        scoresLoading ? (
                          <div style={{ width: 40, height: 14 }} className="skeleton" />
                        ) : '—'
                      )}
                    </td>
                    <td>
                      {score != null ? (
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 13, color: scoreColor, background: `${scoreColor}15`, padding: '2px 8px', borderRadius: 20, border: `1px solid ${scoreColor}40` }}>
                          {s}/10
                        </span>
                      ) : scoresLoading ? (
                        <div style={{ width: 40, height: 22 }} className="skeleton" />
                      ) : '—'}
                    </td>
                    <td>
                      <SentimentBadge sentiment={item.sentiment} />
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => remove(ticker)}
                        style={{ background: 'none', color: 'var(--text-secondary)', padding: '4px 8px', borderRadius: 6, transition: 'var(--transition)' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-red)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                        title="Remove from watchlist"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
