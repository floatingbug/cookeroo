import { apiFetch } from '@/shared/api/apiFetch'
import type { MealPlanInvite } from '@/shared/api/types'

/** `POST /meal-plans/invites` – erzeugt einen Einmal-Einladungslink. */
export function createMealPlanInviteApi(): Promise<MealPlanInvite> {
  return apiFetch<MealPlanInvite>('/meal-plans/invites', { method: 'POST' })
}
