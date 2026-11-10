import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('../services/productService', async () => {
  const actual = await vi.importActual<typeof import('../services/productService')>(
    '../services/productService',
  )

  return { ...actual, searchProducts: vi.fn() }
})

import * as productService from '../services/productService'
import type { ProductSearchResponse } from '@/shared/api/types'
import { useProductStore } from './productStore'

const mockedSearchProducts = vi.mocked(productService.searchProducts)

describe('productStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('lehnt zu kurze Suchbegriffe ohne API-Aufruf ab', async () => {
    const store = useProductStore()

    store.query = 'a'

    await expect(store.search()).resolves.toBe(false)
    expect(store.errorKey).toBe('product.errors.queryTooShort')
    expect(store.searched).toBe(false)
    expect(mockedSearchProducts).not.toHaveBeenCalled()
  })

  it('übernimmt Suchergebnisse in den State', async () => {
    mockedSearchProducts.mockResolvedValue({
      products: [{ code: '3017620422003', productName: 'Nutella' }],
      count: 25,
      page: 2,
      pageSize: 12,
    })

    const store = useProductStore()

    store.query = 'Nutella'

    await expect(store.search(2)).resolves.toBe(true)

    expect(mockedSearchProducts).toHaveBeenCalledWith({
      searchTerm: 'Nutella',
      page: 2,
      pageSize: 12,
    })
    expect(store.products).toHaveLength(1)
    expect(store.count).toBe(25)
    expect(store.page).toBe(2)
    expect(store.searched).toBe(true)
    expect(store.errorKey).toBeNull()
    expect(store.loading).toBe(false)
    expect(store.hasResults).toBe(true)
    expect(store.totalPages).toBe(3)
  })

  it('setzt den Loading-State während der Suche', async () => {
    let resolveSearch: (value: ProductSearchResponse) => void = () => {}

    mockedSearchProducts.mockReturnValue(
      new Promise((resolve) => {
        resolveSearch = resolve
      }),
    )

    const store = useProductStore()

    store.query = 'Nutella'

    const pending = store.search()

    expect(store.loading).toBe(true)

    resolveSearch({ products: [], count: 0, page: 1, pageSize: 12 })
    await pending

    expect(store.loading).toBe(false)
  })

  it('übersetzt Fehler in i18n-Keys', async () => {
    mockedSearchProducts.mockRejectedValue(new TypeError('fetch failed'))

    const store = useProductStore()

    store.query = 'Nutella'

    await expect(store.search()).resolves.toBe(false)
    expect(store.errorKey).toBe('product.errors.network')
    expect(store.searched).toBe(false)
    expect(store.loading).toBe(false)
  })
})
