import { defineStore } from 'pinia'

import type { Product } from '@/shared/api/types'
import * as productService from '../services/productService'

interface ProductState {
  query: string
  products: Product[]
  count: number
  page: number
  pageSize: number
  loading: boolean
  searched: boolean
  errorKey: string | null
}

export const useProductStore = defineStore('product', {
  state: (): ProductState => ({
    query: '',
    products: [],
    count: 0,
    page: 1,
    pageSize: 12,
    loading: false,
    searched: false,
    errorKey: null,
  }),

  getters: {
    totalPages: (state): number => Math.max(1, Math.ceil(state.count / state.pageSize)),
    hasResults: (state): boolean => state.products.length > 0,
  },

  actions: {
    /**
     * Startet die Produktsuche. `page` ist die 1-basierte Seitenzahl;
     * eine neue Suche beginnt standardmäßig wieder auf Seite 1.
     */
    async search(page = 1): Promise<boolean> {
      const validationErrorKey = productService.validateSearchTerm(this.query)

      if (validationErrorKey) {
        this.errorKey = validationErrorKey
        return false
      }

      this.loading = true
      this.errorKey = null

      try {
        const result = await productService.searchProducts({
          searchTerm: this.query,
          page,
          pageSize: this.pageSize,
        })

        this.products = result.products
        this.count = result.count
        this.page = result.page
        this.searched = true

        return true
      } catch (error) {
        this.errorKey = productService.getProductErrorKey(error)
        return false
      } finally {
        this.loading = false
      }
    },
  },
})
