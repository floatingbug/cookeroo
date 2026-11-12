import { onScopeDispose, shallowRef } from 'vue'

import { ApiError } from '@/shared/api/apiFetch'
import type { RecipeSummary } from '@/shared/api/types'
import * as recipeService from '@/features/recipe/services/recipeService'

const SEARCH_DEBOUNCE_MS = 250

function searchErrorKey(error: unknown): string {
  if (error instanceof ApiError) {
    return error.status === 400
      ? 'mealPlan.picker.errors.invalidInput'
      : 'mealPlan.picker.errors.load'
  }

  return 'mealPlan.picker.errors.network'
}

function tagsLoadErrorKey(error: unknown): string {
  return error instanceof ApiError
    ? 'mealPlan.picker.errors.tags'
    : 'mealPlan.picker.errors.network'
}

export function useRecipeSearch() {
  const query = shallowRef('')
  const selectedTags = shallowRef<string[]>([])
  const items = shallowRef<RecipeSummary[]>([])
  const nextOffset = shallowRef<number | null>(null)
  const loading = shallowRef(false)
  const loadingMore = shallowRef(false)
  const errorKey = shallowRef<string | null>(null)
  const availableTags = shallowRef<string[]>([])
  const tagsLoading = shallowRef(false)
  const tagsErrorKey = shallowRef<string | null>(null)

  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  let controller: AbortController | null = null
  let requestId = 0
  let tagsLoaded = false

  function clearDebounce(): void {
    if (debounceTimer !== null) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
  }

  async function fetchPage(offset: number, append: boolean): Promise<void> {
    clearDebounce()
    controller?.abort()

    const currentController = new AbortController()
    const currentRequest = ++requestId
    controller = currentController

    if (append) {
      loadingMore.value = true
    } else {
      loading.value = true
      loadingMore.value = false
      items.value = []
      nextOffset.value = null
    }

    errorKey.value = null

    try {
      const response = await recipeService.searchRecipes(
        {
          query: query.value,
          tags: selectedTags.value,
          offset,
        },
        currentController.signal,
      )

      if (currentRequest !== requestId) {
        return
      }

      items.value = append ? [...items.value, ...response.items] : response.items
      nextOffset.value = response.nextOffset
    } catch (error) {
      if (currentRequest !== requestId || currentController.signal.aborted) {
        return
      }

      errorKey.value = searchErrorKey(error)
    } finally {
      if (currentRequest === requestId) {
        loading.value = false
        loadingMore.value = false
      }
    }
  }

  function searchNow(): void {
    void fetchPage(0, false)
  }

  function scheduleSearch(): void {
    clearDebounce()
    debounceTimer = setTimeout(searchNow, SEARCH_DEBOUNCE_MS)
  }

  function setQuery(value: string): void {
    query.value = value
    controller?.abort()
    scheduleSearch()
  }

  function isTagSelected(tag: string): boolean {
    return selectedTags.value.some(
      (selectedTag) => selectedTag.toLocaleLowerCase() === tag.toLocaleLowerCase(),
    )
  }

  function toggleTag(tag: string): void {
    selectedTags.value = isTagSelected(tag)
      ? selectedTags.value.filter(
          (selectedTag) => selectedTag.toLocaleLowerCase() !== tag.toLocaleLowerCase(),
        )
      : [...selectedTags.value, tag]

    searchNow()
  }

  function clearTags(): void {
    if (selectedTags.value.length === 0) {
      return
    }

    selectedTags.value = []
    searchNow()
  }

  async function loadMore(): Promise<void> {
    if (loading.value || loadingMore.value || nextOffset.value === null) {
      return
    }

    await fetchPage(nextOffset.value, true)
  }

  async function loadTags(): Promise<void> {
    if (tagsLoaded || tagsLoading.value) {
      return
    }

    tagsLoading.value = true
    tagsErrorKey.value = null

    try {
      availableTags.value = await recipeService.loadRecipeTags()
      tagsLoaded = true
    } catch (error) {
      tagsErrorKey.value = tagsLoadErrorKey(error)
    } finally {
      tagsLoading.value = false
    }
  }

  function start(): void {
    query.value = ''
    items.value = []
    nextOffset.value = null
    errorKey.value = null
    tagsErrorKey.value = null

    searchNow()
    void loadTags()
  }

  function stop(): void {
    clearDebounce()
    controller?.abort()
    loading.value = false
    loadingMore.value = false
  }

  onScopeDispose(() => {
    clearDebounce()
    controller?.abort()
  })

  return {
    query,
    selectedTags,
    items,
    nextOffset,
    loading,
    loadingMore,
    errorKey,
    availableTags,
    tagsLoading,
    tagsErrorKey,
    setQuery,
    isTagSelected,
    toggleTag,
    clearTags,
    loadMore,
    start,
    stop,
  }
}
