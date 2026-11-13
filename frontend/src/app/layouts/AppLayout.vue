<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

import { Logo, Sidebar, Topbar, UserMenu } from '@/shared/components'
import { useAuthStore } from '@/features/auth/store/authStore'

const SIDEBAR_ID = 'app-sidebar'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { t } = useI18n()

const sidebarOpen = ref(false)
const menuButton = ref<HTMLButtonElement | null>(null)
const desktopQuery =
  typeof window.matchMedia === 'function' ? window.matchMedia('(min-width: 1024px)') : null

let previousBodyOverflow = ''
let scrollLocked = false

function lockScroll() {
  if (scrollLocked) {
    return
  }

  previousBodyOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  scrollLocked = true
}

function unlockScroll() {
  if (!scrollLocked) {
    return
  }

  document.body.style.overflow = previousBodyOverflow
  scrollLocked = false
}

function openSidebar() {
  sidebarOpen.value = true
  lockScroll()

  void nextTick(() => {
    document.getElementById(SIDEBAR_ID)?.querySelector<HTMLElement>('a, button')?.focus()
  })
}

function closeSidebar(restoreFocus = true) {
  if (!sidebarOpen.value) {
    return
  }

  sidebarOpen.value = false
  unlockScroll()

  if (restoreFocus) {
    menuButton.value?.focus()
  }
}

function toggleSidebar() {
  if (sidebarOpen.value) {
    closeSidebar()
  } else {
    openSidebar()
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && sidebarOpen.value) {
    closeSidebar()
  }
}

function onDesktopChange(event: MediaQueryListEvent) {
  if (event.matches) {
    closeSidebar(false)
  }
}

watch(
  () => route.fullPath,
  () => closeSidebar(),
)

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  desktopQuery?.addEventListener('change', onDesktopChange)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  desktopQuery?.removeEventListener('change', onDesktopChange)
  unlockScroll()
})

async function onSignOut() {
  await authStore.signOut()
  await router.push('/')
}
</script>

<template>
  <div class="app-layout">
    <Topbar class="topbar">
      <template #start>
        <button
          ref="menuButton"
          class="menu-button"
          type="button"
          :aria-label="sidebarOpen ? t('nav.closeMenu') : t('nav.openMenu')"
          :aria-expanded="sidebarOpen"
          :aria-controls="SIDEBAR_ID"
          @click="toggleSidebar"
        >
          <svg
            class="menu-icon"
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          >
            <path v-if="sidebarOpen" d="M6 6l12 12M18 6L6 18" />
            <path v-else d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>

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

    <Sidebar :id="SIDEBAR_ID" :open="sidebarOpen" @close="closeSidebar()">
      <RouterLink class="sidebar-link" :to="{ name: 'dashboard' }" @click="closeSidebar()">
        {{ t('nav.dashboard') }}
      </RouterLink>
      <RouterLink class="sidebar-link" :to="{ name: 'meal-plan' }" @click="closeSidebar()">
        {{ t('nav.mealPlan') }}
      </RouterLink>
      <RouterLink class="sidebar-link" :to="{ name: 'recipe-list' }" @click="closeSidebar()">
        {{ t('nav.recipeList') }}
      </RouterLink>
      <RouterLink class="sidebar-link" :to="{ name: 'recipe-public-list' }" @click="closeSidebar()">
        {{ t('nav.publicRecipes') }}
      </RouterLink>
      <RouterLink class="sidebar-link" :to="{ name: 'recipe-create' }" @click="closeSidebar()">
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

.menu-button {
  display: grid;
  place-items: center;
  width: 2.75rem;
  height: 2.75rem;
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
  color: var(--color-text);
  cursor: pointer;
  transition:
    background-color var(--duration-fast) var(--ease-standard),
    border-color var(--duration-fast) var(--ease-standard);
}

.menu-button:hover {
  background-color: var(--color-bg-muted);
  border-color: var(--color-border-strong);
}

.menu-icon {
  width: 1.5rem;
  height: 1.5rem;
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

  .menu-button {
    display: none;
  }
}
</style>
