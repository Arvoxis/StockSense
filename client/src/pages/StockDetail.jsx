import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  TrendingUp, TrendingDown, Star, StarOff, Brain,
  ChevronDown, ChevronUp, AlertTriangle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import useStockStore from '../stores/stockStore'
import useWatchlistStore from '../stores/watchlistStore'
import CandlestickChart from '../components/charts/CandlestickChart'
import RSIChart from '../components/charts/RSIChart'
import MACDChart from '../components/charts/MACDChart'
import { SkeletonBox, SkeletonChart, SkeletonText } from '../components/Skeleton'

const RANGES = ['1D', '1W', '1M', '3M', '1Y']

const STAT_LABELS = {
  marketCap: 'Market Cap',
  peRatio: 'P/E Ratio',
  eps: 'EPS',
  high52w: '52W High',
  low52w: '52W Low',
  avgVolume: 'Avg Volume',
  beta: 'Beta',
  dividendYield: 'Dividend Yield',
}

function VerdictBadge({ verdict, confidence }) {
  const map = { BUY: 'var(--accent-green)', HOLD: 'var(--accent-yellow)', SELL: 'var(--accent-red)' }
  const v = (verdict || '').toUpperCase()
  const color = map[v] || 'var(--text-secondary)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{
        fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: 18,
        color, background: `${color}20`, padding: '4px 16px', borderRadius: 8, border: `2px solid ${color}60`,
        letterSpacing: '1px',
      }}>{v || 'ANALYZING'}</span>
      {confidence != null && (
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          Confidence: <strong style={{ color }}>{confidence}%</strong>
        </span>
      )}
    </div>
  )
}

function Collapsible({ title, children }) {
  const [open, setOpen] = useState(true)
  return (
    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'none', color: 'var(--text-primary)', padding: '4px 0', fontSize: 13, fontWeight: 600 }}
      >
        {title}
        {open ? <ChevronUp size={15} color="var(--text-secondary)" /> : <ChevronDown size={15} color="var(--text-secondary)" />}
      </button>
      {open && <div style={{ marginTop: 10 }}>{children}</div>}
    </div>
  )
}

