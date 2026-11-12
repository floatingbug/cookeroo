import { apiFetch } from '@/shared/api/apiFetch'
import type { RecipeSearchResponse } from '@/shared/api/types'

export interface SearchRecipesParams {
  query?: string
  tags?: string[]
  offset?: number
}

/** `GET /recipes/search` – sucht Rezepte serverseitig und liefert maximal 10 Treffer. */
export function searchRecipesApi(
  { query = '', tags = [], offset = 0 }: SearchRecipesParams,
  signal?: AbortSignal,
): Promise<RecipeSearchResponse> {
  const params = new URLSearchParams()
  const normalizedQuery = query.trim()

  if (normalizedQuery !== '') {
    params.set('q', normalizedQuery)
  }

  for (const tag of tags) {
    params.append('tags', tag)
  }

  if (offset > 0) {
    params.set('offset', String(offset))
  }

  const queryString = params.toString()

  return apiFetch<RecipeSearchResponse>(
    `/recipes/search${queryString === '' ? '' : `?${queryString}`}`,
    { signal },
  )
}
