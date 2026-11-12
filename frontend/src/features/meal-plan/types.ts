import type { MealPlanDay, MealPlanMeal } from '@/shared/api/types'

export interface MealSlotView {
  meal: MealPlanMeal
  label: string
  recipeId: string | null
  recipeTitle: string | null
  recipeAvailable: boolean
}

export interface MealDayView {
  day: MealPlanDay
  dayLabel: string
  slots: MealSlotView[]
}
