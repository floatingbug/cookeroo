import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import i18n from '@/app/i18n'
import type { Recipe } from '@/shared/api/types'
import RecipeCard from './RecipeCard.vue'

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
  restTime: 5,
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

describe('RecipeCard', () => {
  it('zeigt die Rezeptdaten und Metadaten', () => {
    const wrapper = mount(RecipeCard, {
      props: { recipe: RECIPE },
      global: {
        plugins: [i18n],
        stubs: { RouterLink: RouterLinkStub },
      },
    })

    expect(wrapper.text()).toContain('Lasagne')
    expect(wrapper.text()).toContain('Ein Klassiker.')
    expect(wrapper.text()).toContain(i18n.global.t('recipe.status.public'))
    expect(wrapper.text()).toContain(i18n.global.t('recipe.difficulty.medium'))
    expect(wrapper.text()).toContain('65')
    expect(wrapper.text()).toContain('4')
  })

  it('verlangt vor dem Löschen eine Bestätigung', async () => {
    const wrapper = mount(RecipeCard, {
      props: { recipe: RECIPE },
      global: {
        plugins: [i18n],
        stubs: { RouterLink: RouterLinkStub },
      },
    })

    const deleteButton = wrapper
      .findAll('button')
      .find((button) => button.text() === i18n.global.t('recipe.actions.delete'))

    expect(deleteButton).toBeDefined()

    await deleteButton!.trigger('click')

    expect(wrapper.text()).toContain(i18n.global.t('recipe.actions.deleteConfirmTitle'))
    expect(wrapper.emitted('delete')).toBeUndefined()

    const confirmButton = wrapper
      .findAll('button')
      .find((button) => button.text() === i18n.global.t('recipe.actions.deleteConfirm'))

    await confirmButton!.trigger('click')

    expect(wrapper.emitted('delete')).toHaveLength(1)
  })

  it('blendet die Löschaktion aus, wenn das Rezept nicht löschbar ist', () => {
    const wrapper = mount(RecipeCard, {
      props: { recipe: RECIPE, deletable: false },
      global: {
        plugins: [i18n],
        stubs: { RouterLink: RouterLinkStub },
      },
    })

    expect(wrapper.findAll('button')).toHaveLength(0)
  })
})
