import { apiFetch } from '@/shared/api/apiFetch'
import type { Recipe } from '@/shared/api/types'

/** `GET /recipes/{recipeId}` – lädt ein Rezept, sofern es sichtbar ist. */
export function getRecipeApi(recipeId: string): Promise<Recipe> {
  return apiFetch<Recipe>(`/recipes/${recipeId}`)
}
