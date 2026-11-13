<script setup lang="ts">
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'

import { useRecipeStore } from '../../store/recipeStore'
import RecipeForm from '../components/RecipeForm.vue'

const { t } = useI18n()
const router = useRouter()
const store = useRecipeStore()
const { loading, errorKey } = storeToRefs(store)

onMounted(() => {
  store.resetForm()
})

async function onSubmit(): Promise<void> {
  const recipeId = await store.submit()

  if (!recipeId) {
    return
  }

  store.resetForm()
  await router.push({ name: 'recipe-detail', params: { id: recipeId } })
}
</script>

<template>
  <main class="recipe-create-view">
    <h1 class="title">{{ t('recipe.create.title') }}</h1>
    <p class="description">{{ t('recipe.create.description') }}</p>

    <p v-if="errorKey" class="alert" role="alert">{{ t(errorKey) }}</p>

    <RecipeForm
      :submit-label="t('recipe.actions.submit')"
      :submitting-label="t('recipe.actions.saving')"
      :submitting="loading"
      @submit="onSubmit"
    />
  </main>
</template>

<style scoped>
.recipe-create-view {
  width: 100%;
  max-width: var(--content-max-width);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.title {
  margin: 0;
}

.description {
  margin: 0;
  max-width: 60ch;
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
</style>
