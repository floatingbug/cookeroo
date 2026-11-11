<script setup lang="ts">
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'

import { Button } from '@/shared/components'
import { useRecipeStore } from '../../store/recipeStore'
import BasicsSection from '../components/BasicsSection.vue'
import IngredientsSection from '../components/IngredientsSection.vue'
import InstructionsSection from '../components/InstructionsSection.vue'
import VisibilitySection from '../components/VisibilitySection.vue'

const { t } = useI18n()
const router = useRouter()
const store = useRecipeStore()
const { form, loading, uploading, errorKey } = storeToRefs(store)

onMounted(() => {
  store.resetForm()
})

async function onRecipeImageUpload(file: File): Promise<void> {
  const url = await store.uploadImage(file)

  if (url) {
    form.value.imageUrl = url
  }
}

async function onStepImageUpload(key: string, file: File): Promise<void> {
  const url = await store.uploadImage(file)

  if (!url) {
    return
  }

  const instruction = form.value.instructions.find((candidate) => candidate.key === key)

  if (instruction) {
    instruction.imageUrl = url
  }
}

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

    <form class="form" @submit.prevent="onSubmit">
      <BasicsSection
        :form="form"
        :loading="loading"
        :uploading="uploading"
        @upload="onRecipeImageUpload"
      />

      <IngredientsSection
        :ingredients="form.ingredients"
        :loading="loading"
        @add="store.addIngredient"
        @remove="store.removeIngredient"
      />

      <InstructionsSection
        :instructions="form.instructions"
        :loading="loading"
        :uploading="uploading"
        @add="store.addInstruction"
        @remove="store.removeInstruction"
        @upload="onStepImageUpload"
      />

      <VisibilitySection v-model:is-public="form.isPublic" :loading="loading" />

      <div class="actions">
        <Button
          type="submit"
          :label="loading ? t('recipe.actions.saving') : t('recipe.actions.submit')"
          :disabled="loading || uploading"
        />
      </div>
    </form>
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

.form {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.actions {
  display: flex;
  justify-content: flex-end;
}
</style>
