import { test, before, after } from 'node:test';
import type { TestContext } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import testServerModule from './helpers/testServer.js';
import type { TestServer } from './helpers/testServer.js';

const { startTestServer } = testServerModule;

let server: TestServer;
let offMock: http.Server;
let offBaseUrl: string;

interface OffRequest {
    url: string;
    userAgent: string | undefined;
    authorization: string | undefined;
}

const offRequests: OffRequest[] = [];

interface ApiOptions {
    method?: string;
    body?: unknown;
    token?: string;
}

interface ApiResponse {
    status: number;
    body: any;
    text: string;
}

async function api(path: string, { method = 'GET', body, token }: ApiOptions = {}): Promise<ApiResponse> {
    const headers: Record<string, string> = {};

    if (body !== undefined) {
        headers['content-type'] = 'application/json';
    }

    if (token) {
        headers.authorization = `Bearer ${token}`;
    }

    const response = await fetch(server.baseUrl + path, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
    });

    const text = await response.text();
    let parsed: any = null;

    if (text) {
        try {
            parsed = JSON.parse(text);
        }
        catch {
            parsed = text;
        }
    }

    return { status: response.status, body: parsed, text };
}

/**
 * Minimaler Mock der OpenFoodFacts-Suche (`/cgi/search.pl`), damit die Tests
 * nicht von Netzwerk, Rate-Limits oder dem Inhalt der echten Datenbank abhängen.
 */
function startOffMock(): Promise<void> {
    offMock = http.createServer((req, res) => {
        const url = new URL(req.url || '', 'http://localhost');

        offRequests.push({
            url: req.url || '',
            userAgent: req.headers['user-agent'],
            authorization: req.headers.authorization,
        });

        if (url.pathname !== '/cgi/search.pl') {
            res.writeHead(404, { 'content-type': 'application/json' });
            res.end(JSON.stringify({ error: 'not found' }));

            return;
        }

        const searchTerms = url.searchParams.get('search_terms') || '';

        if (searchTerms === 'offline') {
            res.writeHead(503, { 'content-type': 'text/plain' });
            res.end('Service Unavailable');

            return;
        }

        if (searchTerms === 'ratelimit') {
            res.writeHead(429, { 'content-type': 'text/plain' });
            res.end('Too Many Requests');

            return;
        }

        const page = Number(url.searchParams.get('page') || '1');
        const pageSize = Number(url.searchParams.get('page_size') || '12');

        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(
            JSON.stringify({
                count: 2,
                page,
                page_size: pageSize,
                products: [
                    {
                        code: '3017620422003',
                        product_name: 'Nutella',
                        brands: 'Ferrero',
                        categories: 'Spreads, Chocolate spreads',
                        image_front_url: 'https://images.openfoodfacts.org/front.jpg',
                        image_url: 'https://images.openfoodfacts.org/any.jpg',
                        nutriscore_grade: 'e',
                    },
                    {
                        // Produkt mit minimalem Datensatz: alles außer code fehlt.
                        code: '4000521000004',
                        product_name: '',
                    },
                ],
            })
        );
    });

    return new Promise((resolve) => {
        offMock.listen(0, '127.0.0.1', () => {
            const { port } = offMock.address() as AddressInfo;

            offBaseUrl = `http://127.0.0.1:${port}`;
            resolve();
        });
    });
}

before(async () => {
    await startOffMock();

    server = await startTestServer({
        env: {
            OFF_BASE_URL: offBaseUrl,
            OFF_USER_AGENT: 'CookerooTest/1.0 (test@example.com)',
            OFF_CACHE_TTL_MS: '60000',
        },
    });
});

after(async () => {
    await server.close();

    await new Promise<void>((resolve) => {
        offMock.close(() => resolve());
    });
});

