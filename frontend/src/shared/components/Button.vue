<script setup lang="ts">
import { computed } from 'vue'
import type { PropType } from 'vue'

const props = defineProps({
  label: { type: String, required: true },
  ariaLabel: { type: String, default: undefined },
  severity: {
    type: String as PropType<'primary' | 'secondary' | 'danger'>,
    default: 'primary',
    validator: (value: string) => ['primary', 'secondary', 'danger'].includes(value),
  },
  type: { type: String as PropType<'button' | 'submit' | 'reset'>, default: 'button' },
  disabled: { type: Boolean, default: false },
})

const classes = computed(() => ['button', `button--${props.severity}`])
</script>

<template>
  <button :type="type" :class="classes" :disabled="disabled" :aria-label="ariaLabel">
    {{ label }}
  </button>
</template>

<style scoped>
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  min-height: 2.5rem;
  padding: var(--space-sm) var(--space-lg);
  border: 1px solid transparent;
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-snug);
  cursor: pointer;
  transition:
    color var(--duration-fast) var(--ease-standard),
    background-color var(--duration-fast) var(--ease-standard),
    border-color var(--duration-fast) var(--ease-standard),
    box-shadow var(--duration-fast) var(--ease-standard),
    transform var(--duration-fast) var(--ease-standard);
}

.button:not(:disabled):active {
  transform: translateY(1px);
}

.button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.button--primary {
  color: var(--color-primary-contrast);
  background-color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

.button--primary:not(:disabled):hover {
  background-color: var(--color-primary-hover);
}

.button--secondary {
  color: var(--color-text);
  background-color: var(--color-surface);
  border-color: var(--color-border-strong);
}

.button--secondary:not(:disabled):hover {
  background-color: var(--color-bg-muted);
  border-color: var(--color-border-strong);
}

.button--danger {
  color: var(--color-danger-contrast);
  background-color: var(--color-danger);
}

.button--danger:not(:disabled):hover {
  background-color: var(--color-danger-hover);
}
</style>
