<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'

import { Button } from '@/shared/components'
import { useRecipeStore } from '../../store/recipeStore'
import BasicsSection from './BasicsSection.vue'
import IngredientsSection from './IngredientsSection.vue'
import InstructionsSection from './InstructionsSection.vue'
import VisibilitySection from './VisibilitySection.vue'

const props = defineProps<{
  submitLabel: string
  submittingLabel: string
  submitting: boolean
}>()

const emit = defineEmits<{
  submit: []
}>()

const { t } = useI18n()
const store = useRecipeStore()
const { form, uploading } = storeToRefs(store)

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
</script>

<template>
  <form class="form" @submit.prevent="emit('submit')">
    <BasicsSection
      :form="form"
      :loading="props.submitting"
      :uploading="uploading"
      @upload="onRecipeImageUpload"
    />

    <IngredientsSection
      :ingredients="form.ingredients"
      :loading="props.submitting"
      @add="store.addIngredient"
      @remove="store.removeIngredient"
    />

    <InstructionsSection
      :instructions="form.instructions"
      :loading="props.submitting"
      :uploading="uploading"
      @add="store.addInstruction"
      @remove="store.removeInstruction"
      @upload="onStepImageUpload"
    />

    <VisibilitySection v-model:is-public="form.isPublic" :loading="props.submitting" />

    <div class="actions">
      <Button
        type="submit"
        :label="props.submitting ? props.submittingLabel : props.submitLabel"
        :disabled="props.submitting || uploading"
      />
    </div>
  </form>
</template>

<style scoped>
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
