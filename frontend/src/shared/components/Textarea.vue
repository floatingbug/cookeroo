<script setup lang="ts">
const model = defineModel<string>({ default: '' })

const props = withDefaults(
  defineProps<{
    id: string
    label: string
    error?: string
    hint?: string
    required?: boolean
    disabled?: boolean
    rows?: number
  }>(),
  {
    error: '',
    hint: '',
    required: false,
    disabled: false,
    rows: 4,
  },
)
</script>

<template>
  <div class="textarea-field">
    <label :for="props.id" class="textarea-label">{{ props.label }}</label>
    <textarea
      :id="props.id"
      v-model="model"
      class="textarea-control"
      :rows="props.rows"
      :required="props.required"
      :disabled="props.disabled"
      :aria-invalid="Boolean(props.error)"
      :aria-describedby="
        props.error ? `${props.id}-error` : props.hint ? `${props.id}-hint` : undefined
      "
    />
    <p v-if="props.hint && !props.error" :id="`${props.id}-hint`" class="textarea-hint">
      {{ props.hint }}
    </p>
    <p v-if="props.error" :id="`${props.id}-error`" class="textarea-error" role="alert">
      {{ props.error }}
    </p>
  </div>
</template>

<style scoped>
.textarea-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.textarea-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text);
}

.textarea-control {
  width: 100%;
  resize: vertical;
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

.textarea-control:hover:not(:disabled) {
  border-color: var(--color-border-strong);
}

.textarea-control:focus {
  border-color: var(--color-primary);
  outline: 3px solid color-mix(in srgb, var(--color-focus) 22%, transparent);
  outline-offset: 0;
}

.textarea-control[aria-invalid='true'] {
  border-color: var(--color-danger);
}

.textarea-hint,
.textarea-error {
  margin: 0;
  font-size: var(--font-size-xs);
}

.textarea-hint {
  color: var(--color-text-muted);
}

.textarea-error {
  color: var(--color-danger);
}
</style>
