import { create } from 'zustand'
import toast from 'react-hot-toast'
import { getNews } from '../api/news'

const useNewsStore = create((set, get) => ({
  articles: [],
  loading: false,
  page: 1,
  hasMore: true,
  filters: {
    ticker: '',
    sentiment: 'all',
    keyword: '',
  },

  setFilter: (key, value) => {
    set((s) => ({ filters: { ...s.filters, [key]: value }, articles: [], page: 1, hasMore: true }))
  },

  fetch: async (append = false) => {
    const { filters, page } = get()
    set({ loading: true })
    try {
      const params = {
        page: append ? page : 1,
        limit: 20,
      }
      if (filters.ticker) params.ticker = filters.ticker
      if (filters.sentiment !== 'all') params.sentiment = filters.sentiment
      if (filters.keyword) params.keyword = filters.keyword

      const { data } = await getNews(params)
      const articles = data.articles || data || []

      if (append) {
        set((s) => ({
          articles: [...s.articles, ...articles],
          page: s.page + 1,
          hasMore: articles.length === 20,
        }))
      } else {
        set({ articles, page: 2, hasMore: articles.length === 20 })
      }
    } catch {
      toast.error('Failed to load news')
    } finally {
      set({ loading: false })
    }
  },

  loadMore: () => {
    const { hasMore, loading } = get()
    if (hasMore && !loading) get().fetch(true)
  },
}))

export default useNewsStore
