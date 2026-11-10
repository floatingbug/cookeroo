import config from '../config/index.js';
import logger from './logger.js';
import { AppError } from '../types/errors.js';

export interface OffProduct {
  code: string;
  productName: string | null;
  brands: string | null;
  categories: string | null;
  imageUrl: string | null;
  nutriscoreGrade: string | null;
}

export interface OffSearchResult {
  products: OffProduct[];
  count: number;
  page: number;
  pageSize: number;
}

interface SearchProductsInput {
  searchTerms: string;
  page: number;
  pageSize: number;
}

interface CacheEntry {
  expiresAt: number;
  value: OffSearchResult;
}

/**
 * Einfacher TTL-Cache für Suchergebnisse, um die Rate-Limits von
 * OpenFoodFacts (10 Suchanfragen pro Minute und IP) nicht zu sprengen.
 * Map erhält die Einfügereihenfolge; älteste Einträge fliegen zuerst raus.
 */
const searchCache = new Map<string, CacheEntry>();

function cacheGet(key: string): OffSearchResult | null {
  const entry = searchCache.get(key);

  if (!entry) {
    return null;
  }

  if (entry.expiresAt <= Date.now()) {
    searchCache.delete(key);

    return null;
  }

  // Frischen Treffer ans Ende verschieben (LRU-Verhalten).
  searchCache.delete(key);
  searchCache.set(key, entry);

  return entry.value;
}

function cacheSet(key: string, value: OffSearchResult): void {
  searchCache.set(key, {
    expiresAt: Date.now() + config.offConfig.cacheTtlMs,
    value,
  });

  while (searchCache.size > config.offConfig.cacheMaxEntries) {
    const oldestKey = searchCache.keys().next().value;

    if (oldestKey === undefined) {
      break;
    }

    searchCache.delete(oldestKey);
  }
}

function asText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

interface RawOffProduct {
  code?: unknown;
  product_name?: unknown;
  brands?: unknown;
  categories?: unknown;
  image_front_url?: unknown;
  image_url?: unknown;
  nutriscore_grade?: unknown;
}

interface RawOffSearchResponse {
  count?: unknown;
  page?: unknown;
  page_size?: unknown;
  products?: unknown;
}

function normalizeProduct(raw: RawOffProduct): OffProduct | null {
  const code = asText(raw.code);

  if (!code) {
    return null;
  }

  return {
    code,
    productName: asText(raw.product_name),
    brands: asText(raw.brands),
    categories: asText(raw.categories),
    imageUrl: asText(raw.image_front_url) ?? asText(raw.image_url),
    nutriscoreGrade: asText(raw.nutriscore_grade),
  };
}

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'User-Agent': config.offConfig.userAgent,
    Accept: 'application/json',
  };

  if (config.offConfig.basicAuth) {
    const encoded = Buffer.from(config.offConfig.basicAuth).toString('base64');

    headers.Authorization = `Basic ${encoded}`;
  }

  return headers;
}

/**
 * Volltextsuche über den Legacy-Endpoint `/cgi/search.pl`. Eine serverseitige
 * Volltextsuche bietet OpenFoodFacts nur dort (nicht in API v2/v3).
 */
async function searchProducts({ searchTerms, page, pageSize }: SearchProductsInput): Promise<OffSearchResult> {
  const cacheKey = `${searchTerms}|${page}|${pageSize}`;
  const cached = cacheGet(cacheKey);

  if (cached) {
    return cached;
  }

  const url = new URL('/cgi/search.pl', config.offConfig.baseUrl);

  url.searchParams.set('search_terms', searchTerms);
  url.searchParams.set('search_simple', '1');
  url.searchParams.set('action', 'process');
  url.searchParams.set('json', '1');
  url.searchParams.set('page', String(page));
  url.searchParams.set('page_size', String(pageSize));

  let response: Response;

  try {
    response = await fetch(url, {
      headers: buildHeaders(),
      signal: AbortSignal.timeout(config.offConfig.timeoutMs),
    });
  }
  catch (err) {
    logger.error({ err, url: String(url) }, 'OpenFoodFacts request failed');

    throw new AppError(502, 'Product search is currently unavailable.');
  }

  if (response.status === 429) {
    logger.warn({ url: String(url) }, 'OpenFoodFacts rate limit reached');

    throw new AppError(429, 'Product search is rate limited. Please try again later.');
  }

  if (!response.ok) {
    logger.error({ url: String(url), status: response.status }, 'OpenFoodFacts returned an error');

    throw new AppError(502, 'Product search is currently unavailable.');
  }

  let raw: RawOffSearchResponse;

  try {
    raw = await response.json() as RawOffSearchResponse;
  }
  catch (err) {
    logger.error({ err, url: String(url) }, 'OpenFoodFacts returned invalid JSON');

    throw new AppError(502, 'Product search is currently unavailable.');
  }

  const rawProducts = Array.isArray(raw.products) ? raw.products as RawOffProduct[] : [];
  const result: OffSearchResult = {
    products: rawProducts
      .map(normalizeProduct)
      .filter((product): product is OffProduct => product !== null),
    count: typeof raw.count === 'number' ? raw.count : rawProducts.length,
    page: typeof raw.page === 'number' ? raw.page : page,
    pageSize: typeof raw.page_size === 'number' ? raw.page_size : pageSize,
  };

  cacheSet(cacheKey, result);

  return result;
}

export default {
  searchProducts,
};
