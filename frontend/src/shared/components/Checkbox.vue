<script setup lang="ts">
const model = defineModel<boolean>({ default: false })

const props = withDefaults(
  defineProps<{
    id: string
    label: string
    disabled?: boolean
  }>(),
  {
    disabled: false,
  },
)
</script>

<template>
  <label class="checkbox" :for="props.id">
    <input
      :id="props.id"
      v-model="model"
      class="checkbox-input"
      type="checkbox"
      :disabled="props.disabled"
    />
    <span class="checkbox-label">{{ props.label }}</span>
  </label>
</template>

<style scoped>
.checkbox {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--font-size-sm);
  color: var(--color-text);
  cursor: pointer;
}

.checkbox-input {
  width: 1.125rem;
  height: 1.125rem;
  accent-color: var(--color-primary);
  cursor: pointer;
}

.checkbox-input:disabled {
  cursor: not-allowed;
}

.checkbox-input:disabled + .checkbox-label {
  opacity: 0.6;
}
</style>
