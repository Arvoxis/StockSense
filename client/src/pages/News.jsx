import React, { useEffect, useState } from 'react'
import { Newspaper, Search, ExternalLink, RefreshCw } from 'lucide-react'
import useNewsStore from '../stores/newsStore'
import { SkeletonCard } from '../components/Skeleton'
import useDebounce from '../hooks/useDebounce'

const SENTIMENT_TABS = ['All', 'Bullish', 'Bearish', 'Neutral']

function SentimentBadge({ sentiment, reason }) {
  const s = (sentiment || '').toLowerCase()
  let color, bg, border
  if (s === 'bullish') { color = 'var(--accent-green)'; bg = 'rgba(0,212,170,0.1)'; border = 'rgba(0,212,170,0.3)' }
  else if (s === 'bearish') { color = 'var(--accent-red)'; bg = 'rgba(255,71,87,0.1)'; border = 'rgba(255,71,87,0.3)' }
  else { color = 'var(--text-secondary)'; bg = 'rgba(136,146,176,0.1)'; border = 'rgba(136,146,176,0.2)' }

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 20, background: bg, border: `1px solid ${border}` }}>
      <span style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'capitalize', letterSpacing: '0.3px' }}>
        {sentiment || 'Neutral'}
      </span>
      {reason && (
        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>— {reason}</span>
      )}
    </div>
  )
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const now = Date.now()
  const t = new Date(dateStr).getTime()
  const diff = Math.floor((now - t) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function NewsCard({ article }) {
  const href = article.url || article.link || '#'
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{ display: 'block', textDecoration: 'none' }}
    >
      <div
        className="card"
        style={{ cursor: 'pointer', transition: 'var(--transition)' }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.01)'; e.currentTarget.style.borderColor = 'var(--border-hover)' }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = 'var(--border)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.5, color: 'var(--text-primary)', marginBottom: 6 }}>
              {article.headline || article.title}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500 }}>
                {article.source || article.publisher?.name || 'Unknown Source'}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                {timeAgo(article.datetime || article.publishedAt || article.date)}
              </span>
            </div>
          </div>
          <ExternalLink size={14} color="var(--text-secondary)" style={{ flexShrink: 0, marginTop: 2 }} />
        </div>
        <SentimentBadge sentiment={article.sentiment} reason={article.sentimentReason || article.reason} />
      </div>
    </a>
  )
}

export default function News() {
  const { articles, loading, hasMore, fetch, loadMore, filters, setFilter } = useNewsStore()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 400)

  useEffect(() => {
    fetch()
  }, [])

  useEffect(() => {
    if (debouncedSearch !== filters.ticker) {
      setFilter('ticker', debouncedSearch)
    }
  }, [debouncedSearch])

  useEffect(() => {
    fetch()
  }, [filters])

  function handleTab(tab) {
    const s = tab === 'All' ? 'all' : tab.toLowerCase()
    setFilter('sentiment', s)
  }

  const activeSentiment = filters.sentiment === 'all' ? 'All' : filters.sentiment.charAt(0).toUpperCase() + filters.sentiment.slice(1)

  return (
    <div className="page-enter" style={{ maxWidth: 1000 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Market News</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>AI-classified sentiment on the latest financial news</p>
      </div>

      {/* Search + filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(30,45,74,0.5)', border: '1px solid var(--border)', borderRadius: 8, padding: '0 12px', flex: 1, maxWidth: 360 }}>
          <Search size={14} color="var(--text-secondary)" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by ticker or keyword..."
            style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: 13, padding: '9px 0', width: '100%', fontFamily: 'Inter, sans-serif' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 4 }}>
          {SENTIMENT_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => handleTab(tab)}
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                background: activeSentiment === tab ? 'var(--accent-blue)' : 'transparent',
                color: activeSentiment === tab ? '#000' : 'var(--text-secondary)',
                border: activeSentiment === tab ? 'none' : '1px solid var(--border)',
                transition: 'var(--transition)',
                cursor: 'pointer',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* News grid */}
      {loading && articles.length === 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
          {[...Array(8)].map((_, i) => <SkeletonCard key={i} lines={3} />)}
        </div>
      ) : articles.length === 0 ? (
        <div className="empty-state">
          <Newspaper size={36} />
          <p style={{ fontSize: 14 }}>No news articles found</p>
          <p style={{ fontSize: 12 }}>Try a different search or filter</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
          {articles.map((a, i) => <NewsCard key={i} article={a} />)}
        </div>
      )}

      {/* Load more */}
      {articles.length > 0 && (
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          {loading ? (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 13 }}>
              <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
              Loading more...
            </div>
          ) : hasMore ? (
            <button onClick={loadMore} className="btn btn-outline" style={{ padding: '10px 28px' }}>
              Load More
            </button>
          ) : (
            <p style={{ color: 'var(--text-secondary)', fontSize: 12 }}>All articles loaded</p>
          )}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
