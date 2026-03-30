import api from './axios'

export const login = (email, password) =>
  api.post('/auth/login', { email, password })

export const signup = (name, email, password) =>
  api.post('/auth/signup', { displayName: name, email, password })

export const getMe = () => api.get('/auth/me')
