import { apiFetch } from '@/shared/api/apiFetch'
import type { MealPlan } from '@/shared/api/types'

/** `GET /meal-plans/{weekStart}` – lädt den Wochenplan einer Woche. */
export function getMealPlanApi(weekStart: string, ownerId?: string): Promise<MealPlan> {
  const query = ownerId ? `?ownerId=${encodeURIComponent(ownerId)}` : ''

  return apiFetch<MealPlan>(`/meal-plans/${encodeURIComponent(weekStart)}${query}`)
}
