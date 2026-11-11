import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
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
    createRecipe: vi.fn(),
    uploadImage: vi.fn(),
  }
})

import type { Recipe } from '@/shared/api/types'
import i18n from '@/app/i18n'
import * as recipeService from '../../services/recipeService'
import { useRecipeStore } from '../../store/recipeStore'
import RecipeCreateView from './RecipeCreateView.vue'

const mockedCreateRecipe = vi.mocked(recipeService.createRecipe)
const mockedUploadImage = vi.mocked(recipeService.uploadImage)

const RECIPE = { id: 'recipe-1', title: 'Testrezept' } as Recipe

async function mountView(): Promise<{
  wrapper: VueWrapper
  store: ReturnType<typeof useRecipeStore>
}> {
  const pinia = createPinia()

  setActivePinia(pinia)

  const wrapper = mount(RecipeCreateView, {
    global: { plugins: [pinia, i18n] },
  })

  // onMounted ersetzt das Formular (neue Zutaten-Keys); DOM-Aktualisierung abwarten.
  await nextTick()

  return { wrapper, store: useRecipeStore() }
}

function fillRequiredFields(store: ReturnType<typeof useRecipeStore>): void {
  store.form.title = 'Testrezept'
  store.form.prepTime = '10'
  store.form.cookTime = '20'
  store.form.servings = '2'
  store.form.ingredients[0]!.name = 'Mehl'
  store.form.ingredients[0]!.quantity = '200'
  store.form.instructions[0]!.description = 'Alles mischen.'
}

describe('RecipeCreateView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('zeigt einen Validierungsfehler beim leeren Absenden', async () => {
    const { wrapper } = await mountView()

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(mockedCreateRecipe).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain(i18n.global.t('recipe.errors.titleRequired'))
  })

  it('speichert ein gültiges Rezept und navigiert zur Detailansicht', async () => {
    const { wrapper, store } = await mountView()

    fillRequiredFields(store)
    mockedCreateRecipe.mockResolvedValue(RECIPE)

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(mockedCreateRecipe).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Testrezept', servings: 2 }),
    )
    expect(pushMock).toHaveBeenCalledWith({
      name: 'recipe-detail',
      params: { id: 'recipe-1' },
    })
  })

  it('fügt Zutatenzeilen hinzu', async () => {
    const { wrapper } = await mountView()

    expect(wrapper.findAll('input[id^="ingredient-name-"]')).toHaveLength(1)

    const addButton = wrapper
      .findAll('button')
      .find((button) => button.text() === i18n.global.t('recipe.actions.addIngredient'))

    expect(addButton).toBeDefined()
    await addButton!.trigger('click')

    expect(wrapper.findAll('input[id^="ingredient-name-"]')).toHaveLength(2)
  })

  it('lädt ein Rezeptbild hoch und zeigt es an', async () => {
    const { wrapper, store } = await mountView()
    const file = new File(['abc'], 'image.png', { type: 'image/png' })
    const input = wrapper.find('#recipe-image')

    mockedUploadImage.mockResolvedValue('http://example.test/image.png')

    Object.defineProperty(input.element, 'files', {
      value: [file],
      configurable: true,
    })

    await input.trigger('change')
    await flushPromises()

    expect(mockedUploadImage).toHaveBeenCalledWith(file)
    expect(store.form.imageUrl).toBe('http://example.test/image.png')
    expect(wrapper.find('img').attributes('src')).toBe('http://example.test/image.png')
  })
})
