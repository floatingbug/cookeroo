<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { useAuthStore } from '@/features/auth/store/authStore'

const { t } = useI18n()
const authStore = useAuthStore()

const userName = computed(() => authStore.user?.name ?? '')
const userEmail = computed(() => authStore.user?.email ?? '')
</script>

<template>
  <main class="dashboard-view">
    <h1 class="title">{{ t('dashboard.title') }}</h1>
    <p class="description">{{ t('dashboard.description') }}</p>

    <section class="welcome-card">
      <p class="welcome">{{ t('dashboard.welcome', { name: userName }) }}</p>
      <p v-if="userEmail" class="email">{{ userEmail }}</p>
    </section>
  </main>
</template>

<style scoped>
.dashboard-view {
  width: 100%;
  max-width: var(--content-max-width);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.title {
  margin: 0;
}

.description {
  margin: 0;
  max-width: 60ch;
  color: var(--color-text-muted);
}

.welcome-card {
  padding: var(--space-lg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.welcome {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-medium);
  color: var(--color-text);
}

.email {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}
</style>
