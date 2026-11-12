import type {
  IngredientUnit,
  Recipe,
  RecipeCreateRequest,
  RecipeDifficulty,
  RecipeSearchResponse,
} from '@/shared/api/types'
import { createRecipeApi } from '../api/createRecipeApi'
import { deleteRecipeApi } from '../api/deleteRecipeApi'
import { getRecipeApi } from '../api/getRecipeApi'
import { getRecipeTagsApi } from '../api/getRecipeTagsApi'
import { getRecipesApi } from '../api/getRecipesApi'
import { getPublicRecipesApi } from '../api/getPublicRecipesApi'
import { searchRecipesApi } from '../api/searchRecipesApi'
import type { SearchRecipesParams } from '../api/searchRecipesApi'
import { uploadImageApi } from '../api/uploadImageApi'
import type { RecipeForm } from '../types'

export function parseNonNegativeInteger(value: string): number | null {
  const trimmed = value.trim()

  if (!/^\d+$/.test(trimmed)) {
    return null
  }

  const parsed = Number(trimmed)

  return Number.isSafeInteger(parsed) ? parsed : null
}

export function parsePositiveInteger(value: string): number | null {
  const parsed = parseNonNegativeInteger(value)

  return parsed !== null && parsed > 0 ? parsed : null
}

export function parsePositiveNumber(value: string): number | null {
  const trimmed = value.trim().replace(',', '.')

  if (trimmed === '') {
    return null
  }

  const parsed = Number(trimmed)

  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function parseOptionalInteger(value: string): number | null {
  return value.trim() === '' ? null : parseNonNegativeInteger(value)
}

function trimOrNull(value: string): string | null {
  const trimmed = value.trim()

  return trimmed === '' ? null : trimmed
}

export function parseTags(value: string): string[] {
  return [
    ...new Set(
      value
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag !== ''),
    ),
  ]
}

/**
 * Prüft das Formular vor dem API-Aufruf und liefert den i18n-Key des ersten
 * Fehlers. Die endgültige Validierung übernimmt zusätzlich der API-Vertrag.
 */
export function validateRecipeForm(form: RecipeForm): string | null {
  if (form.title.trim() === '') {
    return 'recipe.errors.titleRequired'
  }

  if (parseNonNegativeInteger(form.prepTime) === null) {
    return 'recipe.errors.prepTimeRequired'
  }

  if (parseNonNegativeInteger(form.cookTime) === null) {
    return 'recipe.errors.cookTimeRequired'
  }

  if (form.restTime.trim() !== '' && parseNonNegativeInteger(form.restTime) === null) {
    return 'recipe.errors.restTimeInvalid'
  }

  if (parsePositiveInteger(form.servings) === null) {
    return 'recipe.errors.servingsRequired'
  }

  if (form.ingredients.length === 0) {
    return 'recipe.errors.ingredientsRequired'
  }

  for (const ingredient of form.ingredients) {
    if (ingredient.name.trim() === '') {
      return 'recipe.errors.ingredientNameRequired'
    }

    if (parsePositiveNumber(ingredient.quantity) === null) {
      return 'recipe.errors.ingredientQuantityRequired'
    }

    if (!ingredient.unit) {
      return 'recipe.errors.ingredientUnitRequired'
    }
  }

  if (form.instructions.length === 0) {
    return 'recipe.errors.instructionsRequired'
  }

  for (const instruction of form.instructions) {
    if (instruction.description.trim() === '') {
      return 'recipe.errors.instructionDescriptionRequired'
    }

    if (
      instruction.duration.trim() !== '' &&
      parseNonNegativeInteger(instruction.duration) === null
    ) {
      return 'recipe.errors.durationInvalid'
    }
  }

  return null
}

/** Baut aus dem Formular den vertragskonformen Request-Body. */
export function toCreateRecipePayload(form: RecipeForm): RecipeCreateRequest {
  return {
    title: form.title.trim(),
    description: trimOrNull(form.description),
    imageUrl: trimOrNull(form.imageUrl),
    category: trimOrNull(form.category),
    cuisine: trimOrNull(form.cuisine),
    difficulty: form.difficulty === '' ? null : (form.difficulty as RecipeDifficulty),
    prepTime: parseNonNegativeInteger(form.prepTime) ?? 0,
    cookTime: parseNonNegativeInteger(form.cookTime) ?? 0,
    restTime: parseOptionalInteger(form.restTime),
    servings: parsePositiveInteger(form.servings) ?? 1,
    servingUnit: trimOrNull(form.servingUnit),
    tags: parseTags(form.tags),
    ingredients: form.ingredients.map((ingredient) => ({
      name: ingredient.name.trim(),
      quantity: parsePositiveNumber(ingredient.quantity) ?? 0,
      unit: ingredient.unit as IngredientUnit,
      note: trimOrNull(ingredient.note),
      isOptional: ingredient.isOptional,
    })),
    instructions: form.instructions.map((instruction, index) => ({
      step: index + 1,
      description: instruction.description.trim(),
      duration: parseOptionalInteger(instruction.duration),
      imageUrl: trimOrNull(instruction.imageUrl),
    })),
    isPublic: form.isPublic,
  }
}

export function createRecipe(payload: RecipeCreateRequest): Promise<Recipe> {
  return createRecipeApi(payload)
}

export function loadRecipe(recipeId: string): Promise<Recipe> {
  return getRecipeApi(recipeId)
}

export function loadRecipes(): Promise<Recipe[]> {
  return getRecipesApi()
}

export function loadPublicRecipes(): Promise<Recipe[]> {
  return getPublicRecipesApi()
}

export function searchRecipes(
  params: SearchRecipesParams,
  signal?: AbortSignal,
): Promise<RecipeSearchResponse> {
  return searchRecipesApi(params, signal)
}

export function loadRecipeTags(): Promise<string[]> {
  return getRecipeTagsApi()
}

export function deleteRecipe(recipeId: string): Promise<void> {
  return deleteRecipeApi(recipeId)
}

export function uploadImage(file: File): Promise<string> {
  return uploadImageApi(file).then((response) => response.url)
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

export function getRecipeErrorKey(error: unknown): string {
  const status = statusOf(error)

  if (!status) {
    return 'recipe.errors.network'
  }

  if (status === 400) {
    return 'recipe.errors.invalidInput'
  }

  if (status === 404) {
    return 'recipe.errors.notFound'
  }

  return 'recipe.errors.generic'
}

export function getDeleteErrorKey(error: unknown): string {
  const status = statusOf(error)

  if (!status) {
    return 'recipe.errors.network'
  }

  if (status === 404) {
    return 'recipe.errors.notFound'
  }

  return 'recipe.errors.deleteGeneric'
}

export function getUploadErrorKey(error: unknown): string {
  const status = statusOf(error)

  if (!status) {
    return 'recipe.errors.uploadNetwork'
  }

  if (status === 400) {
    return 'recipe.errors.uploadInvalidType'
  }

  if (status === 413) {
    return 'recipe.errors.uploadTooLarge'
  }

  return 'recipe.errors.uploadGeneric'
}
