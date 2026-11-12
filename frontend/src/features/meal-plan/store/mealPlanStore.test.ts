import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('../services/mealPlanService', async () => {
  const actual = await vi.importActual<typeof import('../services/mealPlanService')>(
    '../services/mealPlanService',
  )

  return {
    ...actual,
    loadMealPlan: vi.fn(),
    saveMealPlan: vi.fn(),
  }
})

vi.mock('../services/mealPlanSharingService', async () => {
  const actual = await vi.importActual<typeof import('../services/mealPlanSharingService')>(
    '../services/mealPlanSharingService',
  )

  return {
    ...actual,
    loadSharedMealPlans: vi.fn(),
    createInvite: vi.fn(),
    previewInvite: vi.fn(),
    acceptInvite: vi.fn(),
    loadMembers: vi.fn(),
    updateMemberPermission: vi.fn(),
    removeMember: vi.fn(),
  }
})

import type {
  MealPlan,
  MealPlanEntry,
  MealPlanMember,
  RecipeSummary,
  SharedMealPlan,
} from '@/shared/api/types'
import * as mealPlanService from '../services/mealPlanService'
import * as mealPlanSharingService from '../services/mealPlanSharingService'
import { useMealPlanStore } from './mealPlanStore'

const mockedLoadMealPlan = vi.mocked(mealPlanService.loadMealPlan)
const mockedSaveMealPlan = vi.mocked(mealPlanService.saveMealPlan)
const mockedLoadSharedMealPlans = vi.mocked(mealPlanSharingService.loadSharedMealPlans)
const mockedLoadMembers = vi.mocked(mealPlanSharingService.loadMembers)
const mockedUpdateMemberPermission = vi.mocked(mealPlanSharingService.updateMemberPermission)
const mockedRemoveMember = vi.mocked(mealPlanSharingService.removeMember)
const mockedAcceptInvite = vi.mocked(mealPlanSharingService.acceptInvite)

const RECIPE: RecipeSummary = {
  id: '0123456789abcdef01234567',
  title: 'Testrezept',
  imageUrl: null,
  category: null,
  cuisine: null,
  difficulty: 'easy',
  prepTime: 10,
  cookTime: 20,
  restTime: null,
  tags: ['Schnell'],
  status: 'public',
}

const OTHER_RECIPE: RecipeSummary = {
  ...RECIPE,
  id: 'fedcba9876543210fedcba98',
  title: 'Anderes Rezept',
}

const ENTRY: MealPlanEntry = {
  day: 'monday',
  meal: 'breakfast',
  recipeId: RECIPE.id,
  recipe: RECIPE,
}

const PLAN: MealPlan = {
  weekStart: '2026-11-09',
  entries: [ENTRY],
  updatedAt: '2026-11-12T10:00:00.000Z',
  owner: { id: 'aaaaaaaaaaaaaaaaaaaaaaaa', name: 'Testnutzer' },
  canEdit: true,
}

const MEMBER: MealPlanMember = {
  user: { id: 'bbbbbbbbbbbbbbbbbbbbbbbb', name: 'Mitglied' },
  canEdit: false,
  joinedAt: '2026-11-12T10:00:00.000Z',
}

const SHARED: SharedMealPlan = {
  owner: { id: 'cccccccccccccccccccccccc', name: 'Besitzer' },
  canEdit: false,
}

