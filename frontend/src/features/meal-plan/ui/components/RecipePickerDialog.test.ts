import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

vi.mock('@/features/recipe/services/recipeService', () => ({
  loadRecipeTags: vi.fn(),
  searchRecipes: vi.fn(),
}))

import type { RecipeSummary } from '@/shared/api/types'
import i18n from '@/app/i18n'
import * as recipeService from '@/features/recipe/services/recipeService'
import RecipePickerDialog from './RecipePickerDialog.vue'

const mockedSearchRecipes = vi.mocked(recipeService.searchRecipes)
const mockedLoadRecipeTags = vi.mocked(recipeService.loadRecipeTags)

const RECIPE: RecipeSummary = {
  id: '0123456789abcdef01234567',
  title: 'Lasagne',
  imageUrl: null,
  category: null,
  cuisine: null,
  difficulty: 'easy',
  prepTime: 10,
  cookTime: 20,
  restTime: null,
  tags: ['Vegetarisch'],
  status: 'public',
}

const SECOND_RECIPE: RecipeSummary = {
  ...RECIPE,
  id: 'fedcba9876543210fedcba98',
  title: 'Tomatensuppe',
}

function mountDialog() {
  return mount(RecipePickerDialog, {
    props: {
      open: true,
      title: 'Rezept auswählen',
    },
    global: {
      plugins: [i18n],
    },
  })
}

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute('open', '')
  }

  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
})

describe('RecipePickerDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockedSearchRecipes.mockResolvedValue({ items: [RECIPE], nextOffset: null })
    mockedLoadRecipeTags.mockResolvedValue(['Vegetarisch', 'Schnell'])
  })

  it('zeigt Suchergebnisse und Tags', async () => {
    const wrapper = mountDialog()

    await flushPromises()

    expect(wrapper.findAll('.result-button')).toHaveLength(1)
    expect(wrapper.text()).toContain(RECIPE.title)
    expect(wrapper.findAll('.tag-chip')).toHaveLength(2)
  })

  it('lädt beim Scrollen die nächsten zehn Ergebnisse nach', async () => {
    mockedSearchRecipes
      .mockResolvedValueOnce({ items: [RECIPE], nextOffset: 10 })
      .mockResolvedValueOnce({ items: [SECOND_RECIPE], nextOffset: null })

    const wrapper = mountDialog()

    await flushPromises()

    expect(wrapper.findAll('.result-button')).toHaveLength(1)

    await wrapper.find('.result-list').trigger('scroll')
    await flushPromises()

    expect(mockedSearchRecipes).toHaveBeenLastCalledWith(
      { query: '', tags: [], offset: 10 },
      expect.any(AbortSignal),
    )
    expect(wrapper.findAll('.result-button')).toHaveLength(2)
  })

  it('gibt die ausgewählte Zusammenfassung weiter', async () => {
    const wrapper = mountDialog()

    await flushPromises()

    await wrapper.find('.result-button').trigger('click')

    expect(wrapper.emitted('select')).toEqual([[RECIPE]])
  })

  it('filtert beim Klick auf einen Tag', async () => {
    const wrapper = mountDialog()

    await flushPromises()

    const tag = wrapper.findAll('.tag-chip')[0]!

    await tag.trigger('click')
    await flushPromises()

    expect(mockedSearchRecipes).toHaveBeenLastCalledWith(
      { query: '', tags: ['Vegetarisch'], offset: 0 },
      expect.any(AbortSignal),
    )
  })

  it('zeigt einen Leerzustand', async () => {
    mockedSearchRecipes.mockResolvedValue({ items: [], nextOffset: null })

    const wrapper = mountDialog()

    await flushPromises()

    expect(wrapper.text()).toContain(i18n.global.t('mealPlan.picker.noResults'))
  })

  it('schließt den Dialog', async () => {
    const wrapper = mountDialog()

    await flushPromises()

    await wrapper.find('.close-button').trigger('click')

    expect(wrapper.emitted('close')).toHaveLength(1)
  })
})
