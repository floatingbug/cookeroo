import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'

import { useAuthStore } from '@/features/auth/store/authStore'

import i18n from '../i18n'
import { pinia } from '../pinia'
import AppLayout from './AppLayout.vue'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', name: 'home', component: { render: () => null } },
    { path: '/dashboard', name: 'dashboard', component: { render: () => null } },
    { path: '/meal-plan', name: 'meal-plan', component: { render: () => null } },
    { path: '/recipes', name: 'recipe-list', component: { render: () => null } },
    { path: '/recipes/public', name: 'recipe-public-list', component: { render: () => null } },
    { path: '/recipes/new', name: 'recipe-create', component: { render: () => null } },
  ],
})

function mountLayout() {
  return mount(AppLayout, {
    attachTo: document.body,
    global: { plugins: [pinia, router, i18n] },
  })
}

function getMenuButton(wrapper: ReturnType<typeof mountLayout>) {
  return wrapper.get('button[aria-controls="app-sidebar"]')
}

function getBackdrop() {
  return document.body.querySelector<HTMLElement>('.sidebar-backdrop')
}

describe('AppLayout', () => {
  beforeEach(async () => {
    await router.push('/')
    await router.isReady()

    const authStore = useAuthStore(pinia)
    authStore.$reset()
    authStore.user = { id: '1', name: 'Testnutzer', email: 'test@example.com' }
    authStore.status = 'authenticated'

    document.body.style.overflow = ''
  })

  it('öffnet und schließt die Sidebar über den Menü-Button', async () => {
    const wrapper = mountLayout()
    const button = getMenuButton(wrapper)

    expect(button.attributes('aria-expanded')).toBe('false')
    expect(button.attributes('aria-label')).toBe(i18n.global.t('nav.openMenu'))

    await button.trigger('click')

    expect(button.attributes('aria-expanded')).toBe('true')
    expect(button.attributes('aria-label')).toBe(i18n.global.t('nav.closeMenu'))
    expect(wrapper.get('#app-sidebar').classes()).toContain('sidebar--open')
    expect(wrapper.get('#app-sidebar nav').attributes('aria-label')).toBe(i18n.global.t('nav.main'))
    expect(getBackdrop()).not.toBeNull()
    expect(document.body.style.overflow).toBe('hidden')

    await button.trigger('click')

    expect(button.attributes('aria-expanded')).toBe('false')
    expect(wrapper.get('#app-sidebar').classes()).not.toContain('sidebar--open')
    expect(getBackdrop()).toBeNull()
    expect(document.body.style.overflow).toBe('')

    wrapper.unmount()
  })

  it('schließt die Sidebar mit Escape und gibt den Fokus zurück', async () => {
    const wrapper = mountLayout()
    const button = getMenuButton(wrapper)

    await button.trigger('click')
    await nextTick()

    expect(document.activeElement).toBe(wrapper.get('.sidebar-close').element)

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()

    expect(button.attributes('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(button.element)

    wrapper.unmount()
  })

  it('zeigt das Logo in der Sidebar statt in der Topbar', async () => {
    const wrapper = mountLayout()

    expect(wrapper.find('.topbar .logo').exists()).toBe(false)
    expect(wrapper.find('#app-sidebar .logo').exists()).toBe(true)

    await wrapper.get('#app-sidebar .logo').trigger('click')

    await vi.waitFor(() => {
      expect(router.currentRoute.value.name).toBe('dashboard')
    })

    wrapper.unmount()
  })

  it('schließt die Sidebar bei einem Klick auf das Overlay', async () => {
    const wrapper = mountLayout()
    const button = getMenuButton(wrapper)

    await button.trigger('click')
    getBackdrop()?.click()
    await nextTick()

    expect(button.attributes('aria-expanded')).toBe('false')
    expect(getBackdrop()).toBeNull()

    wrapper.unmount()
  })

  it('schließt die Sidebar nach der Navigation', async () => {
    const wrapper = mountLayout()
    const button = getMenuButton(wrapper)

    await button.trigger('click')
    await wrapper.get('a[href="/dashboard"]').trigger('click')

    await vi.waitFor(() => {
      expect(router.currentRoute.value.name).toBe('dashboard')
    })

    expect(button.attributes('aria-expanded')).toBe('false')

    wrapper.unmount()
  })
})
