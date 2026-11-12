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

function validRecipe(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
        title: 'Testrezept',
        description: 'Ein einfaches Testrezept.',
        category: 'Hauptgericht',
        cuisine: 'Italienisch',
        difficulty: 'easy',
        prepTime: 10,
        cookTime: 20,
        restTime: 5,
        servings: 2,
        servingUnit: 'Portion',
        tags: ['Nudeln', 'Schnell'],
        ingredients: [
            { name: 'Zutat A', quantity: 200, unit: 'g', note: null, isOptional: false },
            { name: 'Zutat B', quantity: 0.1, unit: 'kg', note: 'fein gehackt', isOptional: false },
            { name: 'Zutat C', quantity: 100, unit: 'ml', note: null, isOptional: true },
        ],
        instructions: [
            { step: 1, description: 'Alles vorbereiten.', duration: 5, imageUrl: null },
            { step: 2, description: 'Kochen und servieren.', duration: null, imageUrl: null },
        ],
        ...overrides,
    };
}

function assertClose(actual: number, expected: number, epsilon = 0.001): void {
    assert.ok(Math.abs(actual - expected) < epsilon, `${actual} ist nicht nahe ${expected}`);
}

before(async () => {
    server = await startTestServer();
});

after(async () => {
    await server.close();
});

