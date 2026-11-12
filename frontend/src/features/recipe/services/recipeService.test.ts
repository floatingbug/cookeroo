import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../api/createRecipeApi', () => ({ createRecipeApi: vi.fn() }))
vi.mock('../api/deleteRecipeApi', () => ({ deleteRecipeApi: vi.fn() }))
vi.mock('../api/getRecipeApi', () => ({ getRecipeApi: vi.fn() }))
vi.mock('../api/getRecipesApi', () => ({ getRecipesApi: vi.fn() }))
vi.mock('../api/uploadImageApi', () => ({ uploadImageApi: vi.fn() }))

import { ApiError } from '@/shared/api/apiFetch'
import type { Recipe, RecipeCreateRequest } from '@/shared/api/types'
import { createRecipeApi } from '../api/createRecipeApi'
import { deleteRecipeApi } from '../api/deleteRecipeApi'
import { getRecipeApi } from '../api/getRecipeApi'
import { getRecipesApi } from '../api/getRecipesApi'
import { uploadImageApi } from '../api/uploadImageApi'
import type { RecipeForm } from '../types'
import {
  createRecipe,
  deleteRecipe,
  getDeleteErrorKey,
  getRecipeErrorKey,
  getUploadErrorKey,
  loadRecipe,
  loadRecipes,
  parseTags,
  toCreateRecipePayload,
  uploadImage,
  validateRecipeForm,
} from './recipeService'

const mockedCreateRecipeApi = vi.mocked(createRecipeApi)
const mockedDeleteRecipeApi = vi.mocked(deleteRecipeApi)
const mockedGetRecipeApi = vi.mocked(getRecipeApi)
const mockedGetRecipesApi = vi.mocked(getRecipesApi)
const mockedUploadImageApi = vi.mocked(uploadImageApi)

const RECIPE = { id: 'recipe-1', title: 'Testrezept' } as Recipe

function createForm(overrides: Partial<RecipeForm> = {}): RecipeForm {
  return {
    title: ' Testrezept ',
    description: ' Beschreibung ',
    imageUrl: '',
    category: ' Hauptgericht ',
    cuisine: '',
    difficulty: '',
    prepTime: '10',
    cookTime: '20',
    restTime: '',
    servings: '2',
    servingUnit: ' Portion ',
    tags: 'Nudeln, Schnell, Nudeln',
    ingredients: [
      {
        key: 'ingredient-1',
        name: ' Mehl ',
        quantity: '200',
        unit: 'g',
        note: ' gesiebt ',
        isOptional: true,
      },
    ],
    instructions: [
      {
        key: 'instruction-1',
        step: 1,
        description: ' Alles mischen. ',
        duration: '5',
        imageUrl: '',
      },
    ],
    isPublic: true,
    ...overrides,
  }
}

