import { test, before, after } from 'node:test';
import type { TestContext } from 'node:test';
import assert from 'node:assert/strict';
import testServerModule from './helpers/testServer.js';
import type { TestServer } from './helpers/testServer.js';

const { startTestServer } = testServerModule;

let server: TestServer;

interface ApiUser {
    id: string;
    token: string;
}

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

let userCounter = 0;

async function createUser(prefix: string): Promise<ApiUser> {
    const suffix = `${process.pid}_${Date.now()}_${userCounter++}`;
    const name = `${prefix}_${suffix}`;
    const email = `${name}@example.com`;
    const mark = server.output().length;

    const signUp = await api('/auth/sign-up', {
        method: 'POST',
        body: { name, email, password: 'Passwort1' },
    });

    assert.equal(signUp.status, 201, signUp.text);

    const match = await server.waitForLog(mark, /\/verify-email\?token=([a-f0-9]{64})/);
    const verify = await api(`/auth/verify-email?token=${match[1]}`);

    assert.equal(verify.status, 200, verify.text);

    const signIn = await api('/auth/sign-in', {
        method: 'POST',
        body: { nameOrEmail: email, password: 'Passwort1' },
    });

    assert.equal(signIn.status, 200, signIn.text);

    return { id: signIn.body.user.id, token: signIn.body.accessToken };
}

async function createRecipe(
    user: ApiUser,
    title: string,
    tags: string[],
    isPublic: boolean,
): Promise<string> {
    const response = await api('/recipes', {
        method: 'POST',
        token: user.token,
        body: {
            title,
            tags,
            prepTime: 10,
            cookTime: 20,
            servings: 2,
            ingredients: [
                { name: 'Zutat A', quantity: 100, unit: 'g', note: null, isOptional: false },
            ],
            instructions: [
                { step: 1, description: 'Zubereiten und servieren.', duration: null, imageUrl: null },
            ],
            isPublic,
        },
    });

    assert.equal(response.status, 201, response.text);

    return response.body.id as string;
}

before(async () => {
    server = await startTestServer();
});

after(async () => {
    await server.close();
});

test('Recipe Search API', async (t: TestContext) => {
    let owner: ApiUser;
    let other: ApiUser;

    await t.test('legt Testnutzer und Rezepte an', async () => {
        owner = await createUser('recipe_search_owner');
        other = await createUser('recipe_search_other');

        await createRecipe(owner, 'Schnelle Gemüsepfanne', ['Vegetarisch', 'Vegan', 'Schnell'], false);
        await createRecipe(owner, 'Schnelle Pasta', ['Schnell', 'Pasta'], true);
        await createRecipe(other, 'Vegane Suppe', ['Vegan', 'Schnell'], true);
        await createRecipe(other, 'Geheimes Rezept', ['Geheim', 'Vegan'], false);

        for (let index = 1; index <= 12; index += 1) {
            await createRecipe(
                owner,
                `Pagination ${index}`,
                index === 1 ? ['Pagination', 'schnell'] : ['Pagination'],
                true,
            );
        }
    });

    await t.test('verlangt Authentifizierung', async () => {
        const search = await api('/recipes/search');
        const tags = await api('/recipes/tags');

        assert.equal(search.status, 401);
        assert.equal(tags.status, 401);
    });

    await t.test('sucht case-insensitiv im Titel und beachtet die Zugriffsrechte', async () => {
        const response = await api('/recipes/search?q=schnelle', { token: owner.token });

        assert.equal(response.status, 200, response.text);
        assert.deepEqual(
            response.body.items.map((item: { title: string }) => item.title).sort(),
            ['Schnelle Gemüsepfanne', 'Schnelle Pasta'],
        );
        assert.equal(response.body.nextOffset, null);

        const hidden = await api('/recipes/search?q=Geheim', { token: owner.token });

        assert.equal(hidden.status, 200, hidden.text);
        assert.deepEqual(hidden.body.items, []);

        const ownPrivate = await api('/recipes/search?q=Geheim', { token: other.token });

        assert.equal(ownPrivate.status, 200, ownPrivate.text);
        assert.equal(ownPrivate.body.items.length, 1);
    });

    await t.test('filtert nach einem Tag', async () => {
        const response = await api('/recipes/search?tags=Vegan', { token: owner.token });

        assert.equal(response.status, 200, response.text);
        assert.deepEqual(
            response.body.items.map((item: { title: string }) => item.title).sort(),
            ['Schnelle Gemüsepfanne', 'Vegane Suppe'],
        );
    });

    await t.test('kombiniert mehrere Tags mit UND', async () => {
        const response = await api('/recipes/search?tags=vegan&tags=schnell', {
            token: owner.token,
        });

        assert.equal(response.status, 200, response.text);
        assert.deepEqual(
            response.body.items.map((item: { title: string }) => item.title).sort(),
            ['Schnelle Gemüsepfanne', 'Vegane Suppe'],
        );
    });

    await t.test('liefert höchstens zehn Treffer und den nächsten Offset', async () => {
        const firstPage = await api('/recipes/search?q=Pagination', { token: owner.token });

        assert.equal(firstPage.status, 200, firstPage.text);
        assert.equal(firstPage.body.items.length, 10);
        assert.equal(firstPage.body.nextOffset, 10);

        const secondPage = await api('/recipes/search?q=Pagination&offset=10', {
            token: owner.token,
        });

        assert.equal(secondPage.status, 200, secondPage.text);
        assert.equal(secondPage.body.items.length, 2);
        assert.equal(secondPage.body.nextOffset, null);
    });

    await t.test('liefert die verfügbaren Tags dedupliziert', async () => {
        const response = await api('/recipes/tags', { token: owner.token });

        assert.equal(response.status, 200, response.text);
        assert.ok(Array.isArray(response.body));

        const lowerCaseTags = response.body.map((tag: string) => tag.toLocaleLowerCase());

        for (const expected of ['vegetarisch', 'vegan', 'schnell', 'pasta', 'pagination']) {
            assert.ok(lowerCaseTags.includes(expected), `Tag ${expected} fehlt`);
        }

        assert.ok(!lowerCaseTags.includes('geheim'));
        assert.equal(lowerCaseTags.filter((tag: string) => tag === 'schnell').length, 1);
    });

    await t.test('weist ungültige Suchparameter ab', async () => {
        const invalidOffset = await api('/recipes/search?offset=abc', { token: owner.token });
        const longQuery = await api(`/recipes/search?q=${'a'.repeat(101)}`, {
            token: owner.token,
        });

        assert.equal(invalidOffset.status, 400);
        assert.equal(longQuery.status, 400);
    });
});
