import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScanSearch, Plus, Zap, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import useWatchlistStore from '../stores/watchlistStore'
import { runScreener } from '../api/screener'
import { getScreenerPicks } from '../api/ai'
import { SkeletonTable, SkeletonCard } from '../components/Skeleton'

const SECTORS = ['All', 'Technology', 'Healthcare', 'Finance', 'Energy', 'Consumer', 'Industrials']
const CAP_OPTIONS = [
  { value: 'any', label: 'Any' },
  { value: 'small', label: 'Small (<$2B)' },
  { value: 'mid', label: 'Mid ($2B–$10B)' },
  { value: 'large', label: 'Large (>$10B)' },
]

function DualRangeSlider({ min, max, step = 1, low, high, onChange, label }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span className="form-label">{label}</span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--accent-blue)' }}>
          {low} – {high}
        </span>
      </div>
      <div style={{ position: 'relative', height: 20 }}>
        <div style={{
          position: 'absolute', top: '50%', left: 0, right: 0, height: 4,
          background: 'var(--border)', borderRadius: 2, transform: 'translateY(-50%)',
        }} />
        <div style={{
          position: 'absolute', top: '50%', height: 4, borderRadius: 2,
          background: 'var(--accent-green)', transform: 'translateY(-50%)',
          left: `${((low - min) / (max - min)) * 100}%`,
          right: `${100 - ((high - min) / (max - min)) * 100}%`,
        }} />
        <input
          type="range" min={min} max={max} step={step} value={low}
          onChange={(e) => onChange(Math.min(parseInt(e.target.value), high - step), high)}
          style={{ position: 'absolute', width: '100%', opacity: 0, cursor: 'pointer', zIndex: low > high - 10 ? 5 : 3, height: 20 }}
        />
        <input
          type="range" min={min} max={max} step={step} value={high}
          onChange={(e) => onChange(low, Math.max(parseInt(e.target.value), low + step))}
          style={{ position: 'absolute', width: '100%', opacity: 0, cursor: 'pointer', zIndex: 4, height: 20 }}
        />
      </div>
    </div>
  )
}