describe('recipeService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('validateRecipeForm', () => {
    it('akzeptiert ein vollständiges Formular', () => {
      expect(validateRecipeForm(createForm())).toBeNull()
    })

    it('verlangt einen Titel', () => {
      expect(validateRecipeForm(createForm({ title: '   ' }))).toBe('recipe.errors.titleRequired')
    })

    it('verlangt gültige Vorbereitungs- und Kochzeiten', () => {
      expect(validateRecipeForm(createForm({ prepTime: '' }))).toBe(
        'recipe.errors.prepTimeRequired',
      )
      expect(validateRecipeForm(createForm({ cookTime: 'abc' }))).toBe(
        'recipe.errors.cookTimeRequired',
      )
    })

    it('prüft optionale Zeiten und Portionen', () => {
      expect(validateRecipeForm(createForm({ restTime: 'x' }))).toBe(
        'recipe.errors.restTimeInvalid',
      )
      expect(validateRecipeForm(createForm({ servings: '0' }))).toBe(
        'recipe.errors.servingsRequired',
      )
    })

    it('prüft Zutaten', () => {
      expect(validateRecipeForm(createForm({ ingredients: [] }))).toBe(
        'recipe.errors.ingredientsRequired',
      )
      expect(
        validateRecipeForm(
          createForm({
            ingredients: [createForm().ingredients[0]!].map((ingredient) => ({
              ...ingredient,
              name: '',
            })),
          }),
        ),
      ).toBe('recipe.errors.ingredientNameRequired')
      expect(
        validateRecipeForm(
          createForm({
            ingredients: [{ ...createForm().ingredients[0]!, quantity: '0' }],
          }),
        ),
      ).toBe('recipe.errors.ingredientQuantityRequired')
    })

    it('prüft Zubereitungsschritte', () => {
      expect(validateRecipeForm(createForm({ instructions: [] }))).toBe(
        'recipe.errors.instructionsRequired',
      )
      expect(
        validateRecipeForm(
          createForm({
            instructions: [{ ...createForm().instructions[0]!, description: '  ' }],
          }),
        ),
      ).toBe('recipe.errors.instructionDescriptionRequired')
      expect(
        validateRecipeForm(
          createForm({
            instructions: [{ ...createForm().instructions[0]!, duration: 'x' }],
          }),
        ),
      ).toBe('recipe.errors.durationInvalid')
    })
  })

  describe('toCreateRecipePayload', () => {
    it('trimmt Werte, entfernt doppelte Tags und nummeriert Schritte', () => {
      const payload = toCreateRecipePayload(createForm())

      expect(payload).toEqual({
        title: 'Testrezept',
        description: 'Beschreibung',
        imageUrl: null,
        category: 'Hauptgericht',
        cuisine: null,
        difficulty: null,
        prepTime: 10,
        cookTime: 20,
        restTime: null,
        servings: 2,
        servingUnit: 'Portion',
        tags: ['Nudeln', 'Schnell'],
        ingredients: [
          {
            name: 'Mehl',
            quantity: 200,
            unit: 'g',
            note: 'gesiebt',
            isOptional: true,
          },
        ],
        instructions: [
          {
            step: 1,
            description: 'Alles mischen.',
            duration: 5,
            imageUrl: null,
          },
        ],
        isPublic: true,
      } satisfies RecipeCreateRequest)
    })
  })

  describe('parseTags', () => {
    it('teilt an Kommas und ignoriert leere Werte', () => {
      expect(parseTags(' a, b ,, a ')).toEqual(['a', 'b'])
    })
  })

  describe('API-Aufrufe', () => {
    it('legt ein Rezept an', async () => {
      const payload = toCreateRecipePayload(createForm())

      mockedCreateRecipeApi.mockResolvedValue(RECIPE)

      await expect(createRecipe(payload)).resolves.toBe(RECIPE)
      expect(mockedCreateRecipeApi).toHaveBeenCalledWith(payload)
    })

    it('lädt ein Rezept', async () => {
      mockedGetRecipeApi.mockResolvedValue(RECIPE)

      await expect(loadRecipe('recipe-1')).resolves.toBe(RECIPE)
      expect(mockedGetRecipeApi).toHaveBeenCalledWith('recipe-1')
    })

    it('lädt alle Rezepte des Benutzers', async () => {
      mockedGetRecipesApi.mockResolvedValue([RECIPE])

      await expect(loadRecipes()).resolves.toEqual([RECIPE])
      expect(mockedGetRecipesApi).toHaveBeenCalledWith()
    })

    it('löscht ein Rezept', async () => {
      mockedDeleteRecipeApi.mockResolvedValue(undefined)

      await expect(deleteRecipe('recipe-1')).resolves.toBeUndefined()
      expect(mockedDeleteRecipeApi).toHaveBeenCalledWith('recipe-1')
    })

    it('liefert die URL des hochgeladenen Bildes', async () => {
      const file = new File(['abc'], 'image.png', { type: 'image/png' })

      mockedUploadImageApi.mockResolvedValue({ url: 'http://example.test/image.png' })

      await expect(uploadImage(file)).resolves.toBe('http://example.test/image.png')
      expect(mockedUploadImageApi).toHaveBeenCalledWith(file)
    })
  })

  describe('getRecipeErrorKey', () => {
    it('übersetzt Statuscodes in i18n-Keys', () => {
      expect(getRecipeErrorKey(new ApiError('x', 400, null))).toBe('recipe.errors.invalidInput')
      expect(getRecipeErrorKey(new ApiError('x', 404, null))).toBe('recipe.errors.notFound')
      expect(getRecipeErrorKey(new ApiError('x', 500, null))).toBe('recipe.errors.generic')
      expect(getRecipeErrorKey(new TypeError('fetch failed'))).toBe('recipe.errors.network')
    })
  })

  describe('getUploadErrorKey', () => {
    it('übersetzt Upload-Fehler in i18n-Keys', () => {
      expect(getUploadErrorKey(new ApiError('x', 400, null))).toBe(
        'recipe.errors.uploadInvalidType',
      )
      expect(getUploadErrorKey(new ApiError('x', 413, null))).toBe('recipe.errors.uploadTooLarge')
      expect(getUploadErrorKey(new ApiError('x', 500, null))).toBe('recipe.errors.uploadGeneric')
      expect(getUploadErrorKey(new TypeError('fetch failed'))).toBe('recipe.errors.uploadNetwork')
    })
  })

  describe('getDeleteErrorKey', () => {
    it('übersetzt Löschfehler in i18n-Keys', () => {
      expect(getDeleteErrorKey(new ApiError('x', 404, null))).toBe('recipe.errors.notFound')
      expect(getDeleteErrorKey(new ApiError('x', 500, null))).toBe('recipe.errors.deleteGeneric')
      expect(getDeleteErrorKey(new TypeError('fetch failed'))).toBe('recipe.errors.network')
    })
  })
})
