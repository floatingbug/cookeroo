/**
 * Konfiguration für die OpenFoodFacts-API.
 *
 * `baseUrl` zeigt standardmäßig auf die Produktionsumgebung; für Entwicklung
 * und Tests kann die Staging-Umgebung (https://world.openfoodfacts.net)
 * verwendet werden, die `basicAuth` im Format `user:pass` benötigt (off:off).
 */
const offConfig = {
    baseUrl: process.env.OFF_BASE_URL || 'https://world.openfoodfacts.org',
    // OpenFoodFacts verlangt einen identifizierbaren User-Agent
    // im Format AppName/Version (ContactEmail).
    userAgent: process.env.OFF_USER_AGENT || 'Cookeroo/1.0 (cookeroo@example.com)',
    basicAuth: process.env.OFF_BASIC_AUTH || '',
    timeoutMs: parseInt(process.env.OFF_TIMEOUT_MS ?? '', 10) || 10000,
    cacheTtlMs: parseInt(process.env.OFF_CACHE_TTL_MS ?? '', 10) || 5 * 60 * 1000,
    cacheMaxEntries: parseInt(process.env.OFF_CACHE_MAX_ENTRIES ?? '', 10) || 200,
};

export type OffConfig = typeof offConfig;

export default offConfig;
