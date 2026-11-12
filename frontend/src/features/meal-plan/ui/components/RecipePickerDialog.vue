<script setup lang="ts">
import { nextTick, onMounted, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import type { RecipeSummary } from '@/shared/api/types'
import { Button } from '@/shared/components'
import { useRecipeSearch } from '../composables/useRecipeSearch'

const props = defineProps<{
  open: boolean
  title: string
}>()

const emit = defineEmits<{
  close: []
  select: [recipe: RecipeSummary]
}>()

const { t } = useI18n()
const dialogRef = useTemplateRef<HTMLDialogElement>('dialog')
const searchInput = useTemplateRef<HTMLInputElement>('searchInput')

const {
  query,
  selectedTags,
  items,
  nextOffset,
  loading,
  loadingMore,
  errorKey,
  availableTags,
  tagsLoading,
  tagsErrorKey,
  setQuery,
  isTagSelected,
  toggleTag,
  clearTags,
  loadMore,
  start,
  stop,
} = useRecipeSearch()

function totalMinutes(recipe: RecipeSummary): number {
  return recipe.prepTime + recipe.cookTime + (recipe.restTime ?? 0)
}

function onSearchInput(event: Event): void {
  setQuery((event.target as HTMLInputElement).value)
}

function onScroll(event: Event): void {
  const element = event.target as HTMLElement

  if (element.scrollTop + element.clientHeight >= element.scrollHeight - 80) {
    void loadMore()
  }
}

function onLoadMore(): void {
  void loadMore()
}

function selectRecipe(recipe: RecipeSummary): void {
  emit('select', recipe)
}

function close(): void {
  if (dialogRef.value?.open) {
    dialogRef.value.close()
    return
  }

  emit('close')
}

function onNativeClose(): void {
  stop()
  emit('close')
}

function onBackdropClick(event: MouseEvent): void {
  if (event.target === dialogRef.value) {
    close()
  }
}

function openDialog(): void {
  if (!dialogRef.value) {
    return
  }

  if (!dialogRef.value.open) {
    if (typeof dialogRef.value.showModal === 'function') {
      dialogRef.value.showModal()
    } else {
      dialogRef.value.setAttribute('open', '')
    }
  }

  start()
  void nextTick(() => searchInput.value?.focus())
}

function closeDialog(): void {
  if (!dialogRef.value) {
    return
  }

  if (dialogRef.value.open) {
    if (typeof dialogRef.value.close === 'function') {
      dialogRef.value.close()
    } else {
      dialogRef.value.removeAttribute('open')
      onNativeClose()
    }
    return
  }

  stop()
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      openDialog()
    } else {
      closeDialog()
    }
  },
  { flush: 'post' },
)

onMounted(() => {
  if (props.open) {
    openDialog()
  }
})
</script>

