import { apiFetch } from '@/shared/api/apiFetch'
import type { SharedMealPlan } from '@/shared/api/types'

/** `POST /meal-plans/invites/{token}/accept` – nimmt eine Einladung an. */
export function acceptMealPlanInviteApi(token: string): Promise<SharedMealPlan> {
  return apiFetch<SharedMealPlan>(`/meal-plans/invites/${encodeURIComponent(token)}/accept`, {
    method: 'POST',
  })
}
