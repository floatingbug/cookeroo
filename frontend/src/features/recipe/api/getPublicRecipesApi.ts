import { apiFetch } from '@/shared/api/apiFetch'
import type { Recipe } from '@/shared/api/types'

/** `GET /recipes/public` – lädt alle öffentlichen Rezepte. */
export function getPublicRecipesApi(): Promise<Recipe[]> {
  return apiFetch<Recipe[]>('/recipes/public')
}