<template>
  <dialog
    ref="dialog"
    class="recipe-picker-dialog"
    aria-labelledby="recipe-picker-title"
    @cancel.prevent="close"
    @close="onNativeClose"
    @click="onBackdropClick"
  >
    <div class="picker-panel">
      <header class="picker-header">
        <h2 id="recipe-picker-title" class="picker-title">{{ title }}</h2>
        <button
          type="button"
          class="close-button"
          :aria-label="t('mealPlan.picker.close')"
          @click="close"
        >
          ×
        </button>
      </header>

      <div class="search-field">
        <label class="search-label" for="recipe-picker-search">
          {{ t('mealPlan.picker.searchLabel') }}
        </label>
        <input
          id="recipe-picker-search"
          ref="searchInput"
          class="search-input"
          type="search"
          :value="query"
          :placeholder="t('mealPlan.picker.searchPlaceholder')"
          @input="onSearchInput"
        />
      </div>

      <fieldset class="tag-filter">
        <legend class="tag-legend">{{ t('mealPlan.picker.tagsLabel') }}</legend>

        <p v-if="tagsLoading" class="status">{{ t('mealPlan.picker.tagsLoading') }}</p>
        <p v-else-if="tagsErrorKey" class="alert" role="alert">{{ t(tagsErrorKey) }}</p>
        <div v-else class="tag-filter-body">
          <div class="tag-list">
            <button
              v-for="tag in availableTags"
              :key="tag"
              type="button"
              class="tag-chip"
              :class="{ 'tag-chip--selected': isTagSelected(tag) }"
              :aria-pressed="isTagSelected(tag)"
              @click="toggleTag(tag)"
            >
              {{ tag }}
            </button>
          </div>
          <button
            v-if="selectedTags.length > 0"
            type="button"
            class="clear-tags"
            @click="clearTags"
          >
            {{ t('mealPlan.picker.clearTags') }}
          </button>
        </div>
      </fieldset>

      <p v-if="errorKey" class="alert" role="alert">{{ t(errorKey) }}</p>
      <p v-if="loading" class="status" role="status">{{ t('mealPlan.picker.loading') }}</p>

      <ul v-if="!loading && items.length > 0" class="result-list" @scroll.passive="onScroll">
        <li v-for="recipe in items" :key="recipe.id" class="result-item">
          <button type="button" class="result-button" @click="selectRecipe(recipe)">
            <span class="result-main">
              <span class="result-title">{{ recipe.title }}</span>
              <span class="result-meta">
                <span class="result-time">
                  {{ t('mealPlan.picker.minutes', { minutes: totalMinutes(recipe) }) }}
                </span>
                <span v-for="tag in recipe.tags" :key="tag" class="result-tag">{{ tag }}</span>
              </span>
            </span>

            <span v-if="recipe.imageUrl" class="result-image">
              <img :src="recipe.imageUrl" :alt="recipe.title" />
            </span>
          </button>
        </li>
      </ul>

      <p v-if="!loading && items.length === 0 && !errorKey" class="empty" role="status">
        {{ t('mealPlan.picker.noResults') }}
      </p>
      <Button
        v-if="nextOffset !== null && !loading && !loadingMore"
        severity="secondary"
        :label="t('mealPlan.picker.loadMore')"
        @click="onLoadMore"
      />
      <p v-if="loadingMore" class="status" role="status">
        {{ t('mealPlan.picker.loadingMore') }}
      </p>
      <p v-else-if="nextOffset === null && items.length > 0" class="status">
        {{ t('mealPlan.picker.allLoaded') }}
      </p>
    </div>
  </dialog>
</template>

<style scoped>
.recipe-picker-dialog {
  width: min(44rem, calc(100vw - 2rem));
  max-height: min(80vh, 50rem);
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background-color: var(--color-surface);
  color: var(--color-text);
  box-shadow: var(--shadow-lg);
}

.recipe-picker-dialog::backdrop {
  background-color: rgb(0 0 0 / 45%);
}

.picker-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  max-height: min(80vh, 50rem);
  padding: var(--space-lg);
}

.picker-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-md);
}

.picker-title {
  margin: 0;
  font-size: var(--font-size-lg);
}

.close-button {
  display: grid;
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
  place-items: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  background-color: var(--color-surface);
  color: var(--color-text-muted);
  font-size: var(--font-size-lg);
  line-height: 1;
  cursor: pointer;
}

.close-button:hover {
  background-color: var(--color-bg-muted);
  color: var(--color-text);
}

.search-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.search-label,
.tag-legend {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.search-input {
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
  color: var(--color-text);
  font: inherit;
}

.search-input:focus {
  border-color: var(--color-primary);
  outline: 3px solid color-mix(in srgb, var(--color-focus) 22%, transparent);
}

.tag-filter {
  margin: 0;
  padding: 0;
  border: 0;
}

.tag-legend {
  margin-bottom: var(--space-xs);
}

.tag-filter-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
  max-height: 7rem;
  overflow-y: auto;
}

.tag-chip,
.clear-tags {
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  cursor: pointer;
}

.tag-chip {
  border: 1px solid var(--color-border-strong);
  background-color: var(--color-surface);
  color: var(--color-text-muted);
}

.tag-chip:hover {
  background-color: var(--color-bg-muted);
}

.tag-chip--selected {
  border-color: var(--color-primary);
  background-color: var(--color-primary-soft);
  color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
}

.clear-tags {
  border: 1px solid transparent;
  background-color: transparent;
  color: var(--color-primary);
  text-decoration: underline;
}

.result-list {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--space-sm);
  min-height: 12rem;
  max-height: 24rem;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  list-style: none;
}

.result-item {
  display: flex;
}

.result-button {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  padding: var(--space-sm) var(--space-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.result-button:hover {
  border-color: var(--color-primary);
  background-color: var(--color-primary-soft);
}

.result-main {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.result-title {
  font-weight: var(--font-weight-semibold);
}

.result-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-xs);
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
}

.result-tag {
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-full);
  background-color: var(--color-bg-muted);
  color: var(--color-text-muted);
}

.result-image {
  width: 4rem;
  height: 3rem;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: var(--radius-sm);
}

.result-image img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
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

.empty {
  margin: 0;
  padding: var(--space-lg);
  border: 1px dashed var(--color-border-strong);
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  text-align: center;
}
</style>
