import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../api/searchProductsApi', () => ({
  searchProductsApi: vi.fn(),
}))

import { ApiError } from '@/shared/api/apiFetch'
import { searchProductsApi } from '../api/searchProductsApi'
import { getProductErrorKey, searchProducts, validateSearchTerm } from './productService'

const mockedSearchProductsApi = vi.mocked(searchProductsApi)

describe('productService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('validateSearchTerm', () => {
    it('lehnt leere und zu kurze Suchbegriffe ab', () => {
      expect(validateSearchTerm('')).toBe('product.errors.queryTooShort')
      expect(validateSearchTerm('   ')).toBe('product.errors.queryTooShort')
      expect(validateSearchTerm('a')).toBe('product.errors.queryTooShort')
    })

    it('akzeptiert Suchbegriffe ab zwei Zeichen', () => {
      expect(validateSearchTerm('ab')).toBeNull()
      expect(validateSearchTerm('  Nutella  ')).toBeNull()
    })
  })

  describe('searchProducts', () => {
    it('gibt den getrimmten Suchbegriff und die Paging-Parameter weiter', async () => {
      const response = { products: [], count: 0, page: 2, pageSize: 5 }

      mockedSearchProductsApi.mockResolvedValue(response)

      await expect(
        searchProducts({ searchTerm: '  Nutella ', page: 2, pageSize: 5 }),
      ).resolves.toBe(response)

      expect(mockedSearchProductsApi).toHaveBeenCalledWith({ q: 'Nutella', page: 2, pageSize: 5 })
    })
  })

  describe('getProductErrorKey', () => {
    it('meldet 429 als Rate-Limit', () => {
      expect(getProductErrorKey(new ApiError('x', 429, null))).toBe('product.errors.rateLimit')
    })

    it('meldet 502 als Nicht verfügbar', () => {
      expect(getProductErrorKey(new ApiError('x', 502, null))).toBe('product.errors.unavailable')
    })

    it('meldet übrige Status als generischen Fehler', () => {
      expect(getProductErrorKey(new ApiError('x', 500, null))).toBe('product.errors.generic')
    })

    it('meldet Fehler ohne Status als Netzwerkfehler', () => {
      expect(getProductErrorKey(new TypeError('fetch failed'))).toBe('product.errors.network')
    })
  })
})
