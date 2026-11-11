import { apiFetch } from '@/shared/api/apiFetch'
import type { Recipe, RecipeCreateRequest } from '@/shared/api/types'

/** `POST /recipes` – legt ein Rezept an und liefert das gespeicherte Rezept. */
export function createRecipeApi(payload: RecipeCreateRequest): Promise<Recipe> {
  return apiFetch<Recipe>('/recipes', { method: 'POST', body: payload })
}
