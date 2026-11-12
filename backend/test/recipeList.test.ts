import { test, before, after } from 'node:test';
import type { TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { ObjectId } from 'mongodb';
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

function recipeBody(title: string, isPublic: boolean): Record<string, unknown> {
    return {
        title,
        prepTime: 10,
        cookTime: 20,
        servings: 2,
        ingredients: [
            { name: 'Zutat A', quantity: 200, unit: 'g', note: null, isOptional: false },
        ],
        instructions: [
            { step: 1, description: 'Alles zubereiten.', duration: 5, imageUrl: null },
        ],
        isPublic,
    };
}

function wait(milliseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

before(async () => {
    server = await startTestServer();
});

after(async () => {
    await server.close();
});

test('Recipe List API', async (t: TestContext) => {
    let owner: ApiUser;
    let other: ApiUser;

    await t.test('legt zwei Testnutzer an', async () => {
        owner = await createUser('recipe_list_owner');
        other = await createUser('recipe_list_other');

        assert.match(owner.id, /^[a-f0-9]{24}$/);
        assert.match(other.id, /^[a-f0-9]{24}$/);
    });

    await t.test('verlangt ein Access-Token', async () => {
        const response = await api('/recipes');

        assert.equal(response.status, 401);
    });

    await t.test('liefert für einen neuen Benutzer eine leere Liste', async () => {
        const response = await api('/recipes', { token: owner.token });

        assert.equal(response.status, 200, response.text);
        assert.deepEqual(response.body, []);
    });

    await t.test('liefert nur eigene Rezepte, neueste zuerst', async () => {
        const first = await api('/recipes', {
            method: 'POST',
            body: recipeBody('Eigenes öffentliches Rezept', true),
            token: owner.token,
        });

        assert.equal(first.status, 201, first.text);

        await wait(5);

        const second = await api('/recipes', {
            method: 'POST',
            body: recipeBody('Eigenes privates Rezept', false),
            token: owner.token,
        });

        assert.equal(second.status, 201, second.text);

        const foreign = await api('/recipes', {
            method: 'POST',
            body: recipeBody('Öffentliches Rezept eines anderen', true),
            token: other.token,
        });

        assert.equal(foreign.status, 201, foreign.text);

        const response = await api('/recipes', { token: owner.token });

        assert.equal(response.status, 200, response.text);
        assert.ok(Array.isArray(response.body));
        assert.deepEqual(
            response.body.map((recipe: { title: string }) => recipe.title),
            ['Eigenes privates Rezept', 'Eigenes öffentliches Rezept'],
        );
        assert.equal(response.body[0].createdBy, owner.id);
        assert.equal(response.body[0].status, 'private');
        assert.equal(response.body[1].status, 'public');
    });

    await t.test('entfernt nicht im Vertrag definierte Felder aus der Response', async () => {
        const legacy = await createUser('recipe_list_legacy');
        const now = new Date();

        const inserted = await server.db.collection('recipes').insertOne({
            title: 'Alt-Dokument mit Zusatzfeldern',
            description: null,
            imageUrl: null,
            category: null,
            cuisine: null,
            difficulty: null,
            prepTime: 5,
            cookTime: 5,
            restTime: null,
            servings: 1,
            servingUnit: null,
            tags: [],
            ingredients: [
                {
                    name: 'Zucker',
                    quantity: 100,
                    unit: 'g',
                    note: null,
                    isOptional: false,
                    foodId: null,
                },
            ],
            instructions: [
                {
                    step: 1,
                    description: 'Mischen.',
                    duration: null,
                    imageUrl: null,
                    extraField: 'entfernen',
                },
            ],
            nutrition: null,
            createdAt: now,
            updatedAt: now,
            createdBy: new ObjectId(legacy.id),
            isPublic: false,
            status: 'private',
        });

        const recipeId = inserted.insertedId.toHexString();
        const list = await api('/recipes', { token: legacy.token });

        assert.equal(list.status, 200, list.text);

        const listed = list.body.find((recipe: { id: string }) => recipe.id === recipeId);

        assert.ok(listed);
        assert.equal('foodId' in listed.ingredients[0], false);
        assert.equal('extraField' in listed.instructions[0], false);

        const detail = await api(`/recipes/${recipeId}`, { token: legacy.token });

        assert.equal(detail.status, 200, detail.text);
        assert.equal('foodId' in detail.body.ingredients[0], false);
        assert.equal('extraField' in detail.body.instructions[0], false);
    });

    await t.test('liefert null für veraltete Nährwertstrukturen', async () => {
        const legacy = await createUser('recipe_list_legacy_nutrition');
        const now = new Date();

        const inserted = await server.db.collection('recipes').insertOne({
            title: 'Alt-Dokument mit flachen Nährwerten',
            description: null,
            imageUrl: null,
            category: null,
            cuisine: null,
            difficulty: null,
            prepTime: 5,
            cookTime: 5,
            restTime: null,
            servings: 1,
            servingUnit: null,
            tags: [],
            ingredients: [
                {
                    name: 'Zucker',
                    quantity: 100,
                    unit: 'g',
                    note: null,
                    isOptional: false,
                },
            ],
            instructions: [
                {
                    step: 1,
                    description: 'Mischen.',
                    duration: null,
                    imageUrl: null,
                },
            ],
            nutrition: {
                calories: null,
                protein: null,
                carbohydrates: null,
                fat: null,
                saturatedFat: null,
                sugar: null,
                fiber: null,
                salt: null,
            },
            createdAt: now,
            updatedAt: now,
            createdBy: new ObjectId(legacy.id),
            isPublic: false,
            status: 'private',
        });

        const recipeId = inserted.insertedId.toHexString();
        const list = await api('/recipes', { token: legacy.token });

        assert.equal(list.status, 200, list.text);

        const listed = list.body.find((recipe: { id: string }) => recipe.id === recipeId);

        assert.ok(listed);
        assert.equal(listed.nutrition, null);

        const detail = await api(`/recipes/${recipeId}`, { token: legacy.token });

        assert.equal(detail.status, 200, detail.text);
        assert.equal(detail.body.nutrition, null);
    });
});
