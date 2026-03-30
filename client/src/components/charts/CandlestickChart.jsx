import React, { useState } from 'react'
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts'

// Custom candlestick bar shape
function CandleBar(props) {
  const { x, y, width, payload } = props
  if (!payload) return null

  const { open, high, low, close } = payload
  if ([open, high, low, close].some((v) => v == null)) return null

  const isGreen = close >= open
  const color = isGreen ? '#00d4aa' : '#ff4757'

  // We need to map price values to pixel coordinates
  // The bar's y/height is controlled by Recharts via the 'range' accessor
  // We use a trick: render nothing for the normal bar, draw custom SVG
  const { height, yAxis } = props
  if (!yAxis) return null

  const scale = yAxis.scale
  if (!scale) return null

  const yHigh = scale(high)
  const yLow = scale(low)
  const yOpen = scale(open)
  const yClose = scale(close)

  const bodyTop = Math.min(yOpen, yClose)
  const bodyHeight = Math.max(2, Math.abs(yClose - yOpen))
  const centerX = x + width / 2
  const wickWidth = 1.5
  const bodyWidth = Math.max(width * 0.7, 4)

  return (
    <g>
      {/* Wick */}
      <line
        x1={centerX}
        x2={centerX}
        y1={yHigh}
        y2={yLow}
        stroke={color}
        strokeWidth={wickWidth}
      />
      {/* Body */}
      <rect
        x={x + (width - bodyWidth) / 2}
        y={bodyTop}
        width={bodyWidth}
        height={bodyHeight}
        fill={color}
        stroke={color}
        strokeWidth={0.5}
      />
    </g>
  )
}

const INDICATOR_TOOLTIPS = {
  ema20: 'EMA 20: The 20-period Exponential Moving Average. Shows short-term trend direction. Price above EMA = bullish momentum.',
  ema50: 'EMA 50: The 50-period EMA. Medium-term trend indicator. A 20/50 EMA crossover (golden cross) is a bullish signal.',
  ema200: 'EMA 200: The 200-period EMA. Defines long-term trend. Price above EMA 200 = bull market. Below = bear market.',
  bbUpper: 'Bollinger Bands: Upper band is 2 standard deviations above the 20-day SMA. Price near upper band = potentially overbought.',
  bbLower: 'Bollinger Bands: Lower band is 2 standard deviations below the 20-day SMA. Price near lower band = potentially oversold.',
}

function IndicatorLabel({ label, tooltip }) {
  return (
    <div className="tooltip-container" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontSize: 11, color: 'var(--text-secondary)', cursor: 'help' }}>?</span>
      <div className="tooltip-text">{tooltip}</div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  return (
    <div style={{
      background: '#0f1629',
      border: '1px solid #1e2d4a',
      borderRadius: 8,
      padding: '10px 14px',
      fontSize: 12,
      fontFamily: 'JetBrains Mono, monospace',
      lineHeight: 1.8,
      minWidth: 160,
    }}>
      <div style={{ color: '#8892b0', marginBottom: 4, fontFamily: 'Inter, sans-serif', fontSize: 11 }}>{label}</div>
      {d.open != null && <div>O: <span style={{ color: '#fff' }}>{d.open?.toFixed(2)}</span></div>}
      {d.high != null && <div>H: <span style={{ color: '#00d4aa' }}>{d.high?.toFixed(2)}</span></div>}
      {d.low != null && <div>L: <span style={{ color: '#ff4757' }}>{d.low?.toFixed(2)}</span></div>}
      {d.close != null && <div>C: <span style={{ color: '#fff', fontWeight: 700 }}>{d.close?.toFixed(2)}</span></div>}
      {d.volume != null && (
        <div style={{ marginTop: 4, color: '#8892b0' }}>
          Vol: <span style={{ color: '#4a9eff' }}>{(d.volume / 1e6).toFixed(2)}M</span>
        </div>
      )}
    </div>
  )
}

