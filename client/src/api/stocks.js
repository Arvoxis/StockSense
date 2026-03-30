import api from './axios'

export const searchStocks = (q) =>
  api.get('/stocks/search', { params: { q } })

export const getQuote = (ticker) =>
  api.get(`/stocks/${ticker}/quote`)

export const getChart = (ticker, range = '1M') =>
  api.get(`/stocks/${ticker}/chart`, { params: { range } })

export const getStats = (ticker) =>
  api.get(`/stocks/${ticker}/stats`)

export const getIndicators = (ticker) =>
  api.get(`/stocks/${ticker}/indicators`)
