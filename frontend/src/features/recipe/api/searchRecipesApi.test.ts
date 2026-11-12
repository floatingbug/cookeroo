import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/api/apiFetch', () => ({ apiFetch: vi.fn() }))

import { apiFetch } from '@/shared/api/apiFetch'
import { searchRecipesApi } from './searchRecipesApi'

const mockedApiFetch = vi.mocked(apiFetch)

describe('searchRecipesApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('baut Suchbegriff, Tags und Offset in die Query ein', async () => {
    mockedApiFetch.mockResolvedValue({ items: [], nextOffset: null })

    const signal = new AbortController().signal

    await searchRecipesApi({ query: ' Lasagne ', tags: ['Vegan', 'Schnell'], offset: 10 }, signal)

    expect(mockedApiFetch).toHaveBeenCalledWith(
      '/recipes/search?q=Lasagne&tags=Vegan&tags=Schnell&offset=10',
      { signal },
    )
  })

  it('lässt leere Parameter weg', async () => {
    mockedApiFetch.mockResolvedValue({ items: [], nextOffset: null })

    await searchRecipesApi({})

    expect(mockedApiFetch).toHaveBeenCalledWith('/recipes/search', { signal: undefined })
  })
})
