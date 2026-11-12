import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: pushMock }),
}))

vi.mock('../../services/recipeService', async () => {
  const actual = await vi.importActual<typeof import('../../services/recipeService')>(
    '../../services/recipeService',
  )

  return {
    ...actual,
    deleteRecipe: vi.fn(),
    loadRecipes: vi.fn(),
  }
})

import type { Recipe } from '@/shared/api/types'
import i18n from '@/app/i18n'
import * as recipeService from '../../services/recipeService'
import RecipeListView from './RecipeListView.vue'

const mockedLoadRecipes = vi.mocked(recipeService.loadRecipes)
const mockedDeleteRecipe = vi.mocked(recipeService.deleteRecipe)

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
  ingredients: [],
  instructions: [],
  nutrition: null,
  createdAt: '2026-01-01T10:00:00.000Z',
  updatedAt: '2026-01-01T10:00:00.000Z',
  createdBy: '0123456789abcdef01234567',
  isPublic: true,
  status: 'public',
}

const RouterLinkStub = {
  props: ['to'],
  template: '<a><slot /></a>',
}

function mountView() {
  const pinia = createPinia()

  setActivePinia(pinia)

  return mount(RecipeListView, {
    global: {
      plugins: [pinia, i18n],
      stubs: { RouterLink: RouterLinkStub },
    },
  })
}

describe('RecipeListView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('zeigt einen Ladezustand', async () => {
    mockedLoadRecipes.mockReturnValue(new Promise(() => {}))

    const wrapper = mountView()

    await nextTick()

    expect(wrapper.text()).toContain(i18n.global.t('recipe.list.loading'))
  })

  it('zeigt die eigenen Rezepte als Karten', async () => {
    mockedLoadRecipes.mockResolvedValue([
      RECIPE,
      { ...RECIPE, id: 'recipe-2', title: 'Tomatensuppe', status: 'private' },
    ])

    const wrapper = mountView()

    await flushPromises()

    expect(wrapper.text()).toContain('Lasagne')
    expect(wrapper.text()).toContain('Tomatensuppe')
    expect(wrapper.findAll('.recipe-grid-item')).toHaveLength(2)
  })

  it('zeigt einen Leerzustand', async () => {
    mockedLoadRecipes.mockResolvedValue([])

    const wrapper = mountView()

    await flushPromises()

    expect(wrapper.text()).toContain(i18n.global.t('recipe.list.empty'))
    expect(wrapper.text()).toContain(i18n.global.t('recipe.list.emptyHint'))
  })

  it('zeigt einen Fehler beim Laden', async () => {
    mockedLoadRecipes.mockRejectedValue({ status: 500 })

    const wrapper = mountView()

    await flushPromises()

    expect(wrapper.text()).toContain(i18n.global.t('recipe.errors.generic'))
  })

  it('löscht ein Rezept nach Bestätigung aus der Liste', async () => {
    mockedLoadRecipes.mockResolvedValue([RECIPE])
    mockedDeleteRecipe.mockResolvedValue(undefined)

    const wrapper = mountView()

    await flushPromises()

    const deleteButton = wrapper
      .findAll('button')
      .find((button) => button.text() === i18n.global.t('recipe.actions.delete'))

    expect(deleteButton).toBeDefined()

    await deleteButton!.trigger('click')

    const confirmButton = wrapper
      .findAll('button')
      .find((button) => button.text() === i18n.global.t('recipe.actions.deleteConfirm'))

    await confirmButton!.trigger('click')
    await flushPromises()

    expect(mockedDeleteRecipe).toHaveBeenCalledWith('recipe-1')
    expect(wrapper.findAll('.recipe-grid-item')).toHaveLength(0)
  })
})
