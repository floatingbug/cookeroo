import { apiFetch } from '@/shared/api/apiFetch'
import type { MealPlanMember, MealPlanMemberUpdateRequest } from '@/shared/api/types'

/** `PATCH /meal-plans/members/{memberId}` – ändert das Bearbeitungsrecht. */
export function updateMealPlanMemberApi(
  memberId: string,
  payload: MealPlanMemberUpdateRequest,
): Promise<MealPlanMember> {
  return apiFetch<MealPlanMember>(`/meal-plans/members/${encodeURIComponent(memberId)}`, {
    method: 'PATCH',
    body: payload,
  })
}
