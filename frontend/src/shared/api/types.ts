/**
 * Alias-Schicht auf die aus `contracts/openapi.bundled.yaml` generierten Typen.
 * Typen nicht hier definieren – `schema.d.ts` mit `npm run gen:api` neu erzeugen.
 */
import type { components } from './schema'

type Schemas = components['schemas']

export type User = Schemas['User']
export type SignInResponse = Schemas['SignInResponse']
export type MessageResponse = Schemas['Message']
export type ConfirmEmailChangeResponse = Schemas['ConfirmEmailChangeResponse']
export type AccountUpdateResult = Schemas['AccountUpdateResult']
export type Recipe = Schemas['Recipe']
export type RecipeNutrition = Schemas['Nutrition']
export type RecipeCreateRequest = Schemas['RecipeCreateRequest']
export type RecipeIngredient = Schemas['Ingredient']
export type RecipeInstruction = Schemas['Instruction']
export type RecipeDifficulty = Schemas['RecipeDifficulty']
export type IngredientUnit = Schemas['IngredientUnit']
export type RecipeStatus = Schemas['RecipeStatus']
export type ImageUploadResponse = Schemas['ImageUploadResponse']
export type MealPlan = Schemas['MealPlan']
export type MealPlanEntry = Schemas['MealPlanEntry']
export type MealPlanSaveRequest = Schemas['MealPlanSaveRequest']
export type MealPlanDay = Schemas['MealPlanDay']
export type MealPlanMeal = Schemas['MealPlanMeal']
export type MealPlanUser = Schemas['MealPlanUser']
export type SharedMealPlan = Schemas['SharedMealPlan']
export type SharedMealPlanList = Schemas['SharedMealPlanList']
export type MealPlanInvite = Schemas['MealPlanInvite']
export type MealPlanInvitePreview = Schemas['MealPlanInvitePreview']
export type MealPlanMember = Schemas['MealPlanMember']
export type MealPlanMemberList = Schemas['MealPlanMemberList']
export type MealPlanMemberUpdateRequest = Schemas['MealPlanMemberUpdateRequest']
export type RecipeSummary = Schemas['RecipeSummary']
export type RecipeSearchResponse = Schemas['RecipeSearchResponse']
