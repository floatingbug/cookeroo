import { apiFetch } from '@/shared/api/apiFetch'
import type { MealPlanInvitePreview } from '@/shared/api/types'

/** `GET /meal-plans/invites/{token}` – zeigt eine Einladung an, ohne sie zu verbrauchen. */
export function previewMealPlanInviteApi(token: string): Promise<MealPlanInvitePreview> {
  return apiFetch<MealPlanInvitePreview>(`/meal-plans/invites/${encodeURIComponent(token)}`, {
    auth: false,
  })
}
