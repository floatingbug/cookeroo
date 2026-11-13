import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import i18n from '@/app/i18n'
import { setLocale } from '@/shared/i18n/locale'

import UserMenu from './UserMenu.vue'

function mountMenu() {
  return mount(UserMenu, {
    attachTo: document.body,
    props: { userName: 'Tommy', userEmail: 'tommy@example.com' },
    global: { plugins: [i18n] },
  })
}

function clickOutside() {
  const event = new MouseEvent('pointerdown', { bubbles: true })
  document.body.dispatchEvent(event)
}

describe('UserMenu', () => {
  let wrapper: ReturnType<typeof mountMenu> | null = null

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    setLocale('de')
    window.localStorage.clear()
  })

  it('öffnet das Menü beim Klick auf den Button', async () => {
    wrapper = mountMenu()

    expect(wrapper.find('.user-menu-dropdown').exists()).toBe(false)

    await wrapper.get('.user-menu-button').trigger('click')

    expect(wrapper.get('.user-menu-button').attributes('aria-expanded')).toBe('true')
    expect(wrapper.find('.user-menu-dropdown').exists()).toBe(true)
  })

  it('schließt das Menü bei einem Klick außerhalb', async () => {
    wrapper = mountMenu()

    await wrapper.get('.user-menu-button').trigger('click')
    expect(wrapper.find('.user-menu-dropdown').exists()).toBe(true)

    clickOutside()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.user-menu-dropdown').exists()).toBe(false)
    expect(wrapper.get('.user-menu-button').attributes('aria-expanded')).toBe('false')
  })

  it('schließt das Menü nicht bei einem Klick in das Dropdown', async () => {
    wrapper = mountMenu()

    await wrapper.get('.user-menu-button').trigger('click')

    wrapper
      .get('.user-menu-email')
      .element.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.user-menu-dropdown').exists()).toBe(true)
  })

  it('schließt das Menü mit Escape', async () => {
    wrapper = mountMenu()

    await wrapper.get('.user-menu-button').trigger('click')

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.user-menu-dropdown').exists()).toBe(false)
    expect(document.activeElement).toBe(wrapper.get('.user-menu-button').element)
  })

  it('zeigt die Sprachwahl und markiert die aktive Sprache', async () => {
    wrapper = mountMenu()

    await wrapper.get('.user-menu-button').trigger('click')

    const options = wrapper.findAll('[role="menuitemradio"]')

    expect(options.map((option) => option.attributes('data-locale'))).toEqual(['de', 'en'])
    expect(options.map((option) => option.text())).toEqual(['Deutsch', 'English'])
    expect(options[0]!.attributes('aria-checked')).toBe('true')
    expect(options[1]!.attributes('aria-checked')).toBe('false')
  })

  it('wechselt die Sprache und schließt das Menü', async () => {
    wrapper = mountMenu()

    await wrapper.get('.user-menu-button').trigger('click')
    await wrapper.get('[data-locale="en"]').trigger('click')

    expect(i18n.global.locale.value).toBe('en')
    expect(document.documentElement.lang).toBe('en')
    expect(window.localStorage.getItem('locale')).toBe('en')
    expect(wrapper.find('.user-menu-dropdown').exists()).toBe(false)

    await wrapper.get('.user-menu-button').trigger('click')

    expect(wrapper.get('.user-menu-signout').text()).toBe('Sign out')
    expect(wrapper.get('[data-locale="en"]').attributes('aria-checked')).toBe('true')
  })

  it('meldet sich ab und schließt das Menü', async () => {
    wrapper = mountMenu()

    await wrapper.get('.user-menu-button').trigger('click')
    await wrapper.get('.user-menu-signout').trigger('click')

    expect(wrapper.emitted('signOut')).toHaveLength(1)
    expect(wrapper.find('.user-menu-dropdown').exists()).toBe(false)
  })
})
