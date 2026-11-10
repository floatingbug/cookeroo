import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

import i18n from '@/app/i18n'
import { useAuthStore } from '@/features/auth/store/authStore'
import DashboardView from './DashboardView.vue'

function mountView() {
  const pinia = createPinia()

  setActivePinia(pinia)

  const authStore = useAuthStore()

  authStore.status = 'authenticated'
  authStore.user = { id: '1', name: 'Tommy', email: 'tommy@example.com' }

  const wrapper = mount(DashboardView, {
    global: { plugins: [pinia, i18n] },
  })

  return { wrapper, authStore }
}

describe('DashboardView', () => {
  it('zeigt Titel und Beschreibung', () => {
    const { wrapper } = mountView()

    expect(wrapper.text()).toContain(i18n.global.t('dashboard.title'))
    expect(wrapper.text()).toContain(i18n.global.t('dashboard.description'))
  })

  it('begrüßt den angemeldeten Nutzer mit Name und E-Mail', () => {
    const { wrapper } = mountView()

    expect(wrapper.text()).toContain(i18n.global.t('dashboard.welcome', { name: 'Tommy' }))
    expect(wrapper.text()).toContain('tommy@example.com')
  })

  it('zeigt ohne Nutzerdaten keine E-Mail-Zeile', async () => {
    const { wrapper, authStore } = mountView()

    authStore.user = null
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.email').exists()).toBe(false)
  })
})
