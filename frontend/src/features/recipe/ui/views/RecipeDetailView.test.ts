import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const { routeMock } = vi.hoisted(() => ({ routeMock: { params: { id: 'recipe-1' } } }))

vi.mock('vue-router', () => ({
  useRoute: () => routeMock,
}))

vi.mock('../../services/recipeService', async () => {
  const actual = await vi.importActual<typeof import('../../services/recipeService')>(
    '../../services/recipeService',
  )

  return {
    ...actual,
    loadRecipe: vi.fn(),
  }
})

import type { Recipe } from '@/shared/api/types'
import i18n from '@/app/i18n'
import * as recipeService from '../../services/recipeService'
import RecipeDetailView from './RecipeDetailView.vue'

const mockedLoadRecipe = vi.mocked(recipeService.loadRecipe)

const RECIPE: Recipe = {
  id: 'recipe-1',
  title: 'Lasagne',
  description: 'Ein Klassiker.',
  imageUrl: null,
  category: 'Hauptgericht',
  cuisine: 'Italienisch',
  difficulty: 'medium',
  prepTime: 20,
  cookTime: 40,
  restTime: 10,
  servings: 4,
  servingUnit: 'Portionen',
  tags: ['Ofen'],
  ingredients: [
    {
      name: 'Mehl',
      quantity: 200,
      unit: 'g',
      note: null,
      isOptional: false,
    },
  ],
  instructions: [
    {
      step: 1,
      description: 'Alles schichten.',
      duration: 10,
      imageUrl: null,
    },
  ],
  nutrition: {
    total: {
      calories: 1164,
      protein: 23.4,
      fat: 7.6,
      carbohydrates: 244.7,
      fiber: 6,
      sugar: 106.7,
      salt: 0.12,
    },
    perServing: {
      calories: 291,
      protein: 5.9,
      fat: 1.9,
      carbohydrates: 61.2,
      fiber: 1.5,
      sugar: 26.7,
      salt: 0.03,
    },
    matchedIngredients: 4,
    totalIngredients: 4,
    unmatchedIngredients: [],
  },
  createdAt: '2026-01-01T10:00:00.000Z',
  updatedAt: '2026-01-01T10:00:00.000Z',
  createdBy: '0123456789abcdef01234567',
  isPublic: true,
  status: 'public',
}

function mountView() {
  const pinia = createPinia()

  setActivePinia(pinia)

  return mount(RecipeDetailView, {
    global: { plugins: [pinia, i18n] },
  })
}

describe('RecipeDetailView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('zeigt Rezept, Zutaten und Schritte', async () => {
    mockedLoadRecipe.mockResolvedValue(RECIPE)

    const wrapper = mountView()

    await flushPromises()

    expect(mockedLoadRecipe).toHaveBeenCalledWith('recipe-1')
    expect(wrapper.text()).toContain('Lasagne')
    expect(wrapper.text()).toContain('Mehl')
    expect(wrapper.text()).toContain('Alles schichten.')
    expect(wrapper.text()).toContain(i18n.global.t('recipe.status.public'))
    expect(wrapper.text()).toContain(i18n.global.t('recipe.nutrition.title'))
    expect(wrapper.find('.calorie-value').text()).toBe('291')
  })

  it('blendet die Nährwerte ohne Daten aus', async () => {
    mockedLoadRecipe.mockResolvedValue({ ...RECIPE, nutrition: null })

    const wrapper = mountView()

    await flushPromises()

    expect(wrapper.text()).not.toContain(i18n.global.t('recipe.nutrition.title'))
  })

  it('zeigt einen Fehler, wenn das Rezept nicht gefunden wird', async () => {
    mockedLoadRecipe.mockRejectedValue({ status: 404 })

    const wrapper = mountView()

    await flushPromises()

    expect(wrapper.text()).toContain(i18n.global.t('recipe.errors.notFound'))
  })
})
