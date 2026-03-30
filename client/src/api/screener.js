import api from './axios'

export const runScreener = (params) =>
  api.get('/screener', { params })
