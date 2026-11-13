<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { LOCALES, locale, setLocale } from '@/shared/i18n/locale'

defineProps({
  userName: { type: String, default: '' },
  userEmail: { type: String, default: '' },
})

const emit = defineEmits(['signOut'])
const { t } = useI18n()
const open = ref(false)
const root = ref<HTMLElement | null>(null)
const button = ref<HTMLButtonElement | null>(null)

function close() {
  open.value = false
}

function onPointerDown(event: PointerEvent) {
  if (!root.value?.contains(event.target as Node)) {
    close()
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    close()
    button.value?.focus()
  }
}

function addListeners() {
  document.addEventListener('pointerdown', onPointerDown)
  document.addEventListener('keydown', onKeydown)
}

function removeListeners() {
  document.removeEventListener('pointerdown', onPointerDown)
  document.removeEventListener('keydown', onKeydown)
}

watch(open, (isOpen) => {
  if (isOpen) {
    addListeners()
  } else {
    removeListeners()
  }
})

onUnmounted(removeListeners)

function onSelectLocale(value: string) {
  setLocale(value)
  close()
}

function onSignOut() {
  close()
  emit('signOut')
}
</script>

<template>
  <div ref="root" class="user-menu">
    <button
      ref="button"
      class="user-menu-button"
      type="button"
      :aria-label="t('user.menu')"
      aria-haspopup="menu"
      :aria-expanded="open"
      @click="open = !open"
    >
      <span class="user-menu-label">{{ userName || t('user.menu') }}</span>
    </button>

    <div v-if="open" class="user-menu-dropdown" role="menu">
      <p v-if="userEmail" class="user-menu-email">{{ userEmail }}</p>
      <div class="user-menu-languages" role="group" :aria-label="t('user.language')">
        <button
          v-for="value in LOCALES"
          :key="value"
          class="user-menu-language"
          :class="{ 'user-menu-language--active': locale === value }"
          type="button"
          role="menuitemradio"
          :aria-checked="locale === value"
          :data-locale="value"
          @click="onSelectLocale(value)"
        >
          {{ t(`user.languages.${value}`) }}
        </button>
      </div>
      <button class="user-menu-signout" type="button" role="menuitem" @click="onSignOut">
        {{ t('user.signOut') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.user-menu {
  position: relative;
}

.user-menu-button {
  display: inline-flex;
  align-items: center;
  padding: var(--space-xs) var(--space-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  background-color: var(--color-surface);
  color: var(--color-text);
  cursor: pointer;
  transition:
    background-color var(--duration-fast) var(--ease-standard),
    border-color var(--duration-fast) var(--ease-standard);
}

.user-menu-button:hover {
  background-color: var(--color-bg-muted);
  border-color: var(--color-border-strong);
}

.user-menu-label {
  font-size: var(--font-size-sm);
}

.user-menu-dropdown {
  position: absolute;
  right: 0;
  top: calc(100% + var(--space-xs));
  z-index: var(--z-dropdown);
  min-width: 12rem;
  padding: var(--space-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background-color: var(--color-surface-raised);
  box-shadow: var(--shadow-md);
}

.user-menu-email {
  margin: 0 0 var(--space-sm);
  padding: 0 var(--space-sm);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  overflow-wrap: anywhere;
}

.user-menu-languages {
  display: flex;
  gap: var(--space-2xs);
  margin-bottom: var(--space-xs);
  padding-bottom: var(--space-xs);
  border-bottom: 1px solid var(--color-border);
}

.user-menu-language {
  flex: 1;
  padding: var(--space-xs) var(--space-sm);
  border: 0;
  border-radius: var(--radius-sm);
  background-color: transparent;
  color: var(--color-text-muted);
  font: inherit;
  font-size: var(--font-size-sm);
  text-align: left;
  cursor: pointer;
  transition:
    color var(--duration-fast) var(--ease-standard),
    background-color var(--duration-fast) var(--ease-standard);
}

.user-menu-language:hover {
  color: var(--color-text);
  background-color: var(--color-bg-muted);
}

.user-menu-language--active {
  color: var(--color-primary);
  font-weight: var(--font-weight-medium);
}

.user-menu-signout {
  width: 100%;
  padding: var(--space-xs) var(--space-sm);
  border: 0;
  border-radius: var(--radius-sm);
  background-color: transparent;
  color: var(--color-danger);
  text-align: left;
  cursor: pointer;
  transition: background-color var(--duration-fast) var(--ease-standard);
}

.user-menu-signout:hover {
  background-color: color-mix(in srgb, var(--color-danger) 10%, transparent);
}
</style>
