<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import type { MealPlanDay, MealPlanMeal } from '@/shared/api/types'
import type { MealSlotView } from '../../types'

withDefaults(
  defineProps<{
    day: MealPlanDay
    dayLabel: string
    slots: MealSlotView[]
    disabled?: boolean
  }>(),
  {
    disabled: false,
  },
)

const emit = defineEmits<{
  open: [meal: MealPlanMeal]
  remove: [meal: MealPlanMeal]
}>()

const { t } = useI18n()
</script>

<template>
  <article class="meal-day-card">
    <h2 class="day-title">{{ dayLabel }}</h2>

    <div class="slot-list">
      <div v-for="slot in slots" :key="slot.meal" class="meal-slot">
        <button
          v-if="!slot.recipeId"
          :id="`meal-${day}-${slot.meal}`"
          type="button"
          class="recipe-slot"
          :disabled="disabled"
          @click="emit('open', slot.meal)"
        >
          <span class="slot-label">{{ slot.label }}</span>
          <span class="slot-value slot-value--placeholder">
            {{ t('mealPlan.selectRecipe') }}
          </span>
        </button>

        <div
          v-else
          class="recipe-slot recipe-slot--filled"
          :class="{ 'recipe-slot--link': slot.recipeAvailable }"
        >
          <RouterLink
            v-if="slot.recipeAvailable"
            class="slot-main"
            :to="{ name: 'recipe-detail', params: { id: slot.recipeId } }"
          >
            <span class="slot-label">{{ slot.label }}</span>
            <span class="slot-recipe-title">{{ slot.recipeTitle }}</span>
          </RouterLink>

          <div v-else class="slot-main">
            <span class="slot-label">{{ slot.label }}</span>
            <span class="slot-recipe-title slot-recipe-title--unavailable">
              {{ slot.recipeTitle }}
            </span>
          </div>

          <div class="slot-actions">
            <button
              type="button"
              class="slot-action"
              :disabled="disabled"
              @click="emit('open', slot.meal)"
            >
              {{ t('mealPlan.actions.change') }}
            </button>
            <button
              type="button"
              class="slot-action slot-action--remove"
              :aria-label="t('mealPlan.actions.remove')"
              :disabled="disabled"
              @click="emit('remove', slot.meal)"
            >
              ×
            </button>
          </div>
        </div>
      </div>
    </div>
  </article>
</template>

<style scoped>
.meal-day-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  padding: var(--space-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background-color: var(--color-surface);
  box-shadow: var(--shadow-sm);
}

.day-title {
  margin: 0;
  font-size: var(--font-size-lg);
}

.slot-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.meal-slot {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.recipe-slot {
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
  color: var(--color-text);
  text-align: left;
  cursor: pointer;
}

.recipe-slot:hover:not(:disabled) {
  border-color: var(--color-primary);
  background-color: var(--color-primary-soft);
}

.recipe-slot:focus-visible {
  border-color: var(--color-primary);
  outline: 3px solid color-mix(in srgb, var(--color-focus) 22%, transparent);
}

.recipe-slot:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.recipe-slot--filled {
  position: relative;
  padding: 0;
  cursor: default;
}

.recipe-slot--link {
  transition:
    border-color var(--duration-fast) var(--ease-standard),
    background-color var(--duration-fast) var(--ease-standard);
}

.recipe-slot--link:hover {
  border-color: var(--color-primary);
  background-color: var(--color-primary-soft);
}

.slot-main {
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: var(--space-xs);
  padding: var(--space-sm) 6.5rem var(--space-sm) var(--space-md);
  color: inherit;
  text-decoration: none;
}

.slot-main:focus-visible {
  border-radius: var(--radius-md);
  outline: 3px solid color-mix(in srgb, var(--color-focus) 22%, transparent);
  outline-offset: 2px;
}

.slot-label {
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
}

.slot-value {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
}

.slot-value--placeholder {
  color: var(--color-text-muted);
  font-weight: var(--font-weight-regular);
}

.slot-recipe-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
}

.slot-recipe-title--unavailable {
  color: var(--color-text-muted);
  font-weight: var(--font-weight-regular);
}

.slot-actions {
  position: absolute;
  top: var(--space-sm);
  right: var(--space-md);
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.slot-action {
  padding: 0;
  border: 0;
  background-color: transparent;
  color: var(--color-primary);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
}

.slot-action:hover:not(:disabled) {
  text-decoration: underline;
}

.slot-action:focus-visible {
  border-radius: var(--radius-sm);
  outline: 3px solid color-mix(in srgb, var(--color-focus) 22%, transparent);
  outline-offset: 2px;
}

.slot-action:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.slot-action--remove {
  display: grid;
  width: 1.5rem;
  height: 1.5rem;
  place-items: center;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-full);
  color: var(--color-text-muted);
  font-size: var(--font-size-base);
  line-height: 1;
  text-decoration: none;
}

.slot-action--remove:hover:not(:disabled) {
  border-color: var(--color-danger);
  background-color: color-mix(in srgb, var(--color-danger) 8%, transparent);
  color: var(--color-danger);
  text-decoration: none;
}
</style>
