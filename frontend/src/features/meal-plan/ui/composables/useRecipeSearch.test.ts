import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'
import { flushPromises } from '@vue/test-utils'

vi.mock('@/features/recipe/services/recipeService', () => ({
  loadRecipeTags: vi.fn(),
  searchRecipes: vi.fn(),
}))

import type { RecipeSummary } from '@/shared/api/types'
import * as recipeService from '@/features/recipe/services/recipeService'
import { useRecipeSearch } from './useRecipeSearch'

const mockedSearchRecipes = vi.mocked(recipeService.searchRecipes)
const mockedLoadRecipeTags = vi.mocked(recipeService.loadRecipeTags)

const RECIPE: RecipeSummary = {
  id: '0123456789abcdef01234567',
  title: 'Lasagne',
  imageUrl: null,
  category: null,
  cuisine: null,
  difficulty: 'easy',
  prepTime: 10,
  cookTime: 20,
  restTime: null,
  tags: ['Vegetarisch'],
  status: 'public',
}

const SECOND_RECIPE: RecipeSummary = {
  ...RECIPE,
  id: 'fedcba9876543210fedcba98',
  title: 'Tomatensuppe',
}

function useSearch() {
  const scope = effectScope()
  const search = scope.run(() => useRecipeSearch())

  if (!search) {
    throw new Error('Composable could not be created')
  }

  return { search, scope }
}

describe('useRecipeSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('startet die erste Suche und lädt die Tags', async () => {
    const { search, scope } = useSearch()

    mockedSearchRecipes.mockResolvedValue({ items: [RECIPE], nextOffset: 10 })
    mockedLoadRecipeTags.mockResolvedValue(['Vegetarisch', 'Schnell'])

    search.start()
    await flushPromises()

    expect(mockedSearchRecipes).toHaveBeenCalledWith(
      { query: '', tags: [], offset: 0 },
      expect.any(AbortSignal),
    )
    expect(search.items.value).toEqual([RECIPE])
    expect(search.nextOffset.value).toBe(10)
    expect(search.availableTags.value).toEqual(['Vegetarisch', 'Schnell'])
    expect(search.loading.value).toBe(false)
    expect(search.tagsLoading.value).toBe(false)

    scope.stop()
  })

  it('debounced die Suche nach Eingaben', async () => {
    const { search, scope } = useSearch()

    mockedSearchRecipes.mockResolvedValue({ items: [RECIPE], nextOffset: null })
    mockedLoadRecipeTags.mockResolvedValue([])

    search.setQuery('las')

    vi.advanceTimersByTime(249)
    expect(mockedSearchRecipes).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    await flushPromises()

    expect(mockedSearchRecipes).toHaveBeenCalledWith(
      { query: 'las', tags: [], offset: 0 },
      expect.any(AbortSignal),
    )

    scope.stop()
  })

  it('kombiniert Tags sofort per UND-Verknüpfung', async () => {
    const { search, scope } = useSearch()

    mockedSearchRecipes.mockResolvedValue({ items: [RECIPE], nextOffset: null })
    mockedLoadRecipeTags.mockResolvedValue(['Vegetarisch', 'Schnell'])

    search.start()
    await flushPromises()

    search.toggleTag('Vegetarisch')
    await flushPromises()

    expect(search.selectedTags.value).toEqual(['Vegetarisch'])
    expect(mockedSearchRecipes).toHaveBeenLastCalledWith(
      { query: '', tags: ['Vegetarisch'], offset: 0 },
      expect.any(AbortSignal),
    )

    search.toggleTag('Schnell')
    await flushPromises()

    expect(search.selectedTags.value).toEqual(['Vegetarisch', 'Schnell'])

    search.toggleTag('Vegetarisch')
    await flushPromises()

    expect(search.selectedTags.value).toEqual(['Schnell'])

    scope.stop()
  })

  it('lädt beim Nachladen die nächste Seite und hängt sie an', async () => {
    const { search, scope } = useSearch()

    mockedSearchRecipes
      .mockResolvedValueOnce({ items: [RECIPE], nextOffset: 10 })
      .mockResolvedValueOnce({ items: [SECOND_RECIPE], nextOffset: null })
    mockedLoadRecipeTags.mockResolvedValue([])

    search.start()
    await flushPromises()

    await search.loadMore()

    expect(mockedSearchRecipes).toHaveBeenLastCalledWith(
      { query: '', tags: [], offset: 10 },
      expect.any(AbortSignal),
    )
    expect(search.items.value).toEqual([RECIPE, SECOND_RECIPE])
    expect(search.nextOffset.value).toBeNull()

    scope.stop()
  })

  it('meldet Fehler beim Laden der Tags', async () => {
    const { search, scope } = useSearch()

    mockedSearchRecipes.mockResolvedValue({ items: [], nextOffset: null })
    mockedLoadRecipeTags.mockRejectedValue(new TypeError('offline'))

    search.start()
    await flushPromises()

    expect(search.tagsErrorKey.value).toBe('mealPlan.picker.errors.network')

    scope.stop()
  })
})