test('Recipe API', async (t: TestContext) => {
    let owner: ApiUser;
    let other: ApiUser;

    await t.test('legt zwei Testnutzer an', async () => {
        owner = await createUser('recipe_owner');
        other = await createUser('recipe_other');

        assert.match(owner.id, /^[a-f0-9]{24}$/);
        assert.match(other.id, /^[a-f0-9]{24}$/);
    });

    await t.test('verlangt ein Access-Token', async () => {
        const create = await api('/recipes', { method: 'POST', body: validRecipe() });
        const get = await api(`/recipes/${owner.id}`);

        assert.equal(create.status, 401);
        assert.equal(get.status, 401);
    });

    await t.test('lehnt fehlende Pflichtfelder und ungültige Einheiten ab', async () => {
        const missing = await api('/recipes', { method: 'POST', body: {}, token: owner.token });

        assert.equal(missing.status, 400);

        const emptyIngredients = await api('/recipes', {
            method: 'POST',
            body: validRecipe({ ingredients: [] }),
            token: owner.token,
        });

        assert.equal(emptyIngredients.status, 400);

        const invalidUnit = await api('/recipes', {
            method: 'POST',
            body: validRecipe({
                ingredients: [{ name: 'Zutat', quantity: 1, unit: 'cup' }],
            }),
            token: owner.token,
        });

        assert.equal(invalidUnit.status, 400);
    });

    await t.test('lehnt doppelte Schrittnummern ab', async () => {
        const response = await api('/recipes', {
            method: 'POST',
            body: validRecipe({
                instructions: [
                    { step: 1, description: 'Erster Schritt', duration: null, imageUrl: null },
                    { step: 1, description: 'Noch einmal Schritt 1', duration: null, imageUrl: null },
                ],
            }),
            token: owner.token,
        });

        assert.equal(response.status, 400, response.text);
        assert.equal(response.body.message, 'Instruction steps must be unique and start at 1.');
    });

    await t.test('legt ein Rezept an', async () => {
        const response = await api('/recipes', {
            method: 'POST',
            body: validRecipe(),
            token: owner.token,
        });

        assert.equal(response.status, 201, response.text);

        const recipe = response.body;

        assert.match(recipe.id, /^[a-f0-9]{24}$/);
        assert.equal(recipe.title, 'Testrezept');
        assert.equal(recipe.description, 'Ein einfaches Testrezept.');
        assert.equal(recipe.imageUrl, null);
        assert.equal(recipe.category, 'Hauptgericht');
        assert.equal(recipe.cuisine, 'Italienisch');
        assert.equal(recipe.difficulty, 'easy');
        assert.equal(recipe.prepTime, 10);
        assert.equal(recipe.cookTime, 20);
        assert.equal(recipe.restTime, 5);
        assert.equal(recipe.servings, 2);
        assert.equal(recipe.servingUnit, 'Portion');
        assert.deepEqual(recipe.tags, ['Nudeln', 'Schnell']);
        assert.equal(recipe.createdBy, owner.id);
        assert.equal(recipe.isPublic, true);
        assert.equal(recipe.status, 'public');
        assert.match(recipe.createdAt, /^\d{4}-\d{2}-\d{2}T/);
        assert.match(recipe.updatedAt, /^\d{4}-\d{2}-\d{2}T/);
        assert.equal(recipe.ingredients.length, 3);
        assert.equal(recipe.instructions[0].step, 1);

        const stored = await server.db
            .collection('recipes')
            .findOne({ _id: new ObjectId(recipe.id) });

        assert.ok(stored);
        assert.equal(stored.title, 'Testrezept');
        assert.equal(String(stored.createdBy), owner.id);
        assert.equal(stored.status, 'public');
    });

    await t.test('berechnet Nährwerte aus der foods-Collection', async () => {
        const importedAt = new Date();

        await server.db.collection('foods').insertMany([
            {
                blsCode: 'TEST_MEHL',
                nameDe: 'Testmehl',
                nameNormalized: 'testmehl',
                baseAmount: 100,
                baseUnit: 'g',
                nutrients: {
                    ENERCC: 350,
                    PROT625: 10,
                    FAT: 2,
                    CHO: 70,
                    FIBT: 3,
                    SUGAR: 1,
                    NACL: 0.01,
                },
                note: null,
                blsVersion: 'test',
                importedAt,
            },
            {
                blsCode: 'TEST_ZUCKER',
                nameDe: 'Testzucker',
                nameNormalized: 'testzucker',
                baseAmount: 100,
                baseUnit: 'g',
                nutrients: {
                    ENERCC: 400,
                    PROT625: 0,
                    FAT: 0,
                    CHO: 100,
                    FIBT: 0,
                    SUGAR: 100,
                    NACL: 0,
                },
                note: null,
                blsVersion: 'test',
                importedAt,
            },
            {
                blsCode: 'TEST_MILCH',
                nameDe: 'Testmilch',
                nameNormalized: 'testmilch',
                baseAmount: 100,
                baseUnit: 'g',
                nutrients: {
                    ENERCC: 64,
                    PROT625: 3.4,
                    FAT: 3.6,
                    CHO: 4.7,
                    FIBT: 0,
                    SUGAR: 4.7,
                    NACL: 0.1,
                },
                note: null,
                blsVersion: 'test',
                importedAt,
            },
        ]);

        const response = await api('/recipes', {
            method: 'POST',
            body: validRecipe({
                ingredients: [
                    { name: 'Testmehl', quantity: 200, unit: 'g', note: null, isOptional: false },
                    { name: 'Testzucker', quantity: 0.1, unit: 'kg', note: null, isOptional: false },
                    { name: 'Testmilch', quantity: 100, unit: 'ml', note: null, isOptional: false },
                    { name: 'Testei', quantity: 1, unit: 'piece', note: null, isOptional: true },
                ],
                servings: 4,
            }),
            token: owner.token,
        });

        assert.equal(response.status, 201, response.text);

        const nutrition = response.body.nutrition;

        assert.ok(nutrition);
        assertClose(nutrition.total.calories, 1164);
        assertClose(nutrition.total.protein, 23.4);
        assertClose(nutrition.total.fat, 7.6);
        assertClose(nutrition.total.carbohydrates, 244.7);
        assertClose(nutrition.total.fiber, 6);
        assertClose(nutrition.total.sugar, 106.7);
        assertClose(nutrition.total.salt, 0.12);
        assertClose(nutrition.perServing.calories, 291);
        assertClose(nutrition.perServing.protein, 5.9);
        assertClose(nutrition.perServing.fat, 1.9);
        assertClose(nutrition.perServing.carbohydrates, 61.2);
        assertClose(nutrition.perServing.fiber, 1.5);
        assertClose(nutrition.perServing.sugar, 26.7);
        assertClose(nutrition.perServing.salt, 0.03);
        assert.equal(nutrition.matchedIngredients, 3);
        assert.equal(nutrition.totalIngredients, 4);
        assert.deepEqual(nutrition.unmatchedIngredients, ['Testei']);

        const stored = await server.db
            .collection('recipes')
            .findOne({ _id: new ObjectId(response.body.id) });

        assert.ok(stored);
        assert.equal(stored.nutrition.total.calories, 1164);
        assert.equal(stored.nutrition.matchedIngredients, 3);
    });

    await t.test('berechnet Nährwerte über generische Zutaten-Aliase', async () => {
        const importedAt = new Date();

        await server.db.collection('foods').insertMany([
            {
                blsCode: 'ALIAS_MEHL',
                nameDe: 'Weizen Mehl, Type 405',
                nameNormalized: 'weizen mehl type 405',
                baseAmount: 100,
                baseUnit: 'g',
                nutrients: {
                    ENERCC: 348,
                    PROT625: 10.6,
                    FAT: 1,
                    CHO: 71.5,
                    FIBT: 3.7,
                    SUGAR: 0.5,
                    NACL: 0.01,
                },
                note: null,
                blsVersion: 'test',
                importedAt,
            },
            {
                blsCode: 'ALIAS_ZUCKER',
                nameDe: 'Zucker weiß (Raffinadezucker/Weißzucker)',
                nameNormalized: 'zucker weiss raffinadezucker weisszucker',
                baseAmount: 100,
                baseUnit: 'g',
                nutrients: {
                    ENERCC: 400,
                    PROT625: 0,
                    FAT: 0,
                    CHO: 100,
                    FIBT: 0,
                    SUGAR: 100,
                    NACL: 0,
                },
                note: null,
                blsVersion: 'test',
                importedAt,
            },
        ]);

        const response = await api('/recipes', {
            method: 'POST',
            body: validRecipe({
                ingredients: [
                    { name: 'Mehl', quantity: 200, unit: 'g', note: null, isOptional: false },
                    { name: 'Zucker', quantity: 100, unit: 'g', note: null, isOptional: false },
                ],
                servings: 2,
            }),
            token: owner.token,
        });

        assert.equal(response.status, 201, response.text);

        const nutrition = response.body.nutrition;

        assert.ok(nutrition);
        assertClose(nutrition.total.calories, 1096);
        assertClose(nutrition.total.carbohydrates, 243);
        assert.equal(nutrition.matchedIngredients, 2);
        assert.equal(nutrition.totalIngredients, 2);
        assert.deepEqual(nutrition.unmatchedIngredients, []);
    });

    await t.test('speichert null, wenn keine Zutat zugeordnet werden kann', async () => {
        const response = await api('/recipes', {
            method: 'POST',
            body: validRecipe({
                title: 'Rezept ohne Nährwerte',
                ingredients: [
                    { name: 'Unbekannte Zutat', quantity: 100, unit: 'g', note: null, isOptional: false },
                ],
            }),
            token: owner.token,
        });

        assert.equal(response.status, 201, response.text);
        assert.equal(response.body.nutrition, null);

        const stored = await server.db
            .collection('recipes')
            .findOne({ _id: new ObjectId(response.body.id) });

        assert.ok(stored);
        assert.equal(stored.nutrition, null);
    });

    await t.test('liefert private Rezepte nur an den Eigentümer', async () => {
        const created = await api('/recipes', {
            method: 'POST',
            body: validRecipe({ title: 'Privates Rezept', isPublic: false }),
            token: owner.token,
        });

        assert.equal(created.status, 201, created.text);
        assert.equal(created.body.status, 'private');
        assert.equal(created.body.isPublic, false);

        const own = await api(`/recipes/${created.body.id}`, { token: owner.token });
        const foreign = await api(`/recipes/${created.body.id}`, { token: other.token });

        assert.equal(own.status, 200, own.text);
        assert.equal(own.body.title, 'Privates Rezept');
        assert.equal(foreign.status, 404);
    });

    await t.test('liefert öffentliche Rezepte an andere Nutzer', async () => {
        const created = await api('/recipes', {
            method: 'POST',
            body: validRecipe({ title: 'Öffentliches Rezept' }),
            token: owner.token,
        });

        assert.equal(created.status, 201, created.text);

        const foreign = await api(`/recipes/${created.body.id}`, { token: other.token });

        assert.equal(foreign.status, 200, foreign.text);
        assert.equal(foreign.body.title, 'Öffentliches Rezept');
    });

    await t.test('behandelt ungültige und unbekannte IDs', async () => {
        const invalid = await api('/recipes/not-an-id', { token: owner.token });
        const unknown = await api('/recipes/0123456789abcdef01234567', { token: owner.token });

        assert.equal(invalid.status, 400);
        assert.equal(unknown.status, 404);
    });
});
