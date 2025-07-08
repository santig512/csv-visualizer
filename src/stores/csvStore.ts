import { defineStore } from 'pinia'
import type { CSVState, CSVData } from '@/types/csv'

export const useCSVStore = defineStore('csv', {
  state: (): CSVState => ({
    data: null,
    isLoading: false,
    error: null,
    fileName: null
  }),

  getters: {
    hasData: (state) => state.data !== null,
    rowCount: (state) => state.data?.rows.length || 0,
    columnCount: (state) => state.data?.headers.length || 0
  },

  actions: {
    setLoading(loading: boolean) {
      this.isLoading = loading
    },

    setError(error: string | null) {
      this.error = error
    },

    setData(data: CSVData, fileName: string) {
      this.data = data
      this.fileName = fileName
      this.error = null
    },

    clearData() {
      this.data = null
      this.fileName = null
      this.error = null
      this.isLoading = false
    }
  }
})