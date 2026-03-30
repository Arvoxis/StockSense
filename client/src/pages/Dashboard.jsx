import React, { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { TrendingUp, TrendingDown, ArrowRight, RefreshCw } from 'lucide-react'
import useWatchlistStore from '../stores/watchlistStore'
import useStockStore from '../stores/stockStore'
import { getMarketIndices } from '../api/market'
import { getNews } from '../api/news'
import { SkeletonBox, SkeletonCard, SkeletonTable, SkeletonText } from '../components/Skeleton'
import SparklineChart from '../components/charts/SparklineChart'

// Animated number count-up
function CountUp({ value, prefix = '', suffix = '', decimals = 2 }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    if (!value) return
    const target = parseFloat(value)
    const duration = 800
    const start = performance.now()
    function step(now) {
      const p = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(target * eased)
      if (p < 1) requestAnimationFrame(step)
      else setDisplay(target)
    }
    requestAnimationFrame(step)
  }, [value])
  return <span>{prefix}{display.toFixed(decimals)}{suffix}</span>
}

function IndexCard({ name, value, change, changePercent, loading }) {
  if (loading) return <SkeletonCard lines={2} />
  const isPos = parseFloat(change) >= 0
  return (
    <div className="card" style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
        {name}
      </div>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
        <CountUp value={value} prefix="" decimals={2} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {isPos ? <TrendingUp size={14} color="var(--accent-green)" /> : <TrendingDown size={14} color="var(--accent-red)" />}
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: isPos ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 600 }}>
          {isPos ? '+' : ''}{parseFloat(change || 0).toFixed(2)} ({isPos ? '+' : ''}{parseFloat(changePercent || 0).toFixed(2)}%)
        </span>
      </div>
    </div>
  )
}

function AIPriorityBadge({ score }) {
  const s = parseInt(score)
  const color = s >= 8 ? '#00d4aa' : s >= 6 ? '#4a9eff' : s >= 4 ? '#ffd32a' : '#ff4757'
  const bg = s >= 8 ? 'rgba(0,212,170,0.1)' : s >= 6 ? 'rgba(74,158,255,0.1)' : s >= 4 ? 'rgba(255,211,42,0.1)' : 'rgba(255,71,87,0.1)'
  return (
    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 13, color, background: bg, padding: '2px 8px', borderRadius: 20, border: `1px solid ${color}40` }}>
      {s}/10
    </span>
  )
}

