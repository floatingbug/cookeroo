<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const emit = defineEmits(['logo:press'])
const { t } = useI18n()
</script>

<template>
  <button class="logo" type="button" @click="emit('logo:press')">
    <img class="logo-mark" src="/favicon.svg" alt="" width="32" height="32" />
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
  display: block;
  width: 2rem;
  height: 2rem;
  border-radius: var(--radius-md);
  object-fit: contain;
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
