<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import { Button, Input, Textarea } from '@/shared/components'
import type { InstructionForm } from '../../types'
import ImageUploadField from './ImageUploadField.vue'

const props = defineProps<{
  instructions: InstructionForm[]
  loading: boolean
  uploading: boolean
}>()

const emit = defineEmits<{
  add: []
  remove: [key: string]
  upload: [key: string, file: File]
}>()

const { t } = useI18n()
</script>

<template>
  <section class="section">
    <div class="section-header">
      <h2 class="section-title">{{ t('recipe.create.sections.instructions') }}</h2>
    </div>

    <fieldset
      v-for="(instruction, index) in props.instructions"
      :key="instruction.key"
      class="entry"
    >
      <legend class="entry-title">
        {{ t('recipe.fields.step', { step: index + 1 }) }}
      </legend>

      <Textarea
        :id="`instruction-description-${instruction.key}`"
        v-model="instruction.description"
        :label="t('recipe.fields.stepDescription')"
        :rows="3"
        required
        :disabled="props.loading"
      />

      <div class="grid">
        <Input
          :id="`instruction-duration-${instruction.key}`"
          v-model="instruction.duration"
          type="number"
          :label="t('recipe.fields.duration')"
          :disabled="props.loading"
        />
        <ImageUploadField
          :id="`instruction-image-${instruction.key}`"
          v-model="instruction.imageUrl"
          :label="t('recipe.fields.stepImage')"
          :uploading="props.uploading"
          @upload="(file) => emit('upload', instruction.key, file)"
        />
      </div>

      <div class="entry-actions">
        <Button
          severity="secondary"
          :label="t('recipe.actions.removeInstruction')"
          :disabled="props.loading || props.instructions.length <= 1"
          @click="emit('remove', instruction.key)"
        />
      </div>
    </fieldset>

    <div class="section-footer">
      <Button
        severity="secondary"
        :label="t('recipe.actions.addInstruction')"
        :disabled="props.loading"
        @click="emit('add')"
      />
    </div>
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

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
}

.section-footer, .entry-actions {
  display: flex;
  justify-content: flex-end;
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
