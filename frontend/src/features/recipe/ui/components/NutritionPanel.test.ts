import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import i18n from '@/app/i18n'
import type { RecipeNutrition } from '@/shared/api/types'
import NutritionPanel from './NutritionPanel.vue'

const NUTRITION: RecipeNutrition = {
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
  matchedIngredients: 3,
  totalIngredients: 4,
  unmatchedIngredients: ['Testei'],
}

function mountPanel(nutrition: RecipeNutrition = NUTRITION) {
  return mount(NutritionPanel, {
    props: { nutrition },
    global: { plugins: [i18n] },
  })
}

describe('NutritionPanel', () => {
  it('zeigt standardmäßig die Nährwerte pro Portion', () => {
    const wrapper = mountPanel()

    expect(wrapper.text()).toContain(i18n.global.t('recipe.nutrition.title'))
    expect(wrapper.text()).toContain(i18n.global.t('recipe.nutrition.calories'))
    expect(wrapper.find('.calorie-value').text()).toBe('291')
    expect(wrapper.text()).toContain('5,9')
  })

  it('schaltet auf die Gesamtwerte um', async () => {
    const wrapper = mountPanel()

    await wrapper.findAll('.basis-button')[1]!.trigger('click')

    expect(wrapper.find('.calorie-value').text()).toBe('1.164')
    expect(wrapper.text()).toContain('23,4')
  })

  it('zeigt die Abdeckung und nicht berücksichtigte Zutaten', () => {
    const wrapper = mountPanel()

    expect(wrapper.text()).toContain(
      i18n.global.t('recipe.nutrition.coverage', { matched: 3, total: 4 }),
    )
    expect(wrapper.text()).toContain(
      i18n.global.t('recipe.nutrition.unmatched', { ingredients: 'Testei' }),
    )
  })

  it('zeigt einen vollständigen Hinweis ohne fehlende Zutaten', () => {
    const wrapper = mountPanel({
      ...NUTRITION,
      matchedIngredients: 4,
      unmatchedIngredients: [],
    })

    expect(wrapper.text()).toContain(i18n.global.t('recipe.nutrition.complete'))
    expect(wrapper.text()).not.toContain(
      i18n.global.t('recipe.nutrition.coverage', {
        matched: 4,
        total: 4,
      }),
    )
  })
})
