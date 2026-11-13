<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'

import type { Recipe } from '@/shared/api/types'
import { Button } from '@/shared/components'

const props = withDefaults(
  defineProps<{
    recipe: Recipe
    deleting?: boolean
    deletable?: boolean
  }>(),
  {
    deleting: false,
    deletable: true,
  },
)

const emit = defineEmits<{
  delete: []
}>()

const { t } = useI18n()
const confirmingDelete = shallowRef(false)

const totalTime = computed(
  () => props.recipe.prepTime + props.recipe.cookTime + (props.recipe.restTime ?? 0),
)

const difficultyLabel = computed(() =>
  props.recipe.difficulty === null
    ? t('recipe.difficulty.none')
    : t(`recipe.difficulty.${props.recipe.difficulty}`),
)

function confirmDelete(): void {
  emit('delete')
}
</script>

<template>
  <article class="recipe-card">
    <RouterLink class="card-link" :to="{ name: 'recipe-detail', params: { id: recipe.id } }">
      <div class="card-media">
        <img v-if="recipe.imageUrl" :src="recipe.imageUrl" :alt="recipe.title" class="card-image" />
        <div v-else class="card-placeholder" aria-hidden="true">
          {{ recipe.title.slice(0, 1) }}
        </div>
      </div>

      <div class="card-body">
        <div class="card-badges">
          <span class="badge">{{ t(`recipe.status.${recipe.status}`) }}</span>
          <span v-if="recipe.category" class="badge badge-muted">{{ recipe.category }}</span>
        </div>

        <h2 class="card-title">{{ recipe.title }}</h2>
        <p v-if="recipe.description" class="card-description">{{ recipe.description }}</p>

        <dl class="card-meta">
          <div class="meta-item">
            <dt>{{ t('recipe.list.totalTime') }}</dt>
            <dd>{{ totalTime }} {{ t('recipe.detail.minutes') }}</dd>
          </div>
          <div class="meta-item">
            <dt>{{ t('recipe.fields.servings') }}</dt>
            <dd>
              {{ recipe.servings }}
              {{ recipe.servingUnit ?? t('recipe.fields.servingsUnitFallback') }}
            </dd>
          </div>
          <div class="meta-item">
            <dt>{{ t('recipe.fields.difficulty') }}</dt>
            <dd>{{ difficultyLabel }}</dd>
          </div>
        </dl>
      </div>
    </RouterLink>

    <div v-if="deletable" class="card-actions">
      <Button
        v-if="!confirmingDelete"
        severity="danger"
        :label="t('recipe.actions.delete')"
        :disabled="deleting"
        @click="confirmingDelete = true"
      />

      <div v-else class="delete-confirm">
        <p class="delete-confirm-title">{{ t('recipe.actions.deleteConfirmTitle') }}</p>
        <p class="delete-confirm-text">{{ t('recipe.actions.deleteConfirmText') }}</p>
        <div class="delete-confirm-actions">
          <Button
            severity="danger"
            :label="deleting ? t('recipe.actions.deleting') : t('recipe.actions.deleteConfirm')"
            :disabled="deleting"
            @click="confirmDelete"
          />
          <Button
            severity="secondary"
            :label="t('recipe.actions.cancel')"
            :disabled="deleting"
            @click="confirmingDelete = false"
          />
        </div>
      </div>
    </div>
  </article>
</template>

<style scoped>
.recipe-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background-color: var(--color-surface);
  box-shadow: var(--shadow-sm);
  transition:
    transform var(--duration-fast) var(--ease-standard),
    box-shadow var(--duration-fast) var(--ease-standard);
}

.recipe-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.card-link {
  display: flex;
  flex: 1;
  flex-direction: column;
  height: 100%;
  color: inherit;
  text-decoration: none;
}

.card-media {
  aspect-ratio: 16 / 9;
  background-color: var(--color-bg-muted);
}

.card-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-placeholder {
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
  background: linear-gradient(135deg, var(--color-primary-soft), var(--color-bg-muted));
  color: var(--color-primary);
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
}

.card-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--space-sm);
  padding: var(--space-md);
}

.card-badges {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}

.badge {
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-full);
  background-color: var(--color-primary-soft);
  color: var(--color-primary);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
}

.badge-muted {
  background-color: var(--color-bg-muted);
  color: var(--color-text-muted);
}

.card-title {
  margin: 0;
  font-size: var(--font-size-lg);
}

.card-description {
  display: -webkit-box;
  overflow: hidden;
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md);
  margin: auto 0 0;
  padding-top: var(--space-sm);
  border-top: 1px solid var(--color-border);
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  font-size: var(--font-size-xs);
}

.meta-item dt {
  color: var(--color-text-muted);
}

.meta-item dd {
  margin: 0;
  font-weight: var(--font-weight-medium);
}

.card-actions {
  display: flex;
  justify-content: flex-end;
  padding: var(--space-sm) var(--space-md);
  border-top: 1px solid var(--color-border);
}

.delete-confirm {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.delete-confirm-title,
.delete-confirm-text {
  margin: 0;
}

.delete-confirm-title {
  font-weight: var(--font-weight-semibold);
}

.delete-confirm-text {
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
}

.delete-confirm-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  padding-top: var(--space-xs);
}
</style>
