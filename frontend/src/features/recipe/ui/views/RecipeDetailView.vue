<script setup lang="ts">
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'

import type { RecipeIngredient, RecipeInstruction } from '@/shared/api/types'
import { useRecipeStore } from '../../store/recipeStore'

const { t, locale } = useI18n()
const route = useRoute()
const store = useRecipeStore()
const { recipe, loading, errorKey } = storeToRefs(store)

const numberFormatter = computed(
  () =>
    new Intl.NumberFormat(locale.value, {
      maximumFractionDigits: 2,
    }),
)

const dateFormatter = computed(
  () =>
    new Intl.DateTimeFormat(locale.value, {
      dateStyle: 'medium',
    }),
)

watch(
  () => route.params.id,
  (id) => {
    if (typeof id === 'string' && id !== '') {
      void store.loadRecipe(id)
    }
  },
  { immediate: true },
)

function formatUnit(unit: RecipeIngredient['unit']): string {
  return t(`recipe.units.${unit}`)
}

function formatDifficulty(difficulty: string | null): string {
  return difficulty === null ? t('recipe.difficulty.none') : t(`recipe.difficulty.${difficulty}`)
}

function formatQuantity(quantity: number): string {
  return numberFormatter.value.format(quantity)
}

function formatStepDuration(instruction: RecipeInstruction): string {
  return instruction.duration === null
    ? ''
    : t('recipe.detail.stepDuration', { minutes: instruction.duration })
}

function formatDate(value: string): string {
  return dateFormatter.value.format(new Date(value))
}
</script>

<template>
  <main class="recipe-detail-view">
    <p v-if="loading" class="status" role="status">{{ t('recipe.detail.loading') }}</p>
    <p v-else-if="errorKey" class="alert" role="alert">{{ t(errorKey) }}</p>

    <article v-else-if="recipe" class="recipe">
      <header class="header">
        <img v-if="recipe.imageUrl" :src="recipe.imageUrl" :alt="recipe.title" class="image" />
        <div class="header-content">
          <div class="badges">
            <span class="badge">{{ t(`recipe.status.${recipe.status}`) }}</span>
            <span v-if="recipe.category" class="badge">{{ recipe.category }}</span>
            <span v-if="recipe.cuisine" class="badge">{{ recipe.cuisine }}</span>
            <span class="badge">{{ formatDifficulty(recipe.difficulty) }}</span>
          </div>

          <h1 class="title">{{ recipe.title }}</h1>
          <p v-if="recipe.description" class="description">{{ recipe.description }}</p>

          <dl class="facts">
            <div class="fact">
              <dt>{{ t('recipe.fields.prepTime') }}</dt>
              <dd>{{ recipe.prepTime }} {{ t('recipe.detail.minutes') }}</dd>
            </div>
            <div class="fact">
              <dt>{{ t('recipe.fields.cookTime') }}</dt>
              <dd>{{ recipe.cookTime }} {{ t('recipe.detail.minutes') }}</dd>
            </div>
            <div v-if="recipe.restTime !== null" class="fact">
              <dt>{{ t('recipe.fields.restTime') }}</dt>
              <dd>{{ recipe.restTime }} {{ t('recipe.detail.minutes') }}</dd>
            </div>
            <div class="fact">
              <dt>{{ t('recipe.fields.servings') }}</dt>
              <dd>
                {{ recipe.servings }}
                {{ recipe.servingUnit ?? t('recipe.fields.servingsUnitFallback') }}
              </dd>
            </div>
            <div class="fact">
              <dt>{{ t('recipe.detail.createdAt') }}</dt>
              <dd>{{ formatDate(recipe.createdAt) }}</dd>
            </div>
          </dl>

          <ul v-if="recipe.tags.length > 0" class="tags">
            <li v-for="tag in recipe.tags" :key="tag" class="tag">{{ tag }}</li>
          </ul>
        </div>
      </header>

      <section class="section">
        <h2 class="section-title">{{ t('recipe.create.sections.ingredients') }}</h2>
        <ul class="ingredients">
          <li v-for="(ingredient, index) in recipe.ingredients" :key="index" class="ingredient">
            <span class="ingredient-quantity">
              {{ formatQuantity(ingredient.quantity) }} {{ formatUnit(ingredient.unit) }}
            </span>
            <span class="ingredient-name">{{ ingredient.name }}</span>
            <span v-if="ingredient.isOptional" class="ingredient-optional">
              {{ t('recipe.detail.optional') }}
            </span>
            <span v-if="ingredient.note" class="ingredient-note">{{ ingredient.note }}</span>
          </li>
        </ul>
      </section>

      <section class="section">
        <h2 class="section-title">{{ t('recipe.create.sections.instructions') }}</h2>
        <ol class="steps">
          <li v-for="instruction in recipe.instructions" :key="instruction.step" class="step">
            <div class="step-header">
              <h3 class="step-title">
                {{ t('recipe.fields.step', { step: instruction.step }) }}
              </h3>
              <span v-if="instruction.duration !== null" class="step-duration">
                {{ formatStepDuration(instruction) }}
              </span>
            </div>
            <p class="step-description">{{ instruction.description }}</p>
            <img
              v-if="instruction.imageUrl"
              :src="instruction.imageUrl"
              :alt="t('recipe.fields.step', { step: instruction.step })"
              class="step-image"
            />
          </li>
        </ol>
      </section>
    </article>
  </main>
