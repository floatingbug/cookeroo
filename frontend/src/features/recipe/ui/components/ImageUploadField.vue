<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import { Button } from '@/shared/components'

const props = withDefaults(
  defineProps<{
    id: string
    label: string
    modelValue: string
    uploading?: boolean
    error?: string
  }>(),
  {
    uploading: false,
    error: '',
  },
)

const emit = defineEmits<{
  upload: [file: File]
  'update:modelValue': [value: string]
}>()

const { t } = useI18n()

function onChange(event: Event): void {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (file) {
    emit('upload', file)
  }

  input.value = ''
}
</script>

<template>
  <div class="image-field">
    <span class="image-label">{{ props.label }}</span>

    <div v-if="props.modelValue" class="image-preview">
      <img :src="props.modelValue" :alt="props.label" class="image" />
      <Button
        severity="secondary"
        :label="t('recipe.actions.removeImage')"
        :disabled="props.uploading"
        @click="emit('update:modelValue', '')"
      />
    </div>

    <label class="image-upload" :for="props.id">
      <span class="image-upload-text">
        {{ props.uploading ? t('recipe.actions.uploading') : t('recipe.actions.upload') }}
      </span>
      <input
        :id="props.id"
        class="image-input"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        :disabled="props.uploading"
        @change="onChange"
      />
    </label>

    <p v-if="props.error" class="image-error" role="alert">{{ props.error }}</p>
  </div>
</template>

<style scoped>
.image-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.image-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text);
}

.image-preview {
  display: flex;
  align-items: flex-end;
  gap: var(--space-sm);
}

.image {
  width: 100%;
  max-width: 240px;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.image-upload {
  display: inline-flex;
  align-self: flex-start;
  padding: var(--space-sm) var(--space-md);
  border: 1px dashed var(--color-border-strong);
  border-radius: var(--radius-md);
  background-color: var(--color-primary-soft);
  color: var(--color-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition:
    border-color var(--duration-fast) var(--ease-standard),
    background-color var(--duration-fast) var(--ease-standard);
}

.image-upload:hover {
  border-color: var(--color-primary);
  background-color: color-mix(in srgb, var(--color-primary) 12%, var(--color-surface));
}

.image-input {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

.image-input:focus-visible + .image-upload-text,
.image-upload:focus-within {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.image-input:disabled + .image-upload-text {
  opacity: 0.6;
}

.image-error {
  margin: 0;
  font-size: var(--font-size-xs);
  color: var(--color-danger);
}
</style>