export default function Screener() {
  const navigate = useNavigate()
  const { add } = useWatchlistStore()
  const [filters, setFilters] = useState({
    rsiMin: 20, rsiMax: 80,
    changeMin: '', changeMax: '',
    volumeSpike: false,
    cap: 'any',
    sector: 'All',
  })
  const [results, setResults] = useState([])
  const [aiPicks, setAiPicks] = useState([])
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [hasRun, setHasRun] = useState(false)

  function setFilter(k, v) {
    setFilters((f) => ({ ...f, [k]: v }))
  }

  async function handleRun() {
    setLoading(true)
    setHasRun(true)
    setAiPicks([])
    try {
      const params = {
        rsi_min: filters.rsiMin,
        rsi_max: filters.rsiMax,
        cap: filters.cap !== 'any' ? filters.cap : undefined,
        sector: filters.sector !== 'All' ? filters.sector : undefined,
        volume_spike: filters.volumeSpike || undefined,
      }
      if (filters.changeMin !== '') params.change_min = filters.changeMin
      if (filters.changeMax !== '') params.change_max = filters.changeMax

      const { data } = await runScreener(params)
      const list = data.results || data || []
      setResults(list)

      // Fetch AI picks in parallel
      if (list.length > 0) {
        setAiLoading(true)
        getScreenerPicks(list.slice(0, 20))
          .then(({ data: pd }) => setAiPicks(pd.picks || pd || []))
          .catch(() => {})
          .finally(() => setAiLoading(false))
      }
    } catch {
      toast.error('Screener failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-enter" style={{ maxWidth: 1300 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Stock Screener</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>Filter stocks by technical and fundamental criteria</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, alignItems: 'start' }}>
        {/* Filter Panel */}
        <div className="card" style={{ position: 'sticky', top: 80 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 20 }}>Filters</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <DualRangeSlider
              label="RSI Range"
              min={0} max={100}
              low={filters.rsiMin} high={filters.rsiMax}
              onChange={(lo, hi) => setFilters((f) => ({ ...f, rsiMin: lo, rsiMax: hi }))}
            />

            <div>
              <label className="form-label" style={{ display: 'block', marginBottom: 8 }}>1D Price Change %</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  className="form-input"
                  type="number"
                  placeholder="Min"
                  value={filters.changeMin}
                  onChange={(e) => setFilter('changeMin', e.target.value)}
                  style={{ flex: 1 }}
                />
                <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>to</span>
                <input
                  className="form-input"
                  type="number"
                  placeholder="Max"
                  value={filters.changeMax}
                  onChange={(e) => setFilter('changeMax', e.target.value)}
                  style={{ flex: 1 }}
                />
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={filters.volumeSpike}
                onChange={(e) => setFilter('volumeSpike', e.target.checked)}
                style={{ accentColor: 'var(--accent-green)', width: 16, height: 16, cursor: 'pointer' }}
              />
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>Volume Spike</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>&gt;50% above 30-day avg</div>
              </div>
            </label>

            <div>
              <label className="form-label" style={{ display: 'block', marginBottom: 8 }}>Market Cap</label>
              <select
                className="form-input"
                value={filters.cap}
                onChange={(e) => setFilter('cap', e.target.value)}
              >
                {CAP_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label" style={{ display: 'block', marginBottom: 8 }}>Sector</label>
              <select
                className="form-input"
                value={filters.sector}
                onChange={(e) => setFilter('sector', e.target.value)}
              >
                {SECTORS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleRun}
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
            >
              {loading ? (
                <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />Running...</>
              ) : (
                <><ScanSearch size={14} />Run Screener</>
              )}
            </button>
          </div>
        </div>

        {/* Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* AI Picks Card */}
          {(aiLoading || aiPicks.length > 0) && (
            <div className="card" style={{ border: '1px solid rgba(74,158,255,0.3)', background: 'linear-gradient(135deg, rgba(74,158,255,0.05) 0%, transparent 100%)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Zap size={16} color="var(--accent-blue)" />
                <h3 style={{ fontSize: 14, fontWeight: 700 }}>AI Pick of the Day</h3>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>— Claude's top picks from results</span>
              </div>
              {aiLoading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {[1, 2, 3].map((k) => <SkeletonCard key={k} lines={2} />)}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                  {aiPicks.map((pick, i) => (
                    <div
                      key={i}
                      onClick={() => navigate(`/stock/${pick.ticker || pick.symbol}`)}
                      style={{ padding: '14px', background: 'rgba(30,45,74,0.5)', borderRadius: 10, border: '1px solid var(--border)', cursor: 'pointer', transition: 'var(--transition)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-blue)'; e.currentTarget.style.transform = 'scale(1.02)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'scale(1)' }}
                    >
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 14, color: 'var(--accent-green)', marginBottom: 4 }}>
                        {pick.ticker || pick.symbol}
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {pick.reason || pick.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Results Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700 }}>
                Results{hasRun && ` (${results.length})`}
              </h3>
            </div>
            {loading ? (
              <div style={{ padding: 16 }}><SkeletonTable rows={8} cols={8} /></div>
            ) : !hasRun ? (
              <div className="empty-state">
                <ScanSearch size={36} />
                <p style={{ fontSize: 14 }}>Configure filters and run the screener</p>
              </div>
            ) : results.length === 0 ? (
              <div className="empty-state">
                <ScanSearch size={36} />
                <p style={{ fontSize: 14 }}>No stocks matched your filters</p>
                <p style={{ fontSize: 12 }}>Try widening the criteria</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      {['Ticker', 'Company', 'Price', 'Change%', 'RSI', 'Volume', 'Mkt Cap', 'Sector', ''].map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, i) => {
                      const ticker = r.ticker || r.symbol
                      const cp = r.changePercent || r.change
                      const isPos = parseFloat(cp || 0) >= 0
                      return (
                        <tr key={i} style={{ cursor: 'pointer' }} onClick={() => navigate(`/stock/${ticker}`)}>
                          <td><span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: 'var(--accent-green)', fontSize: 13 }}>{ticker}</span></td>
                          <td style={{ color: 'var(--text-secondary)', maxWidth: 140 }} className="truncate">{r.name || r.companyName || '—'}</td>
                          <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>{r.price ? `$${parseFloat(r.price).toFixed(2)}` : '—'}</td>
                          <td>
                            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: isPos ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 600 }}>
                              {isPos ? '+' : ''}{parseFloat(cp || 0).toFixed(2)}%
                            </span>
                          </td>
                          <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>
                            {r.rsi != null ? (
                              <span style={{ color: r.rsi > 70 ? 'var(--accent-red)' : r.rsi < 30 ? 'var(--accent-green)' : 'var(--text-primary)' }}>
                                {parseFloat(r.rsi).toFixed(1)}
                              </span>
                            ) : '—'}
                          </td>
                          <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{r.volume ? `${(r.volume / 1e6).toFixed(2)}M` : '—'}</td>
                          <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                            {r.marketCap ? `$${(r.marketCap / 1e9).toFixed(1)}B` : '—'}
                          </td>
                          <td>
                            {r.sector ? (
                              <span style={{ fontSize: 11, color: 'var(--text-secondary)', background: 'rgba(30,45,74,0.7)', padding: '2px 8px', borderRadius: 4 }}>{r.sector}</span>
                            ) : '—'}
                          </td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => add(ticker)}
                              className="btn btn-outline"
                              style={{ padding: '4px 10px', fontSize: 11, gap: 4 }}
                            >
                              <Plus size={12} />
                              Add
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
