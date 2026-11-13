import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const { routeMock, pushMock } = vi.hoisted(() => ({
  routeMock: { params: { id: 'recipe-1' } as Record<string, string> },
  pushMock: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRoute: () => routeMock,
  useRouter: () => ({ push: pushMock }),
}))

vi.mock('../../services/recipeService', async () => {
  const actual = await vi.importActual<typeof import('../../services/recipeService')>(
    '../../services/recipeService',
  )

  return {
    ...actual,
    loadRecipe: vi.fn(),
    updateRecipe: vi.fn(),
    uploadImage: vi.fn(),
  }
})

import type { Recipe, User } from '@/shared/api/types'
import i18n from '@/app/i18n'
import { useAuthStore } from '@/features/auth/store/authStore'
import * as recipeService from '../../services/recipeService'
import { useRecipeStore } from '../../store/recipeStore'
import RecipeEditView from './RecipeEditView.vue'

const mockedLoadRecipe = vi.mocked(recipeService.loadRecipe)
const mockedUpdateRecipe = vi.mocked(recipeService.updateRecipe)

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
  nutrition: null,
  createdAt: '2026-01-01T10:00:00.000Z',
  updatedAt: '2026-01-01T10:00:00.000Z',
  createdBy: '0123456789abcdef01234567',
  isPublic: true,
  status: 'public',
}

function mountView(userId: string = RECIPE.createdBy) {
  const pinia = createPinia()

  setActivePinia(pinia)

  const authStore = useAuthStore()

  authStore.user = { id: userId } as User

  return {
    wrapper: mount(RecipeEditView, {
      global: { plugins: [pinia, i18n] },
    }),
    store: useRecipeStore(),
  }
}

describe('RecipeEditView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    routeMock.params.id = 'recipe-1'
    mockedLoadRecipe.mockResolvedValue(RECIPE)
  })

  it('lädt das Rezept und befüllt das Formular', async () => {
    const { wrapper } = mountView()

    await flushPromises()

    expect(mockedLoadRecipe).toHaveBeenCalledWith('recipe-1')
    expect((wrapper.find('#recipe-title').element as HTMLInputElement).value).toBe('Lasagne')
    expect((wrapper.find('#recipe-tags').element as HTMLInputElement).value).toBe('Ofen')
  })

  it('speichert Änderungen und navigiert zur Detailansicht', async () => {
    const { wrapper, store } = mountView()

    await flushPromises()

    store.form.title = 'Neue Lasagne'
    mockedUpdateRecipe.mockResolvedValue({ ...RECIPE, title: 'Neue Lasagne' })

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(mockedUpdateRecipe).toHaveBeenCalledWith(
      'recipe-1',
      expect.objectContaining({ title: 'Neue Lasagne' }),
    )
    expect(pushMock).toHaveBeenCalledWith({
      name: 'recipe-detail',
      params: { id: 'recipe-1' },
    })
  })

  it('zeigt einen Validierungsfehler beim leeren Titel', async () => {
    const { wrapper, store } = mountView()

    await flushPromises()

    store.form.title = ''

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(mockedUpdateRecipe).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain(i18n.global.t('recipe.errors.titleRequired'))
  })

  it('zeigt einen Ladefehler', async () => {
    mockedLoadRecipe.mockRejectedValue({ status: 404 })

    const { wrapper } = mountView()

    await flushPromises()

    expect(wrapper.text()).toContain(i18n.global.t('recipe.errors.notFound'))
    expect(wrapper.find('form').exists()).toBe(false)
  })

  it('verhindert das Bearbeiten fremder Rezepte', async () => {
    const { wrapper } = mountView('ffffffffffffffffffffffff')

    await flushPromises()

    expect(wrapper.text()).toContain(i18n.global.t('recipe.edit.forbidden'))
    expect(wrapper.find('form').exists()).toBe(false)
  })
})
