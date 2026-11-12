import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { MealPlanInvite, MealPlanMember, SharedMealPlan } from '@/shared/api/types'
import { acceptMealPlanInviteApi } from '../api/acceptMealPlanInviteApi'
import { createMealPlanInviteApi } from '../api/createMealPlanInviteApi'
import { getMealPlanMembersApi } from '../api/getMealPlanMembersApi'
import { getSharedMealPlansApi } from '../api/getSharedMealPlansApi'
import { previewMealPlanInviteApi } from '../api/previewMealPlanInviteApi'
import { removeMealPlanMemberApi } from '../api/removeMealPlanMemberApi'
import { updateMealPlanMemberApi } from '../api/updateMealPlanMemberApi'
import {
  acceptInvite,
  createInvite,
  getInviteErrorKey,
  getSharedMealPlanErrorKey,
  loadMembers,
  loadSharedMealPlans,
  previewInvite,
  removeMember,
  updateMemberPermission,
} from './mealPlanSharingService'

vi.mock('../api/acceptMealPlanInviteApi', () => ({ acceptMealPlanInviteApi: vi.fn() }))
vi.mock('../api/createMealPlanInviteApi', () => ({ createMealPlanInviteApi: vi.fn() }))
vi.mock('../api/getMealPlanMembersApi', () => ({ getMealPlanMembersApi: vi.fn() }))
vi.mock('../api/getSharedMealPlansApi', () => ({ getSharedMealPlansApi: vi.fn() }))
vi.mock('../api/previewMealPlanInviteApi', () => ({ previewMealPlanInviteApi: vi.fn() }))
vi.mock('../api/removeMealPlanMemberApi', () => ({ removeMealPlanMemberApi: vi.fn() }))
vi.mock('../api/updateMealPlanMemberApi', () => ({ updateMealPlanMemberApi: vi.fn() }))

const mockedAcceptApi = vi.mocked(acceptMealPlanInviteApi)
const mockedCreateApi = vi.mocked(createMealPlanInviteApi)
const mockedMembersApi = vi.mocked(getMealPlanMembersApi)
const mockedSharedApi = vi.mocked(getSharedMealPlansApi)
const mockedPreviewApi = vi.mocked(previewMealPlanInviteApi)
const mockedRemoveApi = vi.mocked(removeMealPlanMemberApi)
const mockedUpdateApi = vi.mocked(updateMealPlanMemberApi)

const SHARED: SharedMealPlan = {
  owner: { id: 'aaaaaaaaaaaaaaaaaaaaaaaa', name: 'Besitzer' },
  canEdit: false,
}

const MEMBER: MealPlanMember = {
  user: { id: 'bbbbbbbbbbbbbbbbbbbbbbbb', name: 'Mitglied' },
  canEdit: false,
  joinedAt: '2026-11-12T10:00:00.000Z',
}

const INVITE: MealPlanInvite = {
  token: 'a'.repeat(64),
  url: `http://localhost:5173/meal-plan/join/${'a'.repeat(64)}`,
}

describe('mealPlanSharingService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('lädt freigegebene Pläne und Mitglieder ohne Wrapper', async () => {
    mockedSharedApi.mockResolvedValue({ planners: [SHARED] })
    mockedMembersApi.mockResolvedValue({ members: [MEMBER] })

    await expect(loadSharedMealPlans()).resolves.toEqual([SHARED])
    await expect(loadMembers()).resolves.toEqual([MEMBER])
  })

  it('erstellt, zeigt und nimmt Einladungen an', async () => {
    mockedCreateApi.mockResolvedValue(INVITE)
    mockedPreviewApi.mockResolvedValue({ owner: SHARED.owner })
    mockedAcceptApi.mockResolvedValue(SHARED)

    await expect(createInvite()).resolves.toBe(INVITE)
    await expect(previewInvite(INVITE.token)).resolves.toEqual({ owner: SHARED.owner })
    await expect(acceptInvite(INVITE.token)).resolves.toBe(SHARED)

    expect(mockedPreviewApi).toHaveBeenCalledWith(INVITE.token)
    expect(mockedAcceptApi).toHaveBeenCalledWith(INVITE.token)
  })

  it('ändert Rechte und entfernt Mitglieder', async () => {
    const updated = { ...MEMBER, canEdit: true }

    mockedUpdateApi.mockResolvedValue(updated)
    mockedRemoveApi.mockResolvedValue()

    await expect(updateMemberPermission(MEMBER.user.id, true)).resolves.toBe(updated)
    await expect(removeMember(MEMBER.user.id)).resolves.toBeUndefined()

    expect(mockedUpdateApi).toHaveBeenCalledWith(MEMBER.user.id, { canEdit: true })
    expect(mockedRemoveApi).toHaveBeenCalledWith(MEMBER.user.id)
  })

  it('übersetzt Freigabe- und Einladungsfehler', () => {
    expect(getSharedMealPlanErrorKey({}, 'fallback')).toBe('mealPlan.errors.network')
    expect(getSharedMealPlanErrorKey({ status: 404 }, 'fallback')).toBe('mealPlan.errors.notFound')
    expect(getSharedMealPlanErrorKey({ status: 500 }, 'fallback')).toBe('fallback')

    expect(getInviteErrorKey({})).toBe('mealPlan.join.errors.network')
    expect(getInviteErrorKey({ status: 400 })).toBe('mealPlan.join.errors.ownPlanner')
    expect(getInviteErrorKey({ status: 404 })).toBe('mealPlan.join.errors.invalid')
    expect(getInviteErrorKey({ status: 500 })).toBe('mealPlan.join.errors.generic')
  })
})
