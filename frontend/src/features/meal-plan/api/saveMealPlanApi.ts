import { apiFetch } from '@/shared/api/apiFetch'
import type { MealPlan, MealPlanSaveRequest } from '@/shared/api/types'

/** `PUT /meal-plans/{weekStart}` – ersetzt den Wochenplan einer Woche. */
export function saveMealPlanApi(
  weekStart: string,
  payload: MealPlanSaveRequest,
  ownerId?: string,
): Promise<MealPlan> {
  const query = ownerId ? `?ownerId=${encodeURIComponent(ownerId)}` : ''

  return apiFetch<MealPlan>(`/meal-plans/${encodeURIComponent(weekStart)}${query}`, {
    method: 'PUT',
    body: payload,
  })
}
