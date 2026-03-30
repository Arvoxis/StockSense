import api from './axios'

export const analyzeStock = (payload) =>
  api.post('/ai/analyze', payload)

export const whyMoving = (ticker) =>
  api.get(`/ai/whymoving/${ticker}`)

export const getScreenerPicks = (results) =>
  api.get('/ai/screener-picks', { params: { results: JSON.stringify(results) } })
