<script setup lang="ts">
import type { SelectOption } from './types'

const model = defineModel<string>({ default: '' })

const props = withDefaults(
  defineProps<{
    id: string
    label: string
    options: SelectOption[]
    error?: string
    hint?: string
    placeholder?: string
    required?: boolean
    disabled?: boolean
  }>(),
  {
    error: '',
    hint: '',
    placeholder: '',
    required: false,
    disabled: false,
  },
)
</script>

<template>
  <div class="select-field">
    <label :for="props.id" class="select-label">{{ props.label }}</label>
    <select
      :id="props.id"
      v-model="model"
      class="select-control"
      :required="props.required"
      :disabled="props.disabled"
      :aria-invalid="Boolean(props.error)"
      :aria-describedby="
        props.error ? `${props.id}-error` : props.hint ? `${props.id}-hint` : undefined
      "
    >
      <option v-if="props.placeholder" value="">{{ props.placeholder }}</option>
      <option v-for="option in props.options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
    <p v-if="props.hint && !props.error" :id="`${props.id}-hint`" class="select-hint">
      {{ props.hint }}
    </p>
    <p v-if="props.error" :id="`${props.id}-error`" class="select-error" role="alert">
      {{ props.error }}
    </p>
  </div>
</template>

<style scoped>
.select-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.select-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text);
}

.select-control {
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  transition:
    border-color var(--duration-fast) var(--ease-standard),
    box-shadow var(--duration-fast) var(--ease-standard);
}

.select-control:hover:not(:disabled) {
  border-color: var(--color-border-strong);
}

.select-control:focus {
  border-color: var(--color-primary);
  outline: 3px solid color-mix(in srgb, var(--color-focus) 22%, transparent);
  outline-offset: 0;
}

.select-control[aria-invalid='true'] {
  border-color: var(--color-danger);
}

.select-hint,
.select-error {
  margin: 0;
  font-size: var(--font-size-xs);
}

.select-hint {
  color: var(--color-text-muted);
}

.select-error {
  color: var(--color-danger);
}
</style>
