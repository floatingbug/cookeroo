<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <main class="home-view">
    <section class="home-hero">
      <h1 class="home-title">{{ t('home.title') }}</h1>
      <p class="home-description">{{ t('home.description') }}</p>
    </section>
  </main>
</template>

<style scoped>
.home-view {
  width: 100%;
  max-width: var(--content-max-width);
  padding: var(--space-xl) var(--space-lg);
}

.home-hero {
  position: relative;
  overflow: hidden;
  padding: var(--space-2xl);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background: linear-gradient(135deg, var(--color-primary-soft), var(--color-accent-soft));
  box-shadow: var(--shadow-md);
}

.home-hero::after {
  content: '';
  position: absolute;
  right: -4rem;
  bottom: -5rem;
  width: 16rem;
  height: 16rem;
  border-radius: var(--radius-full);
  background-color: color-mix(in srgb, var(--color-primary) 10%, transparent);
  pointer-events: none;
}

.home-title {
  position: relative;
  max-width: 20ch;
  margin-bottom: var(--space-md);
}

.home-description {
  position: relative;
  max-width: 56ch;
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-lg);
}

@media (max-width: 640px) {
  .home-view {
    padding: var(--space-md);
  }

  .home-hero {
    padding: var(--space-xl) var(--space-lg);
  }
}
</style>
