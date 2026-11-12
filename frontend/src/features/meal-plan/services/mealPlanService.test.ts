import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { MealPlan, MealPlanEntry, RecipeSummary } from '@/shared/api/types'
import { getMealPlanApi } from '../api/getMealPlanApi'
import { saveMealPlanApi } from '../api/saveMealPlanApi'
import {
  formatWeekRange,
  getMealPlanErrorKey,
  getMonday,
  loadMealPlan,
  saveMealPlan,
  shiftWeek,
} from './mealPlanService'

vi.mock('../api/getMealPlanApi', () => ({ getMealPlanApi: vi.fn() }))
vi.mock('../api/saveMealPlanApi', () => ({ saveMealPlanApi: vi.fn() }))

const mockedGetMealPlanApi = vi.mocked(getMealPlanApi)
const mockedSaveMealPlanApi = vi.mocked(saveMealPlanApi)

const RECIPE: RecipeSummary = {
  id: '0123456789abcdef01234567',
  title: 'Testrezept',
  imageUrl: null,
  category: 'Hauptgericht',
  cuisine: null,
  difficulty: 'easy',
  prepTime: 10,
  cookTime: 20,
  restTime: null,
  tags: ['Schnell'],
  status: 'public',
}

const ENTRY: MealPlanEntry = {
  day: 'monday',
  meal: 'breakfast',
  recipeId: RECIPE.id,
  recipe: RECIPE,
}

const PLAN: MealPlan = {
  weekStart: '2026-11-09',
  entries: [],
  updatedAt: null,
  owner: { id: 'aaaaaaaaaaaaaaaaaaaaaaaa', name: 'Testnutzer' },
  canEdit: true,
}

describe('mealPlanService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('berechnet den Montag der aktuellen Woche', () => {
    expect(getMonday(new Date(2026, 10, 12))).toBe('2026-11-09')
    expect(getMonday(new Date(2026, 10, 15))).toBe('2026-11-09')
    expect(getMonday(new Date(2026, 10, 9))).toBe('2026-11-09')
  })

  it('verschiebt Wochen über Monats- und Jahresgrenzen hinweg', () => {
    expect(shiftWeek('2026-11-09', 1)).toBe('2026-11-16')
    expect(shiftWeek('2026-11-09', -1)).toBe('2026-11-02')
    expect(shiftWeek('2026-12-28', 1)).toBe('2027-01-04')
  })

  it('formatiert den Wochenzeitraum', () => {
    expect(formatWeekRange('2026-11-09', 'de')).toContain('09.11.2026')
    expect(formatWeekRange('2026-11-09', 'de')).toContain('15.11.2026')
  })

  it('lädt den Wochenplan über die API', async () => {
    mockedGetMealPlanApi.mockResolvedValue(PLAN)

    await expect(loadMealPlan('2026-11-09')).resolves.toBe(PLAN)
    expect(mockedGetMealPlanApi).toHaveBeenCalledWith('2026-11-09', undefined)
  })

  it('lädt den Wochenplan eines freigegebenen Planers', async () => {
    mockedGetMealPlanApi.mockResolvedValue(PLAN)

    await expect(loadMealPlan('2026-11-09', 'aaaaaaaaaaaaaaaaaaaaaaaa')).resolves.toBe(PLAN)
    expect(mockedGetMealPlanApi).toHaveBeenCalledWith('2026-11-09', 'aaaaaaaaaaaaaaaaaaaaaaaa')
  })

  it('sendet beim Speichern nur die Rezept-IDs', async () => {
    mockedSaveMealPlanApi.mockResolvedValue({ ...PLAN, entries: [ENTRY] })

    await expect(saveMealPlan('2026-11-09', [ENTRY])).resolves.toEqual({
      ...PLAN,
      entries: [ENTRY],
    })
    expect(mockedSaveMealPlanApi).toHaveBeenCalledWith(
      '2026-11-09',
      {
        entries: [{ day: 'monday', meal: 'breakfast', recipeId: RECIPE.id }],
      },
      undefined,
    )
  })

  it('übersetzt Fehler in i18n-Keys', () => {
    expect(getMealPlanErrorKey({}, 'mealPlan.errors.load')).toBe('mealPlan.errors.network')
    expect(getMealPlanErrorKey({ status: 400 }, 'mealPlan.errors.load')).toBe(
      'mealPlan.errors.invalidInput',
    )
    expect(getMealPlanErrorKey({ status: 403 }, 'mealPlan.errors.save')).toBe(
      'mealPlan.errors.forbidden',
    )
    expect(getMealPlanErrorKey({ status: 404 }, 'mealPlan.errors.load')).toBe(
      'mealPlan.errors.notFound',
    )
    expect(getMealPlanErrorKey({ status: 500 }, 'mealPlan.errors.save')).toBe(
      'mealPlan.errors.save',
    )
  })
})
