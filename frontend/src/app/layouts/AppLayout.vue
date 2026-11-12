<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

import { Logo, Sidebar, Topbar, UserMenu } from '@/shared/components'
import { useAuthStore } from '@/features/auth/store/authStore'

const router = useRouter()
const authStore = useAuthStore()
const { t } = useI18n()

async function onSignOut() {
  await authStore.signOut()
  await router.push('/')
}
</script>

<template>
  <div class="app-layout">
    <Topbar class="topbar">
      <template #start>
        <Logo @logo:press="router.push('/dashboard')" />
      </template>

      <template #end>
        <div class="topbar-end">
          <UserMenu
            :user-name="authStore.user?.name ?? ''"
            :user-email="authStore.user?.email ?? ''"
            @sign-out="onSignOut"
          />
        </div>
      </template>
    </Topbar>

    <Sidebar class="sidebar">
      <RouterLink class="sidebar-link" :to="{ name: 'dashboard' }">
        {{ t('nav.dashboard') }}
      </RouterLink>
      <RouterLink class="sidebar-link" :to="{ name: 'meal-plan' }">
        {{ t('nav.mealPlan') }}
      </RouterLink>
      <RouterLink class="sidebar-link" :to="{ name: 'recipe-list' }">
        {{ t('nav.recipeList') }}
      </RouterLink>
      <RouterLink class="sidebar-link" :to="{ name: 'recipe-public-list' }">
        {{ t('nav.publicRecipes') }}
      </RouterLink>
      <RouterLink class="sidebar-link" :to="{ name: 'recipe-create' }">
        {{ t('nav.recipeCreate') }}
      </RouterLink>
    </Sidebar>

    <div class="main">
      <RouterView />
    </div>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
}

.topbar {
  grid-area: topbar;
  width: 100%;
  position: sticky;
  top: 0;
  z-index: var(--z-topbar);
}

.sidebar {
  grid-area: sidebar;
  width: var(--sidebar-width);
  height: 100dvh;
  position: sticky;
  top: 0;
  display: none;
  background-color: var(--color-bg-muted);
  border-right: 1px solid var(--color-border);
}

.sidebar-link {
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  text-decoration: none;
  transition:
    color var(--duration-fast) var(--ease-standard),
    background-color var(--duration-fast) var(--ease-standard);
}

.sidebar-link:hover {
  color: var(--color-primary);
  background-color: var(--color-primary-soft);
}

.sidebar-link.router-link-exact-active {
  color: var(--color-primary);
  background-color: var(--color-primary-soft);
  font-weight: var(--font-weight-semibold);
}

.main {
  grid-area: main;
  width: 100%;
  display: flex;
  justify-content: center;
  padding: var(--space-xl) var(--space-lg) var(--space-2xl);
}

@media (max-width: 640px) {
  .main {
    padding: var(--space-lg) var(--space-md) var(--space-2xl);
  }
}

@media (min-width: 1024px) {
  .app-layout {
    display: grid;
    grid-template-columns: auto 1fr;
    grid-template-rows: auto 1fr;
    grid-template-areas:
      'sidebar topbar'
      'sidebar main';
    user-select: none;
  }

  .sidebar {
    display: block;
  }
}
</style>
