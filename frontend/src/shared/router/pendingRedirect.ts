import { safeRedirect } from './safeRedirect'

const STORAGE_KEY = 'cookeroo.auth.pendingRedirect'

/**
 * Merkt sich einen internen Pfad, zu dem der Nutzer nach Registrierung,
 * E-Mail-Bestätigung und Anmeldung zurückkehren soll.
 */
export function savePendingRedirect(value: unknown): void {
  const path = safeRedirect(value, '')

  if (!path) {
    return
  }

  try {
    localStorage.setItem(STORAGE_KEY, path)
  } catch {
    // Storage kann in privaten Browsern blockiert sein.
  }
}

/** Liest und löscht das gemerkte Redirect-Ziel. */
export function takePendingRedirect(): string | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY)

    localStorage.removeItem(STORAGE_KEY)

    return safeRedirect(value, '') || null
  } catch {
    return null
  }
}

export function clearPendingRedirect(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Storage kann in privaten Browsern blockiert sein.
  }
}
