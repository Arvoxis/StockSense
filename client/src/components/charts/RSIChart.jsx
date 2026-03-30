import React from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const rsi = payload[0]?.value
  return (
    <div style={{
      background: '#0f1629', border: '1px solid #1e2d4a', borderRadius: 8,
      padding: '8px 12px', fontSize: 12, fontFamily: 'JetBrains Mono, monospace',
    }}>
      <div style={{ color: '#8892b0', marginBottom: 4, fontFamily: 'Inter', fontSize: 11 }}>{label}</div>
      <div style={{ color: rsi > 70 ? '#ff4757' : rsi < 30 ? '#00d4aa' : '#fff' }}>
        RSI: {rsi?.toFixed(2)}
      </div>
    </div>
  )
}

export default function RSIChart({ data = [] }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>RSI (14)</span>
        <div className="tooltip-container">
          <span style={{ fontSize: 11, color: 'var(--text-secondary)', cursor: 'help', padding: '2px 6px', border: '1px solid var(--border)', borderRadius: 4 }}>?</span>
          <div className="tooltip-text">
            Relative Strength Index (14). Measures momentum on a scale of 0–100. Above 70 = overbought (potential sell signal). Below 30 = oversold (potential buy signal). Between 30–70 = neutral.
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={data} margin={{ top: 4, right: 60, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="#1e2d4a" strokeOpacity={0.5} vertical={false} />
          <XAxis dataKey="date" tick={{ fill: '#8892b0', fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
          <YAxis
            orientation="right"
            domain={[0, 100]}
            ticks={[0, 30, 50, 70, 100]}
            tick={{ fill: '#8892b0', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={35}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={70} stroke="#ff4757" strokeDasharray="4 3" strokeOpacity={0.7} label={{ value: '70', fill: '#ff4757', fontSize: 10, position: 'right' }} />
          <ReferenceLine y={30} stroke="#00d4aa" strokeDasharray="4 3" strokeOpacity={0.7} label={{ value: '30', fill: '#00d4aa', fontSize: 10, position: 'right' }} />
          <ReferenceLine y={50} stroke="#8892b0" strokeDasharray="2 4" strokeOpacity={0.3} />
          <Line type="monotone" dataKey="rsi" stroke="#4a9eff" strokeWidth={1.5} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