test('Produkt-API', async (t: TestContext) => {
    let token: string | undefined;

    await t.test('meldet einen Testnutzer an', async () => {
        const suffix = `${process.pid}_${Date.now()}`;
        const mark = server.output().length;
        const signUp = await api('/auth/sign-up', {
            method: 'POST',
            body: {
                name: `product_${suffix}`,
                email: `product_${suffix}@example.com`,
                password: 'Passwort1',
            },
        });

        assert.equal(signUp.status, 201);

        const match = await server.waitForLog(mark, /\/verify-email\?token=([a-f0-9]{64})/);

        const verify = await api(`/auth/verify-email?token=${match[1]}`);

        assert.equal(verify.status, 200);

        const signIn = await api('/auth/sign-in', {
            method: 'POST',
            body: { nameOrEmail: `product_${suffix}@example.com`, password: 'Passwort1' },
        });

        assert.equal(signIn.status, 200);
        token = signIn.body.accessToken;
    });

    await t.test('verlangt ein Access-Token', async () => {
        const response = await api('/products/search?q=Nutella');

        assert.equal(response.status, 401);
    });

    await t.test('lehnt fehlende oder zu kurze Suchbegriffe ab', async () => {
        const missing = await api('/products/search', { token });

        assert.equal(missing.status, 400);

        const tooShort = await api('/products/search?q=N', { token });

        assert.equal(tooShort.status, 400);

        const invalidPageSize = await api('/products/search?q=Nutella&pageSize=99', { token });

        assert.equal(invalidPageSize.status, 400);
    });

    await t.test('sucht Produkte und normalisiert die OFF-Antwort', async () => {
        const before = offRequests.length;
        const response = await api('/products/search?q=Nutella&page=2&pageSize=5', { token });

        assert.equal(response.status, 200, response.text);
        assert.equal(response.body.count, 2);
        assert.equal(response.body.page, 2);
        assert.equal(response.body.pageSize, 5);
        assert.equal(response.body.products.length, 2);

        assert.deepEqual(response.body.products[0], {
            code: '3017620422003',
            productName: 'Nutella',
            brands: 'Ferrero',
            categories: 'Spreads, Chocolate spreads',
            imageUrl: 'https://images.openfoodfacts.org/front.jpg',
            nutriscoreGrade: 'e',
        });

        assert.deepEqual(response.body.products[1], {
            code: '4000521000004',
            productName: null,
            brands: null,
            categories: null,
            imageUrl: null,
            nutriscoreGrade: null,
        });

        assert.equal(offRequests.length, before + 1);

        const offRequest = offRequests[before]!;
        const offUrl = new URL(offRequest.url, offBaseUrl);

        assert.equal(offUrl.pathname, '/cgi/search.pl');
        assert.equal(offUrl.searchParams.get('search_terms'), 'Nutella');
        assert.equal(offUrl.searchParams.get('json'), '1');
        assert.equal(offUrl.searchParams.get('page'), '2');
        assert.equal(offUrl.searchParams.get('page_size'), '5');
        assert.match(offRequest.userAgent || '', /^CookerooTest\/1\.0 \(test@example\.com\)$/);
    });

    await t.test('beantwortet identische Suchen aus dem Cache', async () => {
        const before = offRequests.length;
        const first = await api('/products/search?q=Cache-Probe', { token });
        const second = await api('/products/search?q=Cache-Probe', { token });

        assert.equal(first.status, 200);
        assert.equal(second.status, 200);
        assert.deepEqual(second.body, first.body);
        assert.equal(offRequests.length, before + 1, 'Zweite identische Suche traf erneut OpenFoodFacts');

        const other = await api('/products/search?q=Andere-Suche', { token });

        assert.equal(other.status, 200);
        assert.equal(offRequests.length, before + 2, 'Neue Suche traf nicht OpenFoodFacts');
    });

    await t.test('meldet OFF-Ausfall als 502', async () => {
        const response = await api('/products/search?q=offline', { token });

        assert.equal(response.status, 502);
        assert.equal(response.body.message, 'Product search is currently unavailable.');
    });

    await t.test('gibt das OFF-Rate-Limit als 429 weiter', async () => {
        const response = await api('/products/search?q=ratelimit', { token });

        assert.equal(response.status, 429);
        assert.equal(response.body.message, 'Product search is rate limited. Please try again later.');
    });
});
