import { ref } from 'vue'

export const LOCALES = ['de', 'en'] as const
export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'de'

const STORAGE_KEY = 'locale'

function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
}

/**
 * Gespeicherte Sprache; fehlt sie oder ist sie ungültig, gilt die Standardsprache.
 */
export function readStoredLocale(): Locale {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return isLocale(stored) ? stored : DEFAULT_LOCALE
  } catch {
    return DEFAULT_LOCALE
  }
}

/** Aktuelle Sprache der Oberfläche. */
export const locale = ref<Locale>(readStoredLocale())

function applyLocale(value: Locale): void {
  document.documentElement.lang = value
}

function persistLocale(value: Locale): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, value)
  } catch {
    // Ohne Storage funktioniert die Sprache weiterhin für die aktuelle Sitzung.
  }
}

/**
 * Wechselt die Sprache und merkt sie für den nächsten Besuch.
 */
export function setLocale(value: unknown): void {
  if (!isLocale(value)) {
    return
  }

  locale.value = value
  applyLocale(value)
  persistLocale(value)
}

// Sprache beim Start am Dokument setzen, damit Screenreader und Browser sie kennen.
applyLocale(locale.value)
