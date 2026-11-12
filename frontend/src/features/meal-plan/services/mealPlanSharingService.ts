import type {
  MealPlanInvite,
  MealPlanInvitePreview,
  MealPlanMember,
  SharedMealPlan,
} from '@/shared/api/types'
import { acceptMealPlanInviteApi } from '../api/acceptMealPlanInviteApi'
import { createMealPlanInviteApi } from '../api/createMealPlanInviteApi'
import { getMealPlanMembersApi } from '../api/getMealPlanMembersApi'
import { getSharedMealPlansApi } from '../api/getSharedMealPlansApi'
import { previewMealPlanInviteApi } from '../api/previewMealPlanInviteApi'
import { removeMealPlanMemberApi } from '../api/removeMealPlanMemberApi'
import { updateMealPlanMemberApi } from '../api/updateMealPlanMemberApi'

interface ErrorWithStatus {
  status?: number
}

function statusOf(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    return (error as ErrorWithStatus).status
  }

  return undefined
}

export function loadSharedMealPlans(): Promise<SharedMealPlan[]> {
  return getSharedMealPlansApi().then((response) => response.planners)
}

export function createInvite(): Promise<MealPlanInvite> {
  return createMealPlanInviteApi()
}

export function previewInvite(token: string): Promise<MealPlanInvitePreview> {
  return previewMealPlanInviteApi(token)
}

export function acceptInvite(token: string): Promise<SharedMealPlan> {
  return acceptMealPlanInviteApi(token)
}

export function loadMembers(): Promise<MealPlanMember[]> {
  return getMealPlanMembersApi().then((response) => response.members)
}

export function updateMemberPermission(
  memberId: string,
  canEdit: boolean,
): Promise<MealPlanMember> {
  return updateMealPlanMemberApi(memberId, { canEdit })
}

export function removeMember(memberId: string): Promise<void> {
  return removeMealPlanMemberApi(memberId)
}

export function getSharedMealPlanErrorKey(error: unknown, fallback: string): string {
  const status = statusOf(error)

  if (!status) {
    return 'mealPlan.errors.network'
  }

  if (status === 400) {
    return 'mealPlan.errors.invalidInput'
  }

  if (status === 403) {
    return 'mealPlan.errors.forbidden'
  }

  if (status === 404) {
    return 'mealPlan.errors.notFound'
  }

  return fallback
}

export function getInviteErrorKey(error: unknown): string {
  const status = statusOf(error)

  if (!status) {
    return 'mealPlan.join.errors.network'
  }

  if (status === 400) {
    return 'mealPlan.join.errors.ownPlanner'
  }

  if (status === 404) {
    return 'mealPlan.join.errors.invalid'
  }

  return 'mealPlan.join.errors.generic'
}