export default function StockDetail() {
  const { ticker } = useParams()
  const {
    quote, chartData, stats, analysis, range,
    quoteLoading, chartLoading, statsLoading, analysisLoading,
    fetchQuote, fetchChart, fetchStats, analyze, setRange, reset,
  } = useStockStore()

  const { add, remove, isInWatchlist } = useWatchlistStore()
  const inWatchlist = isInWatchlist(ticker)

  const [overlays, setOverlays] = useState({ ema20: false, ema50: false, ema200: false, bollinger: false })
  const toggleOverlay = (k) => setOverlays((o) => ({ ...o, [k]: !o[k] }))

  useEffect(() => {
    reset()
    fetchQuote(ticker)
    fetchStats(ticker)
    fetchChart(ticker, '1M')
    setRange('1M')
  }, [ticker])

  function handleRangeChange(r) {
    setRange(r)
    fetchChart(ticker, r)
  }

  async function handleAnalyze() {
    const payload = {
      ticker,
      price: quote?.price,
      rsi: chartData[chartData.length - 1]?.rsi,
      macd: chartData[chartData.length - 1]?.macd,
      headlines: [],
    }
    await analyze(payload)
  }

  const price = quote?.price || quote?.currentPrice
  const change = quote?.change
  const cp = quote?.changePercent
  const isPos = parseFloat(cp || 0) >= 0
  const companyName = quote?.companyName || quote?.name || ticker

  // Extract RSI/MACD data
  const indicatorData = chartData.filter((d) => d.rsi != null || d.macd != null)

  return (
    <div className="page-enter" style={{ maxWidth: 1300 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div>
          {quoteLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <SkeletonBox height={28} width={200} />
              <SkeletonBox height={36} width={140} />
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                <h1 style={{ fontSize: 20, fontWeight: 700 }}>{companyName}</h1>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 13, color: 'var(--accent-green)', background: 'rgba(0,212,170,0.1)', padding: '2px 10px', borderRadius: 6, border: '1px solid rgba(0,212,170,0.3)' }}>
                  {ticker}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 32, fontWeight: 800 }}>
                  ${parseFloat(price || 0).toFixed(2)}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {isPos ? <TrendingUp size={16} color="var(--accent-green)" /> : <TrendingDown size={16} color="var(--accent-red)" />}
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, color: isPos ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 600 }}>
                    {isPos ? '+' : ''}{parseFloat(change || 0).toFixed(2)} ({isPos ? '+' : ''}{parseFloat(cp || 0).toFixed(2)}%)
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => inWatchlist ? remove(ticker) : add(ticker)}
            className={`btn ${inWatchlist ? 'btn-outline' : 'btn-primary'}`}
            style={{ gap: 6 }}
          >
            {inWatchlist ? <StarOff size={15} /> : <Star size={15} />}
            {inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
          </button>
          <button
            onClick={handleAnalyze}
            className="btn btn-blue"
            disabled={analysisLoading}
            style={{ gap: 6 }}
          >
            {analysisLoading ? (
              <>
                <div style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                Analyzing {ticker}...
              </>
            ) : (
              <><Brain size={15} />Analyze with AI</>
            )}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, alignItems: 'start' }}>
        {/* Charts column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Candlestick Chart Card */}
          <div className="card">
            {/* Range tabs */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {RANGES.map((r) => (
                  <button
                    key={r}
                    onClick={() => handleRangeChange(r)}
                    style={{
                      padding: '4px 12px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      fontFamily: 'JetBrains Mono, monospace',
                      background: range === r ? 'var(--accent-green)' : 'transparent',
                      color: range === r ? '#000' : 'var(--text-secondary)',
                      border: range === r ? 'none' : '1px solid var(--border)',
                      transition: 'var(--transition)',
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
              {/* Overlays */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {[
                  { key: 'ema20', label: 'EMA 20' },
                  { key: 'ema50', label: 'EMA 50' },
                  { key: 'ema200', label: 'EMA 200' },
                  { key: 'bollinger', label: 'Bollinger' },
                  { key: 'volume', label: 'Volume' },
                ].map(({ key, label }) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 12, color: overlays[key] ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    <input
                      type="checkbox"
                      checked={overlays[key] || false}
                      onChange={() => toggleOverlay(key)}
                      style={{ accentColor: 'var(--accent-green)', cursor: 'pointer' }}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            {chartLoading ? (
              <SkeletonChart height={360} />
            ) : (
              <CandlestickChart data={chartData} overlays={overlays} showVolume={overlays.volume} />
            )}
          </div>

          {/* RSI Panel */}
          <div className="card">
            {chartLoading ? <SkeletonChart height={120} /> : <RSIChart data={indicatorData.length ? indicatorData : chartData} />}
          </div>

          {/* MACD Panel */}
          <div className="card">
            {chartLoading ? <SkeletonChart height={120} /> : <MACDChart data={indicatorData.length ? indicatorData : chartData} />}
          </div>

          {/* AI Analysis Card */}
          {(analysisLoading || analysis) && (
            <div className="card" style={{ border: '1px solid rgba(74,158,255,0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Brain size={18} color="var(--accent-blue)" />
                <h3 style={{ fontSize: 15, fontWeight: 700 }}>AI Analysis</h3>
              </div>

              {analysisLoading ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, padding: '12px 16px', background: 'rgba(74,158,255,0.05)', borderRadius: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-blue)', animation: 'pulse-dot 1s infinite' }} />
                    <span style={{ fontSize: 13, color: 'var(--accent-blue)', fontStyle: 'italic' }}>
                      Claude is analyzing ${ticker}<span className="thinking-dots" />
                    </span>
                  </div>
                  <SkeletonText lines={6} />
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <VerdictBadge verdict={analysis.verdict || analysis.recommendation} confidence={analysis.confidence} />

                  {analysis.summary && (
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, background: 'rgba(30,45,74,0.5)', padding: '12px 16px', borderRadius: 8 }}>
                      {analysis.summary}
                    </p>
                  )}

                  {analysis.reasoning?.length > 0 && (
                    <Collapsible title="Reasoning">
                      <ul style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {analysis.reasoning.map((r, i) => (
                          <li key={i} style={{ display: 'flex', gap: 10, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                            <span style={{ color: 'var(--accent-green)', flexShrink: 0, marginTop: 2 }}>▸</span>
                            {r}
                          </li>
                        ))}
                      </ul>
                    </Collapsible>
                  )}

                  {analysis.risks?.length > 0 && (
                    <Collapsible title="Key Risks">
                      <ul style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {analysis.risks.map((r, i) => (
                          <li key={i} style={{ display: 'flex', gap: 10, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                            <span style={{ color: 'var(--accent-red)', flexShrink: 0, marginTop: 2 }}>▸</span>
                            {r}
                          </li>
                        ))}
                      </ul>
                    </Collapsible>
                  )}

                  {(analysis.support || analysis.resistance || analysis.priceLevels) && (
                    <Collapsible title="Key Price Levels">
                      <div style={{ display: 'flex', gap: 16 }}>
                        {analysis.support && (
                          <div style={{ flex: 1, padding: '10px 14px', background: 'rgba(0,212,170,0.05)', borderRadius: 8, border: '1px solid rgba(0,212,170,0.2)' }}>
                            <div style={{ fontSize: 11, color: 'var(--accent-green)', fontWeight: 600, marginBottom: 4 }}>SUPPORT</div>
                            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, fontWeight: 700 }}>${analysis.support}</div>
                          </div>
                        )}
                        {analysis.resistance && (
                          <div style={{ flex: 1, padding: '10px 14px', background: 'rgba(255,71,87,0.05)', borderRadius: 8, border: '1px solid rgba(255,71,87,0.2)' }}>
                            <div style={{ fontSize: 11, color: 'var(--accent-red)', fontWeight: 600, marginBottom: 4 }}>RESISTANCE</div>
                            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, fontWeight: 700 }}>${analysis.resistance}</div>
                          </div>
                        )}
                      </div>
                    </Collapsible>
                  )}

                  <div style={{ display: 'flex', gap: 6, padding: '10px 14px', background: 'rgba(255,71,87,0.05)', borderRadius: 8, border: '1px solid rgba(255,71,87,0.15)' }}>
                    <AlertTriangle size={14} color="var(--accent-red)" style={{ flexShrink: 0, marginTop: 1 }} />
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      This is AI-generated analysis, not financial advice. Always do your own research before making investment decisions.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Stats sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Key Statistics</h3>
            {statsLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[...Array(8)].map((_, i) => <SkeletonBox key={i} height={32} />)}
              </div>
            ) : stats ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {Object.entries(STAT_LABELS).map(([key, label]) => {
                  const val = stats[key] ?? stats[label.replace(/\s/g, '').toLowerCase()]
                  if (val == null) return null
                  return (
                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(30,45,74,0.7)' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 600 }}>
                        {key === 'dividendYield' ? `${val}%` : key === 'marketCap' ? `$${(parseFloat(val) / 1e9).toFixed(2)}B` : val}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>No stats available</p>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-dot { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
      `}</style>
    </div>
  )
}
