import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import i18n from '@/app/i18n'
import { locale, setLocale } from '@/shared/i18n/locale'

import LanguageToggle from './LanguageToggle.vue'

function mountToggle() {
  return mount(LanguageToggle, {
    global: { plugins: [i18n] },
  })
}

describe('LanguageToggle', () => {
  afterEach(() => {
    setLocale('de')
    window.localStorage.clear()
  })

  it('zeigt beide Sprachen und markiert die aktive', () => {
    const wrapper = mountToggle()
    const buttons = wrapper.findAll('button')

    expect(buttons.map((button) => button.attributes('data-locale'))).toEqual(['de', 'en'])
    expect(buttons.map((button) => button.text())).toEqual(['DE', 'EN'])
    expect(buttons[0]!.attributes('aria-pressed')).toBe('true')
    expect(buttons[1]!.attributes('aria-pressed')).toBe('false')
  })

  it('beschriftet die Gruppe und die Schaltflächen', () => {
    const wrapper = mountToggle()

    expect(wrapper.attributes('aria-label')).toBe(i18n.global.t('user.language'))
    expect(wrapper.find('[data-locale="de"]').attributes('aria-label')).toBe('Deutsch')
    expect(wrapper.find('[data-locale="en"]').attributes('aria-label')).toBe('English')
  })

  it('wechselt die Sprache und merkt sie', async () => {
    const wrapper = mountToggle()

    await wrapper.find('[data-locale="en"]').trigger('click')

    expect(locale.value).toBe('en')
    expect(i18n.global.locale.value).toBe('en')
    expect(document.documentElement.lang).toBe('en')
    expect(window.localStorage.getItem('locale')).toBe('en')
    expect(wrapper.find('[data-locale="en"]').attributes('aria-pressed')).toBe('true')
    expect(wrapper.find('[data-locale="de"]').attributes('aria-pressed')).toBe('false')

    await wrapper.find('[data-locale="de"]').trigger('click')

    expect(locale.value).toBe('de')
    expect(i18n.global.locale.value).toBe('de')
  })
})
