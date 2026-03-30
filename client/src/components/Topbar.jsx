import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, LogOut, Menu, X, User } from 'lucide-react'
import useAuthStore from '../stores/authStore'
import useDebounce from '../hooks/useDebounce'
import { searchStocks } from '../api/stocks'

export default function Topbar({ collapsed, onToggle }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const debouncedQuery = useDebounce(query, 400)
  const searchRef = useRef(null)

  useEffect(() => {
    if (!debouncedQuery.trim() || debouncedQuery.length < 1) {
      setResults([])
      setShowDropdown(false)
      return
    }
    setSearching(true)
    searchStocks(debouncedQuery)
      .then(({ data }) => {
        const list = data.results || data || []
        setResults(list.slice(0, 8))
        setShowDropdown(list.length > 0)
      })
      .catch(() => setResults([]))
      .finally(() => setSearching(false))
  }, [debouncedQuery])

  useEffect(() => {
    function handler(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleSelect(ticker) {
    setQuery('')
    setShowDropdown(false)
    navigate(`/stock/${ticker}`)
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <header
      style={{
        height: 'var(--topbar-height)',
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: 16,
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      <button
        onClick={onToggle}
        style={{
          background: 'transparent',
          color: 'var(--text-secondary)',
          padding: 6,
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        {collapsed ? <Menu size={18} /> : <X size={18} />}
      </button>

      {/* Search */}
      <div ref={searchRef} style={{ flex: 1, maxWidth: 440, position: 'relative' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(30,45,74,0.5)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '0 12px',
            gap: 8,
          }}
        >
          <Search size={15} color="var(--text-secondary)" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search ticker or company..."
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: 13,
              padding: '8px 0',
              width: '100%',
              fontFamily: 'Inter, sans-serif',
            }}
            onFocus={() => results.length > 0 && setShowDropdown(true)}
          />
          {searching && (
            <div
              style={{
                width: 12,
                height: 12,
                border: '2px solid var(--border)',
                borderTopColor: 'var(--accent-blue)',
                borderRadius: '50%',
                animation: 'spin 0.6s linear infinite',
                flexShrink: 0,
              }}
            />
          )}
        </div>

        {showDropdown && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              right: 0,
              background: '#0f1629',
              border: '1px solid var(--border)',
              borderRadius: 8,
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              zIndex: 200,
            }}
          >
            {results.map((r) => {
              const ticker = r.ticker || r.symbol || r
              const name = r.name || r.companyName || r.description || ''
              return (
                <button
                  key={ticker}
                  onClick={() => handleSelect(ticker)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    width: '100%',
                    padding: '10px 14px',
                    background: 'transparent',
                    borderTop: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                    textAlign: 'left',
                    transition: 'background 0.15s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(74,158,255,0.08)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <span
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontWeight: 700,
                      fontSize: 13,
                      color: 'var(--accent-green)',
                      minWidth: 60,
                    }}
                  >
                    {ticker}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {name}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div style={{ flex: 1 }} />

      {/* User info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt="avatar"
              style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)' }}
            />
          ) : (
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'rgba(74,158,255,0.2)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <User size={16} color="var(--accent-blue)" />
            </div>
          )}
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.name || user?.displayName || 'User'}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="btn btn-outline"
          style={{ padding: '6px 12px', fontSize: 12 }}
          title="Logout"
        >
          <LogOut size={14} />
          Logout
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </header>
  )
}
