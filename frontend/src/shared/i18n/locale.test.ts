import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

async function loadLocale(): Promise<typeof import('./locale')> {
  return import('./locale')
}

describe('locale', () => {
  beforeEach(() => {
    vi.resetModules()
    window.localStorage.clear()
    document.documentElement.removeAttribute('lang')
  })

  afterEach(() => {
    window.localStorage.clear()
    document.documentElement.lang = 'de'
  })

  it('nutzt ohne gespeicherten Wert Deutsch', async () => {
    const { locale, LOCALES } = await loadLocale()

    expect(LOCALES).toEqual(['de', 'en'])
    expect(locale.value).toBe('de')
    expect(document.documentElement.lang).toBe('de')
  })

  it('liest eine gespeicherte Sprache', async () => {
    window.localStorage.setItem('locale', 'en')

    const { locale } = await loadLocale()

    expect(locale.value).toBe('en')
    expect(document.documentElement.lang).toBe('en')
  })

  it('ignoriert ungültige gespeicherte Werte', async () => {
    window.localStorage.setItem('locale', 'fr')

    const { locale } = await loadLocale()

    expect(locale.value).toBe('de')
  })

  it('setzt die Sprache am Dokument und speichert sie', async () => {
    const { locale, readStoredLocale, setLocale } = await loadLocale()

    setLocale('en')

    expect(locale.value).toBe('en')
    expect(document.documentElement.lang).toBe('en')
    expect(readStoredLocale()).toBe('en')

    setLocale('de')

    expect(document.documentElement.lang).toBe('de')
    expect(window.localStorage.getItem('locale')).toBe('de')
  })

  it('ignoriert unbekannte Sprachen', async () => {
    const { locale, setLocale } = await loadLocale()

    setLocale('fr')

    expect(locale.value).toBe('de')
    expect(window.localStorage.getItem('locale')).toBeNull()
  })
})
