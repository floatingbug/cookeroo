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
