import { apiFetch } from '@/shared/api/apiFetch'
import type { Recipe } from '@/shared/api/types'

/** `GET /recipes` – lädt alle Rezepte des angemeldeten Benutzers. */
export function getRecipesApi(): Promise<Recipe[]> {
  return apiFetch<Recipe[]>('/recipes')
}
