<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const emit = defineEmits(['logo:press'])
const { t } = useI18n()
</script>

<template>
  <button class="logo" type="button" @click="emit('logo:press')">
    <span class="logo-mark" aria-hidden="true">c</span>
    <span class="logo-text">{{ t('app.name') }}</span>
  </button>
</template>

<style scoped>
.logo {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 0;
  border: 0;
  color: var(--color-text);
  background: transparent;
  cursor: pointer;
  transition: color var(--duration-fast) var(--ease-standard);
}

.logo-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: var(--radius-md);
  background-color: var(--color-primary);
  color: var(--color-primary-contrast);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  line-height: 1;
}

.logo-text {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  letter-spacing: var(--letter-spacing-tight);
}

.logo:hover,
.logo:hover .logo-text {
  color: var(--color-primary);
}
</style>
