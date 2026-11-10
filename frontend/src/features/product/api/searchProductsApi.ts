import { apiFetch } from '@/shared/api/apiFetch'
import type { ProductSearchResponse } from '@/shared/api/types'

export interface SearchProductsParams {
  /** Volltext-Suchbegriff (Produktname) */
  q: string
  /** 1-basierte Seitenzahl */
  page?: number
  /** Treffer pro Seite (1–24) */
  pageSize?: number
}

/**
 * `GET /products/search` – Produktsuche über OpenFoodFacts.
 * `page` und `pageSize` werden laut Vertrag als numerische Strings übergeben.
 */
export function searchProductsApi({
  q,
  page,
  pageSize,
}: SearchProductsParams): Promise<ProductSearchResponse> {
  const params = new URLSearchParams({ q })

  if (page !== undefined) {
    params.set('page', String(page))
  }

  if (pageSize !== undefined) {
    params.set('pageSize', String(pageSize))
  }

  return apiFetch<ProductSearchResponse>(`/products/search?${params.toString()}`)
}
