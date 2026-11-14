<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  id: { type: String, required: true },
  label: { type: String, required: true },
  modelValue: { type: String, default: '' },
  type: { type: String, default: 'text' },
  autocomplete: { type: String, default: 'off' },
  error: { type: String, default: '' },
  hint: { type: String, default: '' },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const { t } = useI18n()
const passwordVisible = shallowRef(false)
const isPassword = computed(() => props.type === 'password')
const inputType = computed(() => (isPassword.value && passwordVisible.value ? 'text' : props.type))

function onInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}

function togglePassword(): void {
  passwordVisible.value = !passwordVisible.value
}
</script>

<template>
  <div class="input-field">
    <label :for="id" class="input-label">{{ label }}</label>
    <div class="input-wrapper">
      <input
        :id="id"
        class="input-control"
        :class="{ 'input-control--password': isPassword }"
        :type="inputType"
        :value="modelValue"
        :autocomplete="autocomplete"
        :required="required"
        :disabled="disabled"
        :aria-invalid="Boolean(error)"
        :aria-describedby="error ? `${id}-error` : hint ? `${id}-hint` : undefined"
        @input="onInput"
      />
      <button
        v-if="isPassword"
        type="button"
        class="input-toggle"
        :aria-label="t(passwordVisible ? 'common.hidePassword' : 'common.showPassword')"
        :aria-pressed="passwordVisible"
        :disabled="disabled"
        @click="togglePassword"
      >
        <svg
          v-if="passwordVisible"
          class="input-toggle-icon"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M2.5 10s2.8-5 7.5-5 7.5 5 7.5 5-2.8 5-7.5 5-7.5-5-7.5-5Z" />
          <circle cx="10" cy="10" r="2.5" />
          <path d="M3.5 3.5l13 13" />
        </svg>
        <svg
          v-else
          class="input-toggle-icon"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M2.5 10s2.8-5 7.5-5 7.5 5 7.5 5-2.8 5-7.5 5-7.5-5-7.5-5Z" />
          <circle cx="10" cy="10" r="2.5" />
        </svg>
      </button>
    </div>
    <p v-if="hint && !error" :id="`${id}-hint`" class="input-hint">{{ hint }}</p>
    <p v-if="error" :id="`${id}-error`" class="input-error" role="alert">{{ error }}</p>
  </div>
</template>

<style scoped>
.input-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.input-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text);
}

.input-wrapper {
  position: relative;
  display: flex;
}

.input-control {
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
  color: var(--color-text);
  transition:
    border-color var(--duration-fast) var(--ease-standard),
    box-shadow var(--duration-fast) var(--ease-standard);
}

.input-control--password {
  padding-right: 2.75rem;
}

.input-control::placeholder {
  color: var(--color-text-muted);
}

.input-control:hover:not(:disabled) {
  border-color: var(--color-border-strong);
}

.input-control:focus {
  border-color: var(--color-primary);
  outline: 3px solid color-mix(in srgb, var(--color-focus) 22%, transparent);
  outline-offset: 0;
}

.input-control[aria-invalid='true'] {
  border-color: var(--color-danger);
}

.input-toggle {
  position: absolute;
  top: 50%;
  right: var(--space-xs);
  display: grid;
  width: 2rem;
  height: 2rem;
  padding: 0;
  place-items: center;
  border: none;
  border-radius: var(--radius-full);
  background-color: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  transform: translateY(-50%);
}

.input-toggle:hover:not(:disabled) {
  background-color: var(--color-bg-muted);
  color: var(--color-text);
}

.input-toggle:focus-visible {
  outline: 3px solid color-mix(in srgb, var(--color-focus) 22%, transparent);
  outline-offset: 2px;
}

.input-toggle:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.input-toggle-icon {
  width: 1.125rem;
  height: 1.125rem;
}

.input-hint,
.input-error {
  margin: 0;
  font-size: var(--font-size-xs);
}

.input-hint {
  color: var(--color-text-muted);
}

.input-error {
  color: var(--color-danger);
}
</style>
