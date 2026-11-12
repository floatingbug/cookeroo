import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('../services/recipeService', async () => {
  const actual = await vi.importActual<typeof import('../services/recipeService')>(
    '../services/recipeService',
  )

  return {
    ...actual,
    createRecipe: vi.fn(),
    loadRecipe: vi.fn(),
    loadRecipes: vi.fn(),
    uploadImage: vi.fn(),
  }
})

import type { Recipe } from '@/shared/api/types'
import * as recipeService from '../services/recipeService'
import { useRecipeStore } from './recipeStore'

const mockedCreateRecipe = vi.mocked(recipeService.createRecipe)
const mockedLoadRecipe = vi.mocked(recipeService.loadRecipe)
const mockedLoadRecipes = vi.mocked(recipeService.loadRecipes)
const mockedUploadImage = vi.mocked(recipeService.uploadImage)

const RECIPE = { id: 'recipe-1', title: 'Testrezept' } as Recipe

function fillRequiredFields(store: ReturnType<typeof useRecipeStore>): void {
  store.form.title = 'Testrezept'
  store.form.prepTime = '10'
  store.form.cookTime = '20'
  store.form.servings = '2'
  store.form.ingredients[0]!.name = 'Mehl'
  store.form.ingredients[0]!.quantity = '200'
  store.form.instructions[0]!.description = 'Alles mischen.'
}

describe('recipeStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('startet mit einem leeren Formular und je einer Zutat und einem Schritt', () => {
    const store = useRecipeStore()

    expect(store.form.title).toBe('')
    expect(store.form.servings).toBe('1')
    expect(store.form.isPublic).toBe(true)
    expect(store.form.ingredients).toHaveLength(1)
    expect(store.form.instructions).toHaveLength(1)
    expect(store.errorKey).toBeNull()
  })

  it('fügt Zutaten hinzu und entfernt sie, behält aber mindestens eine', () => {
    const store = useRecipeStore()

    store.addIngredient()
    expect(store.form.ingredients).toHaveLength(2)

    store.removeIngredient(store.form.ingredients[1]!.key)
    expect(store.form.ingredients).toHaveLength(1)

    store.removeIngredient(store.form.ingredients[0]!.key)
    expect(store.form.ingredients).toHaveLength(1)
  })

  it('nummeriert Schritte nach dem Hinzufügen und Entfernen neu', () => {
    const store = useRecipeStore()

    store.addInstruction()
    expect(store.form.instructions.map((instruction) => instruction.step)).toEqual([1, 2])

    store.removeInstruction(store.form.instructions[0]!.key)
    expect(store.form.instructions).toHaveLength(1)
    expect(store.form.instructions[0]!.step).toBe(1)
  })

  it('validiert vor dem API-Aufruf', async () => {
    const store = useRecipeStore()

    await expect(store.submit()).resolves.toBeNull()
    expect(store.errorKey).toBe('recipe.errors.titleRequired')
    expect(mockedCreateRecipe).not.toHaveBeenCalled()
  })

  it('speichert ein gültiges Rezept und liefert die ID', async () => {
    const store = useRecipeStore()

    fillRequiredFields(store)
    mockedCreateRecipe.mockResolvedValue(RECIPE)

    await expect(store.submit()).resolves.toBe('recipe-1')

    expect(mockedCreateRecipe).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Testrezept',
        prepTime: 10,
        cookTime: 20,
        servings: 2,
      }),
    )
    expect(store.loading).toBe(false)
    expect(store.errorKey).toBeNull()
  })

  it('übersetzt Speicherfehler in i18n-Keys', async () => {
    const store = useRecipeStore()

    fillRequiredFields(store)
    mockedCreateRecipe.mockRejectedValue({ status: 500 })

    await expect(store.submit()).resolves.toBeNull()
    expect(store.errorKey).toBe('recipe.errors.generic')
    expect(store.loading).toBe(false)
  })

  it('lädt ein Bild hoch und liefert die URL', async () => {
    const store = useRecipeStore()
    const file = new File(['abc'], 'image.png', { type: 'image/png' })

    mockedUploadImage.mockResolvedValue('http://example.test/image.png')

    await expect(store.uploadImage(file)).resolves.toBe('http://example.test/image.png')
    expect(store.uploading).toBe(false)
    expect(store.errorKey).toBeNull()
  })

  it('meldet Upload-Fehler', async () => {
    const store = useRecipeStore()
    const file = new File(['abc'], 'image.png', { type: 'image/png' })

    mockedUploadImage.mockRejectedValue({ status: 413 })

    await expect(store.uploadImage(file)).resolves.toBeNull()
    expect(store.errorKey).toBe('recipe.errors.uploadTooLarge')
    expect(store.uploading).toBe(false)
  })

  it('lädt ein Rezept in den State', async () => {
    const store = useRecipeStore()

    mockedLoadRecipe.mockResolvedValue(RECIPE)

    await expect(store.loadRecipe('recipe-1')).resolves.toBe(true)
    expect(store.recipe).toEqual(RECIPE)
    expect(store.loading).toBe(false)
    expect(store.errorKey).toBeNull()
  })

  it('meldet Ladefehler und leert das Rezept', async () => {
    const store = useRecipeStore()

    store.recipe = RECIPE
    mockedLoadRecipe.mockRejectedValue({ status: 404 })

    await expect(store.loadRecipe('recipe-1')).resolves.toBe(false)
    expect(store.recipe).toBeNull()
    expect(store.errorKey).toBe('recipe.errors.notFound')
    expect(store.loading).toBe(false)
  })

  it('lädt alle Rezepte in den State', async () => {
    const store = useRecipeStore()

    mockedLoadRecipes.mockResolvedValue([RECIPE])

    await expect(store.loadRecipes()).resolves.toBe(true)
    expect(store.recipes).toEqual([RECIPE])
    expect(store.recipesLoading).toBe(false)
    expect(store.recipesErrorKey).toBeNull()
  })

  it('meldet Fehler beim Laden der Rezeptliste und leert sie', async () => {
    const store = useRecipeStore()

    store.recipes = [RECIPE]
    mockedLoadRecipes.mockRejectedValue({ status: 500 })

    await expect(store.loadRecipes()).resolves.toBe(false)
    expect(store.recipes).toEqual([])
    expect(store.recipesErrorKey).toBe('recipe.errors.generic')
    expect(store.recipesLoading).toBe(false)
  })
})
