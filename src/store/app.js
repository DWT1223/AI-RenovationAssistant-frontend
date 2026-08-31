/**
 * Pinia Store - 全局状态
 */
import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    loading: false,
    theme: 'light'
  }),

  actions: {
    setLoading(loading) {
      this.loading = loading
    },

    setTheme(theme) {
      this.theme = theme
    }
  }
})
