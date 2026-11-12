<script setup lang="ts">
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'

import { Button } from '@/shared/components'
import { useRecipeStore } from '../../store/recipeStore'
import RecipeCard from '../components/RecipeCard.vue'

const { t } = useI18n()
const router = useRouter()
const store = useRecipeStore()
const { recipes, recipesLoading, recipesErrorKey, deletingId, deleteErrorKey } = storeToRefs(store)

onMounted(() => {
  void store.loadRecipes()
})

function onCreate(): void {
  void router.push({ name: 'recipe-create' })
}

async function onDelete(recipeId: string): Promise<void> {
  await store.deleteRecipe(recipeId)
}
</script>

<template>
  <main class="recipe-list-view">
    <div class="page-header">
      <div class="header-copy">
        <h1 class="title">{{ t('recipe.list.title') }}</h1>
        <p class="description">{{ t('recipe.list.description') }}</p>
      </div>
      <Button :label="t('recipe.list.create')" @click="onCreate" />
    </div>

    <p v-if="deleteErrorKey" class="alert" role="alert">{{ t(deleteErrorKey) }}</p>
    <p v-if="recipesLoading" class="status" role="status">{{ t('recipe.list.loading') }}</p>
    <p v-else-if="recipesErrorKey" class="alert" role="alert">{{ t(recipesErrorKey) }}</p>

    <section v-else-if="recipes.length === 0" class="empty-state">
      <h2 class="empty-title">{{ t('recipe.list.empty') }}</h2>
      <p class="empty-hint">{{ t('recipe.list.emptyHint') }}</p>
      <Button :label="t('recipe.list.create')" @click="onCreate" />
    </section>

    <ul v-else class="recipe-grid">
      <li v-for="recipe in recipes" :key="recipe.id" class="recipe-grid-item">
        <RecipeCard
          :recipe="recipe"
          :deleting="deletingId === recipe.id"
          @delete="onDelete(recipe.id)"
        />
      </li>
    </ul>
  </main>
</template>

<style scoped>
.recipe-list-view {
  width: 100%;
  max-width: var(--content-max-width);
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.page-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-md);
}

.header-copy {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.title {
  margin: 0;
}

.description {
  margin: 0;
  max-width: 60ch;
  color: var(--color-text-muted);
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

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-2xl);
  border: 1px dashed var(--color-border-strong);
  border-radius: var(--radius-lg);
  background-color: var(--color-surface);
  text-align: center;
}

.empty-title,
.empty-hint {
  margin: 0;
}

.empty-title {
  font-size: var(--font-size-lg);
}

.empty-hint {
  max-width: 50ch;
  color: var(--color-text-muted);
}

.recipe-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--space-md);
  margin: 0;
  padding: 0;
  list-style: none;
}

.recipe-grid-item {
  display: flex;
}

.recipe-grid-item > * {
  flex: 1;
}
</style>
