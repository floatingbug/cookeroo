import { apiFetch } from '@/shared/api/apiFetch'

/** `GET /recipes/tags` – lädt die verfügbaren Rezept-Tags für Filter. */
export function getRecipeTagsApi(): Promise<string[]> {
  return apiFetch<string[]>('/recipes/tags')
}
