<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { Button, Checkbox, Input, Select } from '@/shared/components'
import type { SelectOption } from '@/shared/components'
import { INGREDIENT_UNITS } from '../../constants'
import type { IngredientForm } from '../../types'

const props = defineProps<{
  ingredients: IngredientForm[]
  loading: boolean
}>()

const emit = defineEmits<{
  add: []
  remove: [key: string]
}>()

const { t } = useI18n()

const unitOptions = computed<SelectOption[]>(() =>
  INGREDIENT_UNITS.map((unit) => ({ value: unit, label: t(`recipe.units.${unit}`) })),
)
</script>

<template>
  <section class="section">
    <div class="section-header">
      <h2 class="section-title">{{ t('recipe.create.sections.ingredients') }}</h2>
      <Button
        severity="secondary"
        :label="t('recipe.actions.addIngredient')"
        :disabled="props.loading"
        @click="emit('add')"
      />
    </div>

    <fieldset v-for="(ingredient, index) in props.ingredients" :key="ingredient.key" class="entry">
      <legend class="entry-title">
        {{ t('recipe.fields.ingredientIndex', { index: index + 1 }) }}
      </legend>

      <div class="grid">
        <Input
          :id="`ingredient-name-${ingredient.key}`"
          v-model="ingredient.name"
          :label="t('recipe.fields.name')"
          required
          :disabled="props.loading"
        />
        <Input
          :id="`ingredient-quantity-${ingredient.key}`"
          v-model="ingredient.quantity"
          type="number"
          :label="t('recipe.fields.quantity')"
          required
          :disabled="props.loading"
        />
        <Select
          :id="`ingredient-unit-${ingredient.key}`"
          v-model="ingredient.unit"
          :label="t('recipe.fields.unit')"
          :options="unitOptions"
          required
          :disabled="props.loading"
        />
        <Input
          :id="`ingredient-note-${ingredient.key}`"
          v-model="ingredient.note"
          :label="t('recipe.fields.note')"
          :disabled="props.loading"
        />
      </div>

      <div class="entry-actions">
        <Checkbox
          :id="`ingredient-optional-${ingredient.key}`"
          v-model="ingredient.isOptional"
          :label="t('recipe.fields.isOptional')"
          :disabled="props.loading"
        />
        <Button
          severity="secondary"
          :label="t('recipe.actions.removeIngredient')"
          :disabled="props.loading || props.ingredients.length <= 1"
          @click="emit('remove', ingredient.key)"
        />
      </div>
    </fieldset>
  </section>
</template>

<style scoped>
.section {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  padding: var(--space-lg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background-color: var(--color-surface);
  box-shadow: var(--shadow-sm);
}

.section-title {
  margin: 0;
  font-size: var(--font-size-lg);
  color: var(--color-primary);
}

.section-header,
.entry-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
}

.entry {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  padding: var(--space-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-bg);
}

.entry-title {
  margin: 0;
  padding: 0 var(--space-xs);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--space-md);
}
</style>
