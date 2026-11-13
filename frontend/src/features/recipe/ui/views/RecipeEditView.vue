<script setup lang="ts">
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'

import { useAuthStore } from '@/features/auth/store/authStore'
import { useRecipeStore } from '../../store/recipeStore'
import RecipeForm from '../components/RecipeForm.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const store = useRecipeStore()
const authStore = useAuthStore()
const { recipe, loading, updating, errorKey } = storeToRefs(store)

const isOwner = computed(
  () => recipe.value !== null && recipe.value.createdBy === authStore.user?.id,
)

const forbidden = computed(() => recipe.value !== null && !isOwner.value)

watch(
  () => route.params.id,
  async (id) => {
    if (typeof id !== 'string' || id === '') {
      return
    }

    const loaded = await store.loadRecipe(id)

    if (loaded && store.recipe) {
      store.fillFormFromRecipe(store.recipe)
    }
  },
  { immediate: true },
)

async function onSubmit(): Promise<void> {
  const recipeId = recipe.value?.id

  if (!recipeId) {
    return
  }

  const updated = await store.updateRecipe(recipeId)

  if (updated) {
    await router.push({ name: 'recipe-detail', params: { id: recipeId } })
  }
}
</script>

<template>
  <main class="recipe-edit-view">
    <h1 class="title">{{ t('recipe.edit.title') }}</h1>
    <p class="description">{{ t('recipe.edit.description') }}</p>

    <p v-if="loading" class="status" role="status">{{ t('recipe.detail.loading') }}</p>
    <p v-else-if="!recipe && errorKey" class="alert" role="alert">{{ t(errorKey) }}</p>
    <p v-else-if="forbidden" class="alert" role="alert">{{ t('recipe.edit.forbidden') }}</p>

    <template v-else-if="recipe">
      <p v-if="errorKey" class="alert" role="alert">{{ t(errorKey) }}</p>

      <RecipeForm
        :submit-label="t('recipe.actions.saveChanges')"
        :submitting-label="t('recipe.actions.updating')"
        :submitting="updating"
        @submit="onSubmit"
      />
    </template>
  </main>
</template>

<style scoped>
.recipe-edit-view {
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
</style>
