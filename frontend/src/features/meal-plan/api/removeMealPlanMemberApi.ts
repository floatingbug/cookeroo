import { apiFetch } from '@/shared/api/apiFetch'

/** `DELETE /meal-plans/members/{memberId}` – entfernt ein Mitglied. */
export async function removeMealPlanMemberApi(memberId: string): Promise<void> {
  await apiFetch<null>(`/meal-plans/members/${encodeURIComponent(memberId)}`, {
    method: 'DELETE',
  })
}
