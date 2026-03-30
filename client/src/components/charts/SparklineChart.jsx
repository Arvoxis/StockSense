import React from 'react'
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts'

export default function SparklineChart({ data = [], positive }) {
  const color = positive === undefined
    ? (data.length >= 2 && data[data.length - 1]?.close >= data[0]?.close ? '#00d4aa' : '#ff4757')
    : positive
    ? '#00d4aa'
    : '#ff4757'

  const chartData = data.map((d, i) => ({
    i,
    v: d?.close ?? d?.value ?? d,
  }))

  return (
    <ResponsiveContainer width={80} height={32}>
      <LineChart data={chartData}>
        <Line
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
        <Tooltip
          contentStyle={{
            background: '#0f1629',
            border: '1px solid #1e2d4a',
            borderRadius: 6,
            fontSize: 11,
            padding: '4px 8px',
          }}
          itemStyle={{ color: color }}
          labelFormatter={() => ''}
          formatter={(v) => [v?.toFixed(2), '']}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
