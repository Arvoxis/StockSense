import api from './axios'

export const getNews = (params) =>
  api.get('/news', { params })

export const analyzeSentiment = (headlines) =>
  api.post('/ai/sentiment', { headlines })
