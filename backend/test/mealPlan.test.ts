import { test, before, after } from 'node:test';
import type { TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { ObjectId } from 'mongodb';
import testServerModule from './helpers/testServer.js';
import type { TestServer } from './helpers/testServer.js';
import type { MealPlanDocument } from '../src/features/meal-plan/types.js';

const { startTestServer } = testServerModule;

const WEEK_START = '2026-11-09';

let server: TestServer;

interface ApiUser {
    id: string;
    name: string;
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

    return {
        id: signIn.body.user.id,
        name: signIn.body.user.name,
        token: signIn.body.accessToken,
    };
}

async function createRecipe(
    user: ApiUser,
    title: string,
    isPublic: boolean,
): Promise<string> {
    const response = await api('/recipes', {
        method: 'POST',
        token: user.token,
        body: {
            title,
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

test('MealPlan API', async (t: TestContext) => {
    let owner: ApiUser;
    let other: ApiUser;
    let ownerPrivateRecipeId: string;
    let otherPublicRecipeId: string;
    let otherPrivateRecipeId: string;

    await t.test('legt zwei Testnutzer und Rezepte an', async () => {
        owner = await createUser('meal_plan_owner');
        other = await createUser('meal_plan_other');

        ownerPrivateRecipeId = await createRecipe(owner, 'Eigenes privates Rezept', false);
        otherPublicRecipeId = await createRecipe(other, 'Öffentliches Rezept', true);
        otherPrivateRecipeId = await createRecipe(other, 'Fremdes privates Rezept', false);

        assert.match(owner.id, /^[a-f0-9]{24}$/);
        assert.match(ownerPrivateRecipeId, /^[a-f0-9]{24}$/);
        assert.match(otherPublicRecipeId, /^[a-f0-9]{24}$/);
        assert.match(otherPrivateRecipeId, /^[a-f0-9]{24}$/);
    });

    await t.test('legt den Unique-Index für Nutzer und Woche an', async () => {
        const indexes = await server.db.collection('meal_plans').indexes();
        const index = indexes.find((entry) => entry.name === 'uniq_meal_plans_user_week');

        assert.ok(index, 'Index uniq_meal_plans_user_week fehlt');
        assert.equal(index.unique, true);
    });

    await t.test('liefert für eine ungespeicherte Woche einen leeren Plan', async () => {
        const response = await api(`/meal-plans/${WEEK_START}`, { token: owner.token });

        assert.equal(response.status, 200, response.text);
        assert.deepEqual(response.body, {
            weekStart: WEEK_START,
            entries: [],
            updatedAt: null,
            owner: { id: owner.id, name: owner.name },
            canEdit: true,
        });
    });

    await t.test('speichert eigene und öffentliche Rezepte', async () => {
        const response = await api(`/meal-plans/${WEEK_START}`, {
            method: 'PUT',
            token: owner.token,
            body: {
                entries: [
                    { day: 'monday', meal: 'breakfast', recipeId: ownerPrivateRecipeId },
                    { day: 'tuesday', meal: 'dinner', recipeId: otherPublicRecipeId },
                ],
            },
        });

        assert.equal(response.status, 200, response.text);
        assert.equal(response.body.weekStart, WEEK_START);
        assert.equal(response.body.entries.length, 2);
        assert.ok(response.body.updatedAt);
        assert.equal(response.body.entries[0].recipe.id, ownerPrivateRecipeId);
        assert.equal(response.body.entries[0].recipe.title, 'Eigenes privates Rezept');
        assert.equal(response.body.entries[1].recipe.id, otherPublicRecipeId);
        assert.equal(response.body.entries[1].recipe.title, 'Öffentliches Rezept');

        const stored = await server.db
            .collection<MealPlanDocument>('meal_plans')
            .findOne({ weekStart: WEEK_START });

        assert.ok(stored);
        assert.equal(stored.entries.length, 2);
        assert.equal(String(stored.entries[1]!.recipeId), otherPublicRecipeId);

        const loaded = await api(`/meal-plans/${WEEK_START}`, { token: owner.token });

        assert.equal(loaded.status, 200, loaded.text);
        assert.deepEqual(loaded.body.entries, response.body.entries);
    });

    await t.test('ersetzt beim Speichern die komplette Woche', async () => {
        const response = await api(`/meal-plans/${WEEK_START}`, {
            method: 'PUT',
            token: owner.token,
            body: {
                entries: [
                    { day: 'sunday', meal: 'lunch', recipeId: otherPublicRecipeId },
                ],
            },
        });

        assert.equal(response.status, 200, response.text);
        assert.equal(response.body.entries.length, 1);
        assert.equal(response.body.entries[0].day, 'sunday');
        assert.equal(response.body.entries[0].meal, 'lunch');
        assert.equal(response.body.entries[0].recipeId, otherPublicRecipeId);
        assert.equal(response.body.entries[0].recipe.title, 'Öffentliches Rezept');

        const loaded = await api(`/meal-plans/${WEEK_START}`, { token: owner.token });

        assert.equal(loaded.status, 200, loaded.text);
        assert.deepEqual(loaded.body.entries, response.body.entries);
    });

    await t.test('liefert null, wenn ein geplantes Rezept nicht mehr zugänglich ist', async () => {
        const recipes = server.db.collection('recipes');

        await recipes.updateOne(
            { _id: new ObjectId(otherPublicRecipeId) },
            { $set: { status: 'private' } },
        );

        const loaded = await api(`/meal-plans/${WEEK_START}`, { token: owner.token });

        assert.equal(loaded.status, 200, loaded.text);
        assert.equal(loaded.body.entries[0].recipeId, otherPublicRecipeId);
        assert.equal(loaded.body.entries[0].recipe, null);

        await recipes.updateOne(
            { _id: new ObjectId(otherPublicRecipeId) },
            { $set: { status: 'public' } },
        );
    });

    await t.test('leert den Plan mit einer leeren Eintragsliste', async () => {
        const response = await api(`/meal-plans/${WEEK_START}`, {
            method: 'PUT',
            token: owner.token,
            body: { entries: [] },
        });

        assert.equal(response.status, 200, response.text);
        assert.deepEqual(response.body.entries, []);

        const loaded = await api(`/meal-plans/${WEEK_START}`, { token: owner.token });

        assert.equal(loaded.status, 200, loaded.text);
        assert.deepEqual(loaded.body.entries, []);
    });

    await t.test('weist ungültige oder nicht-Montag-Daten ab', async () => {
        const tuesday = await api('/meal-plans/2026-11-10', { token: owner.token });
        const invalidDate = await api('/meal-plans/2026-02-30', { token: owner.token });
        const malformed = await api('/meal-plans/2026-11-9', { token: owner.token });

        assert.equal(tuesday.status, 400);
        assert.equal(invalidDate.status, 400);
        assert.equal(malformed.status, 400);
    });

    await t.test('weist doppelte Tages- und Mahlzeiten-Slots ab', async () => {
        const response = await api(`/meal-plans/${WEEK_START}`, {
            method: 'PUT',
            token: owner.token,
            body: {
                entries: [
                    { day: 'monday', meal: 'lunch', recipeId: ownerPrivateRecipeId },
                    { day: 'monday', meal: 'lunch', recipeId: otherPublicRecipeId },
                ],
            },
        });

        assert.equal(response.status, 400);
    });

    await t.test('weist fremde private Rezepte ab', async () => {
        const response = await api(`/meal-plans/${WEEK_START}`, {
            method: 'PUT',
            token: owner.token,
            body: {
                entries: [
                    { day: 'monday', meal: 'dinner', recipeId: otherPrivateRecipeId },
                ],
            },
        });

        assert.equal(response.status, 400);
        assert.equal(response.body.message, 'One or more recipes are not available.');
    });

    await t.test('verlangt Authentifizierung', async () => {
        const get = await api(`/meal-plans/${WEEK_START}`);
        const put = await api(`/meal-plans/${WEEK_START}`, {
            method: 'PUT',
            body: { entries: [] },
        });

        assert.equal(get.status, 401);
        assert.equal(put.status, 401);
    });
});
