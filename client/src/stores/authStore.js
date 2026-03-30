import { create } from 'zustand'
import { getMe } from '../api/auth'

const getStoredToken = () => localStorage.getItem('ss_token')
const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('ss_user') || 'null')
  } catch {
    return null
  }
}

const useAuthStore = create((set, get) => ({
  token: getStoredToken(),
  user: getStoredUser(),

  setAuth: (token, user) => {
    localStorage.setItem('ss_token', token)
    localStorage.setItem('ss_user', JSON.stringify(user))
    set({ token, user })
  },

  setUser: (user) => {
    localStorage.setItem('ss_user', JSON.stringify(user))
    set({ user })
  },

  logout: () => {
    localStorage.removeItem('ss_token')
    localStorage.removeItem('ss_user')
    set({ token: null, user: null })
  },

  fetchMe: async () => {
    try {
      const { data } = await getMe()
      get().setUser(data.user || data)
    } catch {
      // token invalid — logout handled by interceptor
    }
  },
}))

export default useAuthStore
