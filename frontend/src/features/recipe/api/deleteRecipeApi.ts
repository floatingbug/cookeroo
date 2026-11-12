import { apiFetch } from '@/shared/api/apiFetch'

/** `DELETE /recipes/{recipeId}` – löscht ein eigenes Rezept samt zugehörigen Bildern. */
export function deleteRecipeApi(recipeId: string): Promise<void> {
  return apiFetch<void>(`/recipes/${recipeId}`, { method: 'DELETE' })
}
