import api from './axios'

export const getMarketIndices = () => api.get('/market/indices')