export default function CandlestickChart({ data = [], overlays = {}, showVolume = true }) {
  if (!data.length) {
    return (
      <div style={{ height: 360, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
        No chart data
      </div>
    )
  }

  const prices = data.flatMap((d) => [d.high, d.low]).filter(Boolean)
  const minPrice = Math.min(...prices) * 0.998
  const maxPrice = Math.max(...prices) * 1.002

  return (
    <div>
      {/* Overlay toggle legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 12, padding: '0 4px' }}>
        {overlays.ema20 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 16, height: 2, background: '#4a9eff' }} />
            <IndicatorLabel label="EMA 20" tooltip={INDICATOR_TOOLTIPS.ema20} />
          </div>
        )}
        {overlays.ema50 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 16, height: 2, background: '#ffd32a' }} />
            <IndicatorLabel label="EMA 50" tooltip={INDICATOR_TOOLTIPS.ema50} />
          </div>
        )}
        {overlays.ema200 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 16, height: 2, background: '#ff6b6b' }} />
            <IndicatorLabel label="EMA 200" tooltip={INDICATOR_TOOLTIPS.ema200} />
          </div>
        )}
        {overlays.bollinger && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 16, height: 2, background: '#a29bfe', borderTop: '1px dashed #a29bfe' }} />
            <IndicatorLabel label="Bollinger Bands" tooltip={INDICATOR_TOOLTIPS.bbUpper} />
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={360}>
        <ComposedChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="#1e2d4a" strokeOpacity={0.5} vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: '#8892b0', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            yAxisId="price"
            orientation="right"
            tick={{ fill: '#8892b0', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `$${v.toFixed(0)}`}
            domain={[minPrice, maxPrice]}
            width={60}
          />
          {showVolume && (
            <YAxis
              yAxisId="volume"
              orientation="left"
              tick={{ fill: '#8892b0', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${(v / 1e6).toFixed(0)}M`}
              width={45}
            />
          )}
          <Tooltip content={<CustomTooltip />} />

          {/* Candlestick bars — use a dummy Bar that delegates rendering to CandleBar */}
          <Bar
            yAxisId="price"
            dataKey="close"
            shape={<CandleBar />}
            isAnimationActive={false}
          />

          {/* Volume bars */}
          {showVolume && (
            <Bar
              yAxisId="volume"
              dataKey="volume"
              isAnimationActive={false}
              opacity={0.4}
            >
              {data.map((d, i) => (
                <Cell
                  key={i}
                  fill={d.close >= d.open ? '#00d4aa' : '#ff4757'}
                />
              ))}
            </Bar>
          )}

          {/* EMA lines */}
          {overlays.ema20 && (
            <Line yAxisId="price" type="monotone" dataKey="ema20" stroke="#4a9eff" strokeWidth={1.5} dot={false} isAnimationActive={false} />
          )}
          {overlays.ema50 && (
            <Line yAxisId="price" type="monotone" dataKey="ema50" stroke="#ffd32a" strokeWidth={1.5} dot={false} isAnimationActive={false} />
          )}
          {overlays.ema200 && (
            <Line yAxisId="price" type="monotone" dataKey="ema200" stroke="#ff6b6b" strokeWidth={1.5} dot={false} isAnimationActive={false} />
          )}

          {/* Bollinger Bands */}
          {overlays.bollinger && (
            <>
              <Line yAxisId="price" type="monotone" dataKey="bbUpper" stroke="#a29bfe" strokeWidth={1} strokeDasharray="4 2" dot={false} isAnimationActive={false} />
              <Line yAxisId="price" type="monotone" dataKey="bbMiddle" stroke="#a29bfe" strokeWidth={0.5} strokeOpacity={0.5} dot={false} isAnimationActive={false} />
              <Line yAxisId="price" type="monotone" dataKey="bbLower" stroke="#a29bfe" strokeWidth={1} strokeDasharray="4 2" dot={false} isAnimationActive={false} />
            </>
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
