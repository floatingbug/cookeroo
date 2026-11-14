import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import i18n from '@/app/i18n'
import Input from './Input.vue'

function mountInput(props: Record<string, unknown> = {}) {
  return mount(Input, {
    props: {
      id: 'password',
      label: 'Passwort',
      modelValue: '',
      ...props,
    },
    global: { plugins: [i18n] },
  })
}

describe('Input', () => {
  it('zeigt bei Passwortfeldern einen Umschalter für die Sichtbarkeit', () => {
    const wrapper = mountInput({ type: 'password' })
    const toggle = wrapper.find('button')

    expect(wrapper.find('input').attributes('type')).toBe('password')
    expect(toggle.exists()).toBe(true)
    expect(toggle.attributes('type')).toBe('button')
    expect(toggle.attributes('aria-label')).toBe(i18n.global.t('common.showPassword'))
    expect(toggle.attributes('aria-pressed')).toBe('false')
  })

  it('schaltet zwischen verborgenem und sichtbarem Passwort um', async () => {
    const wrapper = mountInput({ type: 'password' })

    await wrapper.find('button').trigger('click')

    expect(wrapper.find('input').attributes('type')).toBe('text')
    expect(wrapper.find('button').attributes('aria-label')).toBe(
      i18n.global.t('common.hidePassword'),
    )
    expect(wrapper.find('button').attributes('aria-pressed')).toBe('true')

    await wrapper.find('button').trigger('click')

    expect(wrapper.find('input').attributes('type')).toBe('password')
    expect(wrapper.find('button').attributes('aria-label')).toBe(
      i18n.global.t('common.showPassword'),
    )
    expect(wrapper.find('button').attributes('aria-pressed')).toBe('false')
  })

  it('zeigt bei anderen Feldern keinen Umschalter', () => {
    const wrapper = mountInput({ type: 'email' })

    expect(wrapper.find('button').exists()).toBe(false)
    expect(wrapper.find('input').attributes('type')).toBe('email')
  })
})
