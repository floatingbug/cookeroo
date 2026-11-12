import { apiFetch } from '@/shared/api/apiFetch'
import type { MealPlanMemberList } from '@/shared/api/types'

/** `GET /meal-plans/members` – lädt die Mitglieder des eigenen Wochenplaners. */
export function getMealPlanMembersApi(): Promise<MealPlanMemberList> {
  return apiFetch<MealPlanMemberList>('/meal-plans/members')
}
