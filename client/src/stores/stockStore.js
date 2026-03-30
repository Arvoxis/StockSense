import { create } from 'zustand'
import toast from 'react-hot-toast'
import { getQuote, getChart, getStats, getIndicators } from '../api/stocks'
import { analyzeStock, whyMoving } from '../api/ai'

function formatDate(unixSeconds) {
  const d = new Date(unixSeconds * 1000)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const useStockStore = create((set) => ({
  quote: null,
  chartData: [],
  stats: null,
  analysis: null,
  whyMovingData: null,
  range: '1M',

  quoteLoading: false,
  chartLoading: false,
  statsLoading: false,
  analysisLoading: false,
  whyMovingLoading: false,

  setRange: (range) => set({ range, chartData: [] }),

  fetchQuote: async (ticker) => {
    set({ quoteLoading: true, quote: null })
    try {
      const { data } = await getQuote(ticker)
      set({ quote: data.quote || data })
    } catch (err) {
      const msg = err.response?.data?.error || `${ticker} not found or not supported`
      toast.error(msg)
    } finally {
      set({ quoteLoading: false })
    }
  },

  fetchChart: async (ticker, range) => {
    set({ chartLoading: true })
    try {
      // Fetch chart data and indicators in parallel
      const [chartRes, indicatorsRes] = await Promise.allSettled([
        getChart(ticker, range),
        getIndicators(ticker),
      ])

      const candles = chartRes.status === 'fulfilled'
        ? (chartRes.value.data.chart || chartRes.value.data || [])
        : []

      const indicatorPoints = indicatorsRes.status === 'fulfilled'
        ? (indicatorsRes.value.data || [])
        : []

      // Build lookup map: time → indicator values
      const indMap = {}
      indicatorPoints.forEach((p) => { indMap[p.time] = p })

      // Merge candles with indicators and add formatted date field
      const chartData = candles.map((c) => {
        const ind = indMap[c.time] || {}
        return {
          ...c,
          time: Number(c.time),
          date: formatDate(c.time),
          ema20: ind.ema20 ?? null,
          ema50: ind.ema50 ?? null,
          ema200: ind.ema200 ?? null,
          bbUpper: ind.bbUpper ?? null,
          bbMiddle: ind.bbMiddle ?? null,
          bbLower: ind.bbLower ?? null,
          rsi: ind.rsi ?? null,
          macd: ind.macd ?? null,
          signal: ind.macdSignal ?? null,
          histogram: ind.macdHistogram ?? null,
        }
      })

      set({ chartData })
    } catch {
      toast.error(`Failed to load chart data`)
    } finally {
      set({ chartLoading: false })
    }
  },

  fetchStats: async (ticker) => {
    set({ statsLoading: true, stats: null })
    try {
      const { data } = await getStats(ticker)
      set({ stats: data.stats || data })
    } catch {
      // Stats failing silently is OK — chart and quote are more important
    } finally {
      set({ statsLoading: false })
    }
  },

  analyze: async (payload) => {
    set({ analysisLoading: true, analysis: null })
    try {
      const { data } = await analyzeStock(payload)
      set({ analysis: data.analysis || data })
      toast.success('AI analysis complete')
    } catch {
      toast.error('AI analysis failed')
    } finally {
      set({ analysisLoading: false })
    }
  },

  fetchWhyMoving: async (ticker) => {
    set({ whyMovingLoading: true, whyMovingData: null })
    try {
      const { data } = await whyMoving(ticker)
      set({ whyMovingData: data })
    } catch {
      // silent — not critical
    } finally {
      set({ whyMovingLoading: false })
    }
  },

  reset: () =>
    set({
      quote: null, chartData: [], stats: null, analysis: null,
      whyMovingData: null, range: '1M',
    }),
}))

export default useStockStore
