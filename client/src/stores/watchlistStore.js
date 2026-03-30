import { create } from 'zustand'
import toast from 'react-hot-toast'
import {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  getWatchlistScores,
} from '../api/watchlist'

const useWatchlistStore = create((set, get) => ({
  items: [],       // array of watchlist item objects
  scores: {},      // { TICKER: score }
  loading: false,
  scoresLoading: false,

  fetch: async () => {
    set({ loading: true })
    try {
      const { data } = await getWatchlist()
      set({ items: data.watchlist || data || [] })
    } catch {
      toast.error('Failed to load watchlist')
    } finally {
      set({ loading: false })
    }
  },

  add: async (ticker) => {
    try {
      await addToWatchlist(ticker)
      toast.success(`${ticker} added to watchlist`)
      get().fetch()
    } catch (e) {
      toast.error(e.response?.data?.message || `Failed to add ${ticker}`)
    }
  },

  remove: async (ticker) => {
    try {
      await removeFromWatchlist(ticker)
      toast.success(`${ticker} removed from watchlist`)
      set((s) => ({
        items: s.items.filter(
          (i) => (i.ticker || i.symbol || i) !== ticker
        ),
      }))
    } catch (e) {
      toast.error(e.response?.data?.message || `Failed to remove ${ticker}`)
    }
  },

  isInWatchlist: (ticker) => {
    const { items } = get()
    return items.some(
      (i) => (i.ticker || i.symbol || i) === ticker
    )
  },

  refreshScores: async () => {
    set({ scoresLoading: true })
    try {
      const { data } = await getWatchlistScores()
      set({ scores: data.scores || data || {} })
      toast.success('AI scores refreshed')
    } catch {
      toast.error('Failed to refresh AI scores')
    } finally {
      set({ scoresLoading: false })
    }
  },
}))

export default useWatchlistStore