</template>

<style scoped>
.recipe-detail-view {
  width: 100%;
  max-width: var(--content-max-width);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.status {
  margin: 0;
  color: var(--color-text-muted);
}

.alert {
  margin: 0;
  padding: var(--space-sm) var(--space-md);
  border: 1px solid var(--color-danger);
  border-radius: var(--radius-md);
  background-color: color-mix(in srgb, var(--color-danger) 8%, transparent);
  color: var(--color-danger);
}

.recipe {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.header {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.image {
  width: 100%;
  max-height: 360px;
  object-fit: cover;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.badges,
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
  margin: 0;
  padding: 0;
  list-style: none;
}

.badge,
.tag {
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-full);
  background-color: var(--color-primary-soft);
  color: var(--color-primary);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
}

.tag {
  background-color: var(--color-accent-soft);
  color: var(--color-accent);
}

.title {
  margin: 0;
}

.description {
  margin: 0;
  max-width: 70ch;
  color: var(--color-text-muted);
}

.facts {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md);
  margin: 0;
  padding: var(--space-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-bg-muted);
}

.fact {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  font-size: var(--font-size-sm);
}

.fact dt {
  color: var(--color-text-muted);
}

.fact dd {
  margin: 0;
  font-weight: var(--font-weight-medium);
}

.section {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.section-title {
  margin: 0;
  font-size: var(--font-size-lg);
}

.ingredients,
.steps {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  margin: 0;
  padding: 0;
  list-style: none;
}

.ingredient {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--space-xs);
  padding: var(--space-sm) 0;
  border-bottom: 1px solid var(--color-border);
}

.ingredient-quantity {
  min-width: 100px;
  font-weight: var(--font-weight-medium);
}

.ingredient-optional {
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
}

.ingredient-note {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.step {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  padding: var(--space-sm) 0;
  border-bottom: 1px solid var(--color-border);
}

.step-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-sm);
}

.step-title,
.step-description {
  margin: 0;
}

.step-title {
  color: var(--color-primary);
}

.step-duration {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.step-description {
  white-space: pre-line;
}

.step-image {
  width: 100%;
  max-width: 360px;
  border-radius: var(--radius-md);
}

@media (min-width: 768px) {
  .header {
    flex-direction: row;
    align-items: flex-start;
  }

  .image {
    width: 40%;
  }

  .header-content {
    flex: 1;
  }
}
</style>
