<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'

import type { RecipeNutrition } from '@/shared/api/types'

type NutritionBasis = 'perServing' | 'total'

const props = defineProps<{
  nutrition: RecipeNutrition
}>()

const { t, locale } = useI18n()

const basis = shallowRef<NutritionBasis>('perServing')

const values = computed(() => props.nutrition[basis.value])

const numberFormatter = computed(
  () =>
    new Intl.NumberFormat(locale.value, {
      maximumFractionDigits: 2,
    }),
)

const calorieFormatter = computed(
  () =>
    new Intl.NumberFormat(locale.value, {
      maximumFractionDigits: 0,
    }),
)

const nutrientRows = computed(() => [
  {
    key: 'protein',
    label: t('recipe.nutrition.protein'),
    value: numberFormatter.value.format(values.value.protein),
  },
  {
    key: 'fat',
    label: t('recipe.nutrition.fat'),
    value: numberFormatter.value.format(values.value.fat),
  },
  {
    key: 'carbohydrates',
    label: t('recipe.nutrition.carbohydrates'),
    value: numberFormatter.value.format(values.value.carbohydrates),
  },
  {
    key: 'fiber',
    label: t('recipe.nutrition.fiber'),
    value: numberFormatter.value.format(values.value.fiber),
  },
  {
    key: 'sugar',
    label: t('recipe.nutrition.sugar'),
    value: numberFormatter.value.format(values.value.sugar),
  },
  {
    key: 'salt',
    label: t('recipe.nutrition.salt'),
    value: numberFormatter.value.format(values.value.salt),
  },
])

const isComplete = computed(() => props.nutrition.unmatchedIngredients.length === 0)

const unmatchedIngredients = computed(() => props.nutrition.unmatchedIngredients.join(', '))

function selectBasis(next: NutritionBasis): void {
  basis.value = next
}
</script>

<template>
  <section class="nutrition" aria-labelledby="nutrition-title">
    <div class="nutrition-header">
      <h2 id="nutrition-title" class="nutrition-title">{{ t('recipe.nutrition.title') }}</h2>

      <div class="basis-toggle" role="group" :aria-label="t('recipe.nutrition.title')">
        <button
          type="button"
          class="basis-button"
          :class="{ 'basis-button-active': basis === 'perServing' }"
          :aria-pressed="basis === 'perServing'"
          @click="selectBasis('perServing')"
        >
          {{ t('recipe.nutrition.perServing') }}
        </button>
        <button
          type="button"
          class="basis-button"
          :class="{ 'basis-button-active': basis === 'total' }"
          :aria-pressed="basis === 'total'"
          @click="selectBasis('total')"
        >
          {{ t('recipe.nutrition.total') }}
        </button>
      </div>
    </div>

    <div class="nutrition-summary">
      <div class="calorie-card">
        <span class="calorie-value">{{ calorieFormatter.format(values.calories) }}</span>
        <span class="calorie-unit">{{ t('recipe.nutrition.kcal') }}</span>
        <span class="calorie-label">{{ t('recipe.nutrition.calories') }}</span>
      </div>

      <dl class="nutrient-grid">
        <div v-for="row in nutrientRows" :key="row.key" class="nutrient-row">
          <dt class="nutrient-label">{{ row.label }}</dt>
          <dd class="nutrient-value">{{ row.value }} {{ t('recipe.nutrition.gram') }}</dd>
        </div>
      </dl>
    </div>

    <p class="coverage">
      <template v-if="isComplete">{{ t('recipe.nutrition.complete') }}</template>
      <template v-else>
        {{
          t('recipe.nutrition.coverage', {
            matched: nutrition.matchedIngredients,
            total: nutrition.totalIngredients,
          })
        }}
        {{ t('recipe.nutrition.unmatched', { ingredients: unmatchedIngredients }) }}
      </template>
    </p>
  </section>
</template>

<style scoped>
.nutrition {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  padding: var(--space-lg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background-color: var(--color-surface);
  box-shadow: var(--shadow-sm);
}

.nutrition-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
}

.nutrition-title {
  margin: 0;
  font-size: var(--font-size-lg);
  color: var(--color-primary);
}

.basis-toggle {
  display: inline-flex;
  padding: 2px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  background-color: var(--color-bg-muted);
}

.basis-button {
  padding: var(--space-xs) var(--space-sm);
  border: 0;
  border-radius: var(--radius-full);
  background-color: transparent;
  color: var(--color-text-muted);
  font: inherit;
  font-size: var(--font-size-sm);
  cursor: pointer;
}

.basis-button-active {
  background-color: var(--color-surface);
  color: var(--color-primary);
  font-weight: var(--font-weight-medium);
  box-shadow: var(--shadow-sm);
}

.nutrition-summary {
  display: grid;
  grid-template-columns: minmax(140px, 0.9fr) 2fr;
  gap: var(--space-md);
}

.calorie-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  padding: var(--space-md);
  border-radius: var(--radius-md);
  background-color: var(--color-primary-soft);
  color: var(--color-primary);
  text-align: center;
}

.calorie-value {
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-bold);
  line-height: 1;
}

.calorie-unit {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.calorie-label {
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.nutrient-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: var(--space-sm);
  margin: 0;
}

.nutrient-row {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  padding: var(--space-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-bg-muted);
}

.nutrient-label {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.nutrient-value {
  margin: 0;
  font-weight: var(--font-weight-medium);
}

.coverage {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

@media (max-width: 600px) {
  .nutrition-summary {
    grid-template-columns: 1fr;
  }
}
</style>
