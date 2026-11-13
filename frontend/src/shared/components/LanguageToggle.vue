<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import { LOCALES, locale, setLocale } from '@/shared/i18n/locale'

const { t } = useI18n()
</script>

<template>
  <div class="language-toggle" role="group" :aria-label="t('user.language')">
    <button
      v-for="value in LOCALES"
      :key="value"
      type="button"
      class="language-toggle__button"
      :class="{ 'language-toggle__button--active': locale === value }"
      :aria-pressed="locale === value"
      :aria-label="t(`user.languages.${value}`)"
      :title="t(`user.languages.${value}`)"
      :data-locale="value"
      @click="setLocale(value)"
    >
      {{ value.toUpperCase() }}
    </button>
  </div>
</template>

<style scoped>
.language-toggle {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2xs);
  padding: var(--space-2xs);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  background-color: var(--color-bg-muted);
}

.language-toggle__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.75rem;
  height: 1.75rem;
  padding: 0 var(--space-2xs);
  border: 0;
  border-radius: var(--radius-full);
  background-color: transparent;
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  letter-spacing: 0.04em;
  cursor: pointer;
  transition:
    color var(--duration-fast) var(--ease-standard),
    background-color var(--duration-fast) var(--ease-standard),
    box-shadow var(--duration-fast) var(--ease-standard);
}

.language-toggle__button:hover {
  color: var(--color-text);
  background-color: var(--color-surface-raised);
}

.language-toggle__button--active {
  color: var(--color-primary);
  background-color: var(--color-surface-raised);
  box-shadow: var(--shadow-sm);
}
</style>