export default function Dashboard() {
  const { items: watchlist, loading: wlLoading, fetch: fetchWatchlist, scores } = useWatchlistStore()
  const [indices, setIndices] = useState([])
  const [indicesLoading, setIndicesLoading] = useState(true)
  const [topMover, setTopMover] = useState(null)
  const { whyMovingData, whyMovingLoading, fetchWhyMoving } = useStockStore()
  const [headlines, setHeadlines] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    fetchWatchlist()
    loadIndices()
    loadNews()
  }, [])

  async function loadIndices() {
    try {
      const { data } = await getMarketIndices()
      const list = data.indices || data || []
      setIndices(list)
      // Find top mover
      const mover = list.reduce((best, i) => {
        const a = Math.abs(parseFloat(i.changePercent || 0))
        const b = Math.abs(parseFloat(best?.changePercent || 0))
        return a > b ? i : best
      }, null)
      if (mover) {
        setTopMover(mover)
        fetchWhyMoving(mover.symbol || mover.ticker)
      }
    } catch {
      // indices remain empty
    } finally {
      setIndicesLoading(false)
    }
  }

  async function loadNews() {
    try {
      const { data } = await getNews({ limit: 10 })
      setHeadlines(data.articles || data || [])
    } catch {}
  }

  const wlSlice = watchlist.slice(0, 8)

  return (
    <div className="page-enter" style={{ maxWidth: 1400 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>Market overview and AI insights</p>
      </div>

      {/* Index Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {indicesLoading
          ? [1, 2, 3, 4].map((k) => <SkeletonCard key={k} lines={2} />)
          : indices.length > 0
          ? indices.slice(0, 4).map((idx, i) => (
              <IndexCard
                key={i}
                name={idx.name || idx.symbol}
                value={idx.price || idx.value}
                change={idx.change}
                changePercent={idx.changePercent}
              />
            ))
          : [
              { name: 'S&P 500', value: '—', change: '0', changePercent: '0' },
              { name: 'NASDAQ', value: '—', change: '0', changePercent: '0' },
              { name: 'DOW', value: '—', change: '0', changePercent: '0' },
              { name: 'VIX', value: '—', change: '0', changePercent: '0' },
            ].map((idx, i) => <IndexCard key={i} {...idx} />)
        }
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, marginBottom: 28 }}>
        {/* Watchlist Section */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: 15, fontWeight: 700 }}>Your Watchlist</h2>
            <Link to="/watchlist" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--accent-blue)', fontWeight: 500 }}>
              View full watchlist <ArrowRight size={13} />
            </Link>
          </div>
          {wlLoading ? (
            <div style={{ padding: 16 }}><SkeletonTable rows={5} cols={5} /></div>
          ) : wlSlice.length === 0 ? (
            <div className="empty-state" style={{ padding: 40 }}>
              <TrendingUp size={32} />
              <p style={{ fontSize: 14 }}>Your watchlist is empty</p>
              <p style={{ fontSize: 12 }}>Search a ticker to get started</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Ticker', 'Price', 'Change%', 'AI Score', '7D Chart'].map((h) => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', background: 'rgba(30,45,74,0.5)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {wlSlice.map((item, i) => {
                    const ticker = item.ticker || item.symbol || item
                    const price = item.price || item.currentPrice
                    const cp = item.changePercent || item.change
                    const isPos = parseFloat(cp || 0) >= 0
                    const score = scores[ticker] || item.aiScore || item.priorityScore
                    return (
                      <tr key={i} style={{ cursor: 'pointer' }} onClick={() => navigate(`/stock/${ticker}`)}>
                        <td>
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 13, color: 'var(--accent-green)' }}>{ticker}</span>
                        </td>
                        <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>
                          {price ? `$${parseFloat(price).toFixed(2)}` : '—'}
                        </td>
                        <td>
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: isPos ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 600 }}>
                            {isPos ? '+' : ''}{parseFloat(cp || 0).toFixed(2)}%
                          </span>
                        </td>
                        <td>
                          {score != null ? <AIPriorityBadge score={score} /> : <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>—</span>}
                        </td>
                        <td>
                          <SparklineChart data={item.sparkline || item.chart || []} positive={isPos} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Why Is It Moving */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-green)', animation: 'pulse-dot 2s infinite' }} />
            <h2 style={{ fontSize: 15, fontWeight: 700 }}>Why Is It Moving?</h2>
          </div>
          {topMover && (
            <div style={{ marginBottom: 14 }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: 'var(--accent-green)', fontSize: 15 }}>
                {topMover.symbol || topMover.name}
              </span>
              <span style={{ marginLeft: 8, fontSize: 13, color: parseFloat(topMover.changePercent) >= 0 ? 'var(--accent-green)' : 'var(--accent-red)', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
                {parseFloat(topMover.changePercent) >= 0 ? '+' : ''}{parseFloat(topMover.changePercent || 0).toFixed(2)}%
              </span>
            </div>
          )}
          {whyMovingLoading ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-blue)', animation: 'pulse-dot 1s infinite' }} />
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  Claude is analyzing market movements<span className="thinking-dots" />
                </span>
              </div>
              <SkeletonText lines={5} />
            </div>
          ) : whyMovingData ? (
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              {whyMovingData.explanation || whyMovingData.reason || whyMovingData.text || JSON.stringify(whyMovingData)}
            </p>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              No major movers data available.
            </p>
          )}
        </div>
      </div>

      {/* News Ticker */}
      {headlines.length > 0 && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 0', overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 60, background: 'linear-gradient(to right, var(--bg-card), transparent)', zIndex: 1 }} />
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 60, background: 'linear-gradient(to left, var(--bg-card), transparent)', zIndex: 1 }} />
          <div className="ticker-inner">
            {[...headlines, ...headlines].map((h, i) => (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 20, padding: '0 24px', fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                <span style={{ color: 'var(--accent-green)', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 11 }}>●</span>
                {h.headline || h.title || h}
              </span>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}
