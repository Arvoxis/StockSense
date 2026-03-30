import React from 'react'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const d = Object.fromEntries(payload.map((p) => [p.dataKey, p.value]))
  return (
    <div style={{
      background: '#0f1629', border: '1px solid #1e2d4a', borderRadius: 8,
      padding: '8px 12px', fontSize: 12, fontFamily: 'JetBrains Mono, monospace', lineHeight: 1.8,
    }}>
      <div style={{ color: '#8892b0', marginBottom: 4, fontFamily: 'Inter', fontSize: 11 }}>{label}</div>
      {d.macd != null && <div>MACD: <span style={{ color: '#4a9eff' }}>{d.macd?.toFixed(4)}</span></div>}
      {d.signal != null && <div>Signal: <span style={{ color: '#ffd32a' }}>{d.signal?.toFixed(4)}</span></div>}
      {d.histogram != null && (
        <div>Hist: <span style={{ color: d.histogram >= 0 ? '#00d4aa' : '#ff4757' }}>{d.histogram?.toFixed(4)}</span></div>
      )}
    </div>
  )
}

export default function MACDChart({ data = [] }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>MACD (12, 26, 9)</span>
        <div className="tooltip-container">
          <span style={{ fontSize: 11, color: 'var(--text-secondary)', cursor: 'help', padding: '2px 6px', border: '1px solid var(--border)', borderRadius: 4 }}>?</span>
          <div className="tooltip-text">
            Moving Average Convergence Divergence. The MACD line crossing above the signal line is bullish. The histogram shows the difference — green bars = bullish momentum growing, red = bearish momentum growing.
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={120}>
        <ComposedChart data={data} margin={{ top: 4, right: 60, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="#1e2d4a" strokeOpacity={0.5} vertical={false} />
          <XAxis dataKey="date" tick={{ fill: '#8892b0', fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
          <YAxis orientation="right" tick={{ fill: '#8892b0', fontSize: 11 }} tickLine={false} axisLine={false} width={50} tickFormatter={(v) => v.toFixed(2)} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="#8892b0" strokeOpacity={0.4} />
          <Bar dataKey="histogram" isAnimationActive={false}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.histogram >= 0 ? '#00d4aa' : '#ff4757'} fillOpacity={0.7} />
            ))}
          </Bar>
          <Line type="monotone" dataKey="macd" stroke="#4a9eff" strokeWidth={1.5} dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="signal" stroke="#ffd32a" strokeWidth={1.5} dot={false} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
