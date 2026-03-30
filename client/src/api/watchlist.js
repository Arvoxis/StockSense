import api from './axios'

export const getWatchlist = () => api.get('/watchlist')

export const addToWatchlist = (ticker) =>
  api.post(`/watchlist/${ticker}`)

export const removeFromWatchlist = (ticker) =>
  api.delete(`/watchlist/${ticker}`)

export const getWatchlistScores = () =>
  api.get('/ai/watchlist-scores')
