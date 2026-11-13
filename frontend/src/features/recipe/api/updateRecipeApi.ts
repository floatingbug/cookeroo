import { apiFetch } from '@/shared/api/apiFetch'
import type { Recipe, RecipeUpdateRequest } from '@/shared/api/types'

/** `PUT /recipes/{recipeId}` – ersetzt die bearbeitbaren Felder eines eigenen Rezepts. */
export function updateRecipeApi(recipeId: string, payload: RecipeUpdateRequest): Promise<Recipe> {
  return apiFetch<Recipe>(`/recipes/${recipeId}`, { method: 'PUT', body: payload })
}
