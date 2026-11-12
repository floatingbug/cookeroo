import type {
  MealPlan,
  MealPlanDay,
  MealPlanEntry,
  MealPlanMeal,
  MealPlanSaveRequest,
} from '@/shared/api/types'
import { getMealPlanApi } from '../api/getMealPlanApi'
import { saveMealPlanApi } from '../api/saveMealPlanApi'

export const WEEK_DAYS: MealPlanDay[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]

export const MEAL_SLOTS: MealPlanMeal[] = ['breakfast', 'lunch', 'dinner']

function toIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

/** Liefert den Montag der Woche, in der das übergebene Datum liegt. */
export function getMonday(date: Date = new Date()): string {
  const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const weekday = localDate.getDay()
  const offset = weekday === 0 ? -6 : 1 - weekday

  localDate.setDate(localDate.getDate() + offset)

  return toIsoDate(localDate)
}

/** Verschiebt einen Wochenstart um die angegebene Anzahl Wochen. */
export function shiftWeek(weekStart: string, weeks: number): string {
  const date = new Date(`${weekStart}T00:00:00.000Z`)

  date.setUTCDate(date.getUTCDate() + weeks * 7)

  return date.toISOString().slice(0, 10)
}

/** Formatiert den Montag bis Sonntag umfassenden Zeitraum der Woche. */
export function formatWeekRange(weekStart: string, locale: string): string {
  const start = new Date(`${weekStart}T00:00:00.000Z`)
  const end = new Date(start)

  end.setUTCDate(end.getUTCDate() + 6)

  const formatter = new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  })

  return `${formatter.format(start)} – ${formatter.format(end)}`
}

export function loadMealPlan(weekStart: string, ownerId?: string): Promise<MealPlan> {
  return getMealPlanApi(weekStart, ownerId)
}

export function saveMealPlan(
  weekStart: string,
  entries: MealPlanEntry[],
  ownerId?: string,
): Promise<MealPlan> {
  const payload: MealPlanSaveRequest = {
    entries: entries.map(({ day, meal, recipeId }) => ({ day, meal, recipeId })),
  }

  return saveMealPlanApi(weekStart, payload, ownerId)
}

interface ErrorWithStatus {
  status?: number
}

function statusOf(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    return (error as ErrorWithStatus).status
  }

  return undefined
}

export function getMealPlanErrorKey(error: unknown, fallback: string): string {
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
