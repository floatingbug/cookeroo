import { apiFetch } from '@/shared/api/apiFetch'
import type { SharedMealPlanList } from '@/shared/api/types'

/** `GET /meal-plans/shared` – lädt die für mich freigegebenen Wochenpläne. */
export function getSharedMealPlansApi(): Promise<SharedMealPlanList> {
  return apiFetch<SharedMealPlanList>('/meal-plans/shared')
}
