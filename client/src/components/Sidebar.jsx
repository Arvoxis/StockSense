import React, { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Star,
  ScanSearch,
  Newspaper,
  UserCircle,
  TrendingUp,
  Circle,
} from 'lucide-react'
import { getMarketIndices } from '../api/market'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/watchlist', icon: Star, label: 'Watchlist' },
  { to: '/screener', icon: ScanSearch, label: 'Screener' },
  { to: '/news', icon: Newspaper, label: 'News' },
  { to: '/profile', icon: UserCircle, label: 'Profile' },
]

export default function Sidebar({ collapsed, onToggle }) {
  const [marketOpen, setMarketOpen] = useState(null)

  useEffect(() => {
    getMarketIndices()
      .then(({ data }) => {
        setMarketOpen(data.marketOpen ?? data.isOpen ?? null)
      })
      .catch(() => setMarketOpen(null))
  }, [])

  return (
    <aside
      style={{
        width: collapsed ? 0 : 'var(--sidebar-width)',
        minWidth: collapsed ? 0 : 'var(--sidebar-width)',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        background: 'var(--bg-card)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'width 0.25s ease, min-width 0.25s ease',
        zIndex: 50,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: '20px 20px 16px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <TrendingUp size={22} color="var(--accent-green)" />
          <div>
            <div
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontWeight: 700,
                fontSize: 16,
                color: 'var(--text-primary)',
                letterSpacing: '-0.5px',
              }}
            >
              StockSense
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>
              AI TRADING INTEL
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '11px 20px',
              color: isActive ? 'var(--accent-green)' : 'var(--text-secondary)',
              borderLeft: isActive ? '2px solid var(--accent-green)' : '2px solid transparent',
              fontSize: 14,
              fontWeight: isActive ? 600 : 400,
              transition: 'var(--transition)',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              background: isActive ? 'rgba(0,212,170,0.06)' : 'transparent',
            })}
          >
            {({ isActive }) => (
              <>
                <Icon size={18} color={isActive ? 'var(--accent-green)' : 'var(--text-secondary)'} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Market status */}
      <div
        style={{
          padding: '16px 20px',
          borderTop: '1px solid var(--border)',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            borderRadius: 6,
            background:
              marketOpen === null
                ? 'rgba(136,146,176,0.1)'
                : marketOpen
                ? 'rgba(0,212,170,0.1)'
                : 'rgba(255,71,87,0.1)',
            border: `1px solid ${
              marketOpen === null
                ? 'var(--border)'
                : marketOpen
                ? 'rgba(0,212,170,0.3)'
                : 'rgba(255,71,87,0.3)'
            }`,
          }}
        >
          <Circle
            size={8}
            fill={
              marketOpen === null ? 'var(--text-secondary)' : marketOpen ? 'var(--accent-green)' : 'var(--accent-red)'
            }
            color={
              marketOpen === null ? 'var(--text-secondary)' : marketOpen ? 'var(--accent-green)' : 'var(--accent-red)'
            }
          />
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              fontFamily: 'JetBrains Mono, monospace',
              color:
                marketOpen === null
                  ? 'var(--text-secondary)'
                  : marketOpen
                  ? 'var(--accent-green)'
                  : 'var(--accent-red)',
              letterSpacing: '0.5px',
            }}
          >
            {marketOpen === null ? 'LOADING' : marketOpen ? 'MARKET OPEN' : 'MARKET CLOSED'}
          </span>
        </div>
      </div>
    </aside>
  )
}