describe('mealPlanStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('startet ohne Einträge und ohne Änderungen', () => {
    const store = useMealPlanStore()

    expect(store.entries).toEqual([])
    expect(store.dirty).toBe(false)
    expect(store.saved).toBe(false)
    expect(store.errorKey).toBeNull()
  })

  it('lädt einen Wochenplan', async () => {
    const store = useMealPlanStore()

    mockedLoadMealPlan.mockResolvedValue(PLAN)

    await expect(store.loadWeek('2026-11-09')).resolves.toBe(true)
    expect(store.weekStart).toBe('2026-11-09')
    expect(store.entries).toEqual([ENTRY])
    expect(store.updatedAt).toBe(PLAN.updatedAt)
    expect(store.loading).toBe(false)
    expect(store.dirty).toBe(false)
  })

  it('meldet Ladefehler', async () => {
    const store = useMealPlanStore()

    mockedLoadMealPlan.mockRejectedValue({ status: 500 })

    await expect(store.loadWeek('2026-11-09')).resolves.toBe(false)
    expect(store.errorKey).toBe('mealPlan.errors.load')
    expect(store.entries).toEqual([])
    expect(store.loading).toBe(false)
  })

  it('setzt, ersetzt und entfernt Rezepte in einem Slot', () => {
    const store = useMealPlanStore()

    store.canEdit = true
    store.setRecipe('monday', 'breakfast', RECIPE)

    expect(store.entries).toEqual([ENTRY])
    expect(store.dirty).toBe(true)

    store.setRecipe('monday', 'breakfast', OTHER_RECIPE)

    expect(store.entries).toEqual([{ ...ENTRY, recipeId: OTHER_RECIPE.id, recipe: OTHER_RECIPE }])

    store.removeRecipe('monday', 'breakfast')

    expect(store.entries).toEqual([])
  })

  it('blockiert Änderungen und Speichern ohne Bearbeitungsrecht', async () => {
    const store = useMealPlanStore()

    store.entries = [ENTRY]
    store.canEdit = false
    store.setRecipe('tuesday', 'lunch', RECIPE)
    store.removeRecipe('monday', 'breakfast')

    expect(store.entries).toEqual([ENTRY])
    expect(store.dirty).toBe(false)
    await expect(store.save()).resolves.toBe(false)
    expect(mockedSaveMealPlan).not.toHaveBeenCalled()
  })

  it('speichert die Woche und markiert sie als gespeichert', async () => {
    const store = useMealPlanStore()

    store.weekStart = '2026-11-09'
    store.canEdit = true
    store.setRecipe('monday', 'breakfast', RECIPE)
    mockedSaveMealPlan.mockResolvedValue(PLAN)

    await expect(store.save()).resolves.toBe(true)
    expect(mockedSaveMealPlan).toHaveBeenCalledWith('2026-11-09', [ENTRY], undefined)
    expect(store.dirty).toBe(false)
    expect(store.saved).toBe(true)
    expect(store.saving).toBe(false)
  })

  it('meldet Speicherfehler und behält die Änderungen', async () => {
    const store = useMealPlanStore()

    store.weekStart = '2026-11-09'
    store.canEdit = true
    store.setRecipe('monday', 'breakfast', RECIPE)
    mockedSaveMealPlan.mockRejectedValue({ status: 400 })

    await expect(store.save()).resolves.toBe(false)
    expect(store.saveErrorKey).toBe('mealPlan.errors.invalidInput')
    expect(store.dirty).toBe(true)
    expect(store.entries).toEqual([ENTRY])
    expect(store.saving).toBe(false)
  })

  it('wechselt zur vorherigen oder nächsten Woche', async () => {
    const store = useMealPlanStore()

    store.weekStart = '2026-11-09'
    mockedLoadMealPlan.mockResolvedValue(PLAN)

    await store.goToWeek(1)

    expect(mockedLoadMealPlan).toHaveBeenLastCalledWith('2026-11-16', undefined)

    await store.goToWeek(-1)

    expect(mockedLoadMealPlan).toHaveBeenLastCalledWith('2026-11-09', undefined)
  })

  it('lädt und wechselt zu einem freigegebenen Wochenplaner', async () => {
    const store = useMealPlanStore()

    mockedLoadSharedMealPlans.mockResolvedValue([SHARED])
    mockedLoadMealPlan.mockResolvedValue({ ...PLAN, owner: SHARED.owner, canEdit: false })

    await expect(store.loadSharedPlanners()).resolves.toBe(true)
    expect(store.sharedPlanners).toEqual([SHARED])

    await expect(store.selectPlanner(SHARED.owner.id)).resolves.toBe(true)
    expect(store.selectedOwnerId).toBe(SHARED.owner.id)
    expect(store.isOwner).toBe(false)
    expect(store.isReadOnly).toBe(true)
    expect(mockedLoadMealPlan).toHaveBeenLastCalledWith('2026-11-09', SHARED.owner.id)
  })

  it('lädt Mitglieder und ändert das Bearbeitungsrecht', async () => {
    const store = useMealPlanStore()
    const updated = { ...MEMBER, canEdit: true }

    mockedLoadMembers.mockResolvedValue([MEMBER])
    mockedUpdateMemberPermission.mockResolvedValue(updated)

    await expect(store.loadMembers()).resolves.toBe(true)
    expect(store.members).toEqual([MEMBER])

    await expect(store.setMemberPermission(MEMBER.user.id, true)).resolves.toBe(true)
    expect(mockedUpdateMemberPermission).toHaveBeenCalledWith(MEMBER.user.id, true)
    expect(store.members).toEqual([updated])
  })

  it('entfernt ein Mitglied', async () => {
    const store = useMealPlanStore()

    store.members = [MEMBER]
    mockedRemoveMember.mockResolvedValue()

    await expect(store.removeMember(MEMBER.user.id)).resolves.toBe(true)
    expect(store.members).toEqual([])
  })

  it('nimmt eine Einladung an und ergänzt die freigegebenen Pläne', async () => {
    const store = useMealPlanStore()

    mockedAcceptInvite.mockResolvedValue(SHARED)

    await expect(store.acceptInvite('a'.repeat(64))).resolves.toEqual(SHARED)
    expect(store.sharedPlanners).toEqual([SHARED])
  })
})
