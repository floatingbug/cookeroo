<script setup lang="ts">
import { useI18n } from 'vue-i18n'

defineProps({
  id: { type: String, default: undefined },
  label: { type: String, default: 'nav.main' },
  open: { type: Boolean, default: false },
})

const emit = defineEmits(['close'])
const { t } = useI18n()
</script>

<template>
  <Teleport to="body">
    <Transition name="sidebar-fade">
      <div v-if="open" class="sidebar-backdrop" aria-hidden="true" @click="emit('close')" />
    </Transition>
  </Teleport>

  <aside :id="id" class="sidebar" :class="{ 'sidebar--open': open }">
    <nav class="sidebar-nav" :aria-label="t(label)">
      <slot />
    </nav>
  </aside>
</template>

<style scoped>
.sidebar {
  grid-area: sidebar;
  position: fixed;
  inset-block: 0;
  left: 0;
  z-index: var(--z-drawer);
  width: min(85vw, var(--sidebar-width));
  min-height: 0;
  padding: var(--space-lg) var(--space-md);
  background-color: var(--color-bg-muted);
  border-right: 1px solid var(--color-border);
  box-shadow: var(--shadow-lg);
  overflow-y: auto;
  visibility: hidden;
  transform: translateX(-100%);
  transition:
    transform var(--duration-base) var(--ease-standard),
    visibility var(--duration-base) var(--ease-standard);
}

.sidebar--open {
  visibility: visible;
  transform: translateX(0);
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.sidebar-backdrop {
  position: fixed;
  inset: 0;
  z-index: var(--z-drawer-backdrop);
  background-color: rgb(0 0 0 / 45%);
}

.sidebar-fade-enter-active,
.sidebar-fade-leave-active {
  transition: opacity var(--duration-base) var(--ease-standard);
}

.sidebar-fade-enter-from,
.sidebar-fade-leave-to {
  opacity: 0;
}

@media (min-width: 1024px) {
  .sidebar {
    position: sticky;
    inset-block: auto;
    top: 0;
    z-index: auto;
    width: var(--sidebar-width);
    height: 100dvh;
    background-color: var(--color-bg-muted);
    box-shadow: none;
    visibility: visible;
    transform: none;
    transition: none;
  }

  .sidebar-backdrop {
    display: none;
  }
}
</style>
