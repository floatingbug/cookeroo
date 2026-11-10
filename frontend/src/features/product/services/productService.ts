import type { ProductSearchResponse } from '@/shared/api/types'
import { searchProductsApi } from '../api/searchProductsApi'

export const MIN_SEARCH_TERM_LENGTH = 2

interface SearchProductsInput {
  searchTerm: string
  page?: number
  pageSize?: number
}

/** Liefert den i18n-Key bei einem ungültigen Suchbegriff, sonst `null`. */
export function validateSearchTerm(searchTerm: string): string | null {
  if (searchTerm.trim().length < MIN_SEARCH_TERM_LENGTH) {
    return 'product.errors.queryTooShort'
  }

  return null
}

export function searchProducts({
  searchTerm,
  page,
  pageSize,
}: SearchProductsInput): Promise<ProductSearchResponse> {
  return searchProductsApi({ q: searchTerm.trim(), page, pageSize })
}

interface ErrorWithStatus {
  status?: number
}

function statusOf(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    return (error as ErrorWithStatus).status
  }

  return undefined
}

/**
 * Übersetzt API-Fehler in i18n-Keys. Backend-Meldungen sind englisch und
 * werden bewusst nicht direkt angezeigt (gleiches Vorgehen wie bei auth).
 */
export function getProductErrorKey(error: unknown): string {
  const status = statusOf(error)

  if (!status) {
    return 'product.errors.network'
  }

  if (status === 429) {
    return 'product.errors.rateLimit'
  }

  if (status === 502) {
    return 'product.errors.unavailable'
  }

  return 'product.errors.generic'
}
