<script setup lang="ts">
import { useRouter } from 'vue-router'

import { LanguageToggle, Logo, ThemeToggle } from '@/shared/components'

const router = useRouter()
</script>

<template>
  <div class="auth-layout">
    <header class="auth-header">
      <Logo @logo:press="router.push('/')" />
      <div class="auth-header-actions">
        <LanguageToggle />
        <ThemeToggle />
      </div>
    </header>

    <div class="auth-container">
      <RouterView />
    </div>
  </div>
</template>

<style scoped>
.auth-layout {
  width: 100%;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.auth-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  padding: var(--space-md);
}

.auth-header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.auth-container {
  width: 100%;
  max-width: var(--auth-card-width);
  padding: var(--space-lg);
  margin-block: auto;
}
</style>
