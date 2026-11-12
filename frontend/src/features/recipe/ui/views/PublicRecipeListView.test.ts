import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('../../services/recipeService', async () => {
  const actual = await vi.importActual<typeof import('../../services/recipeService')>(
    '../../services/recipeService',
  )

  return {
    ...actual,
    loadPublicRecipes: vi.fn(),
  }
})

import type { Recipe } from '@/shared/api/types'
import i18n from '@/app/i18n'
import * as recipeService from '../../services/recipeService'
import PublicRecipeListView from './PublicRecipeListView.vue'

const mockedLoadPublicRecipes = vi.mocked(recipeService.loadPublicRecipes)

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

  return mount(PublicRecipeListView, {
    global: {
      plugins: [pinia, i18n],
      stubs: { RouterLink: RouterLinkStub },
    },
  })
}

describe('PublicRecipeListView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('zeigt einen Ladezustand', async () => {
    mockedLoadPublicRecipes.mockReturnValue(new Promise(() => {}))

    const wrapper = mountView()

    await nextTick()

    expect(wrapper.text()).toContain(i18n.global.t('recipe.publicList.loading'))
  })

  it('zeigt öffentliche Rezepte als Karten ohne Löschaktion', async () => {
    mockedLoadPublicRecipes.mockResolvedValue([
      RECIPE,
      { ...RECIPE, id: 'recipe-2', title: 'Tomatensuppe' },
    ])

    const wrapper = mountView()

    await flushPromises()

    expect(wrapper.text()).toContain('Lasagne')
    expect(wrapper.text()).toContain('Tomatensuppe')
    expect(wrapper.findAll('.recipe-grid-item')).toHaveLength(2)
    expect(wrapper.findAll('button')).toHaveLength(0)
  })

  it('zeigt einen Leerzustand', async () => {
    mockedLoadPublicRecipes.mockResolvedValue([])

    const wrapper = mountView()

    await flushPromises()

    expect(wrapper.text()).toContain(i18n.global.t('recipe.publicList.empty'))
    expect(wrapper.text()).toContain(i18n.global.t('recipe.publicList.emptyHint'))
  })

  it('zeigt einen Fehler beim Laden', async () => {
    mockedLoadPublicRecipes.mockRejectedValue({ status: 500 })

    const wrapper = mountView()

    await flushPromises()

    expect(wrapper.text()).toContain(i18n.global.t('recipe.errors.generic'))
  })
})
