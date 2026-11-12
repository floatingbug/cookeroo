<script setup lang="ts">
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'

import { useRecipeStore } from '../../store/recipeStore'
import RecipeCard from '../components/RecipeCard.vue'

const { t } = useI18n()
const store = useRecipeStore()
const { publicRecipes, publicRecipesLoading, publicRecipesErrorKey } = storeToRefs(store)

onMounted(() => {
  void store.loadPublicRecipes()
})
</script>

<template>
  <main class="public-recipe-list-view">
    <div class="page-header">
      <div class="header-copy">
        <h1 class="title">{{ t('recipe.publicList.title') }}</h1>
        <p class="description">{{ t('recipe.publicList.description') }}</p>
      </div>
    </div>

    <p v-if="publicRecipesLoading" class="status" role="status">
      {{ t('recipe.publicList.loading') }}
    </p>
    <p v-else-if="publicRecipesErrorKey" class="alert" role="alert">
      {{ t(publicRecipesErrorKey) }}
    </p>

    <section v-else-if="publicRecipes.length === 0" class="empty-state">
      <h2 class="empty-title">{{ t('recipe.publicList.empty') }}</h2>
      <p class="empty-hint">{{ t('recipe.publicList.emptyHint') }}</p>
    </section>

    <ul v-else class="recipe-grid">
      <li v-for="recipe in publicRecipes" :key="recipe.id" class="recipe-grid-item">
        <RecipeCard :recipe="recipe" :deletable="false" />
      </li>
    </ul>
  </main>
</template>

<style scoped>
.public-recipe-list-view {
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
