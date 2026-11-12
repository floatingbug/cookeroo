import { beforeEach, describe, expect, it } from 'vitest'

import { clearPendingRedirect, savePendingRedirect, takePendingRedirect } from './pendingRedirect'

describe('pendingRedirect', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('merkt sich einen internen Pfad und liest ihn einmalig', () => {
    savePendingRedirect('/meal-plan/join/abc')

    expect(takePendingRedirect()).toBe('/meal-plan/join/abc')
    expect(takePendingRedirect()).toBeNull()
  })

  it('ignoriert externe oder ungültige Ziele', () => {
    savePendingRedirect('https://example.com')
    savePendingRedirect('//example.com')
    savePendingRedirect('/\\example.com')

    expect(takePendingRedirect()).toBeNull()
  })

  it('löscht ein gemerktes Ziel', () => {
    savePendingRedirect('/meal-plan')
    clearPendingRedirect()

    expect(takePendingRedirect()).toBeNull()
  })
})
