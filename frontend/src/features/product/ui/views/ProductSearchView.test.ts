import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { createPinia } from 'pinia'

vi.mock('../../services/productService', async () => {
  const actual = await vi.importActual<typeof import('../../services/productService')>(
    '../../services/productService',
  )

  return { ...actual, searchProducts: vi.fn() }
})

import * as productService from '../../services/productService'
import i18n from '@/app/i18n'
import ProductSearchView from './ProductSearchView.vue'

const mockedSearchProducts = vi.mocked(productService.searchProducts)

function mountView(): VueWrapper {
  return mount(ProductSearchView, {
    global: { plugins: [createPinia(), i18n] },
  })
}

async function submitSearch(wrapper: VueWrapper, term: string) {
  await wrapper.find('#product-search-query').setValue(term)
  await wrapper.find('form').trigger('submit')
  await flushPromises()
}

describe('ProductSearchView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('zeigt einen Validierungsfehler bei zu kurzem Suchbegriff', async () => {
    const wrapper = mountView()

    await submitSearch(wrapper, 'a')

    expect(mockedSearchProducts).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain(i18n.global.t('product.errors.queryTooShort'))
  })

  it('stellt gefundene Produkte mit Marke, Barcode und Nutri-Score dar', async () => {
    mockedSearchProducts.mockResolvedValue({
      products: [
        {
          code: '3017620422003',
          productName: 'Nutella',
          brands: 'Ferrero',
          nutriscoreGrade: 'e',
        },
      ],
      count: 1,
      page: 1,
      pageSize: 12,
    })

    const wrapper = mountView()

    await submitSearch(wrapper, 'Nutella')

    expect(mockedSearchProducts).toHaveBeenCalledWith({
      searchTerm: 'Nutella',
      page: 1,
      pageSize: 12,
    })
    expect(wrapper.text()).toContain('Nutella')
    expect(wrapper.text()).toContain('Ferrero')
    expect(wrapper.text()).toContain(i18n.global.t('product.codeLabel', { code: '3017620422003' }))
    expect(wrapper.text()).toContain('Nutri-Score: E')
    expect(wrapper.text()).toContain(i18n.global.t('product.resultCount', 1))
  })

  it('zeigt den Empty-State ohne Ergebnisse', async () => {
    mockedSearchProducts.mockResolvedValue({ products: [], count: 0, page: 1, pageSize: 12 })

    const wrapper = mountView()

    await submitSearch(wrapper, 'Zzz')

    expect(wrapper.text()).toContain(i18n.global.t('product.emptyText'))
  })

  it('zeigt API-Fehler als Meldung', async () => {
    mockedSearchProducts.mockRejectedValue({ status: 502 })

    const wrapper = mountView()

    await submitSearch(wrapper, 'Nutella')

    expect(wrapper.text()).toContain(i18n.global.t('product.errors.unavailable'))
  })

  it('blättert zur nächsten Seite', async () => {
    mockedSearchProducts.mockResolvedValue({
      products: [{ code: '1', productName: 'Treffer' }],
      count: 25,
      page: 1,
      pageSize: 12,
    })

    const wrapper = mountView()

    await submitSearch(wrapper, 'Treffer')

    expect(wrapper.text()).toContain(
      i18n.global.t('product.pagination.pageInfo', { page: 1, total: 3 }),
    )

    const nextButton = wrapper
      .findAll('button')
      .find((button) => button.text() === i18n.global.t('product.pagination.next'))

    expect(nextButton).toBeDefined()
    expect(nextButton!.attributes('disabled')).toBeUndefined()

    mockedSearchProducts.mockResolvedValue({
      products: [{ code: '2', productName: 'Treffer 2' }],
      count: 25,
      page: 2,
      pageSize: 12,
    })

    await nextButton!.trigger('click')
    await flushPromises()

    expect(mockedSearchProducts).toHaveBeenLastCalledWith({
      searchTerm: 'Treffer',
      page: 2,
      pageSize: 12,
    })
    expect(wrapper.text()).toContain(
      i18n.global.t('product.pagination.pageInfo', { page: 2, total: 3 }),
    )
  })
})
