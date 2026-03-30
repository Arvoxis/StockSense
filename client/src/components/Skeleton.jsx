import React from 'react'

export function SkeletonBox({ width = '100%', height = 20, radius = 6, style = {} }) {
  return (
    <div
      className="skeleton"
      style={{ width, height, borderRadius: radius, ...style }}
    />
  )
}

export function SkeletonCard({ lines = 3 }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <SkeletonBox height={18} width="60%" />
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBox key={i} height={14} width={i === lines - 1 ? '40%' : '100%'} />
      ))}
    </div>
  )
}

export function SkeletonTable({ rows = 5, cols = 6 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: 12,
            padding: '12px 16px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          {Array.from({ length: cols }).map((_, c) => (
            <SkeletonBox key={c} height={14} width={c === 0 ? '60px' : '80%'} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function SkeletonChart({ height = 300 }) {
  return <SkeletonBox height={height} radius={8} />
}

export function SkeletonText({ lines = 4 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBox
          key={i}
          height={14}
          width={i === lines - 1 ? `${40 + Math.random() * 30}%` : `${70 + Math.random() * 30}%`}
        />
      ))}
    </div>
  )
}
