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

async function insertRecipe(
    title: string,
    createdBy: string,
    isPublic: boolean,
    createdAt: Date,
): Promise<string> {
    const inserted = await server.db.collection('recipes').insertOne({
        title,
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
        nutrition: null,
        createdAt,
        updatedAt: createdAt,
        createdBy: new ObjectId(createdBy),
        isPublic,
        status: isPublic ? 'public' : 'private',
    });

    return inserted.insertedId.toHexString();
}

before(async () => {
    server = await startTestServer();
});

after(async () => {
    await server.close();
});

test('Public Recipe List API', async (t: TestContext) => {
    let owner: ApiUser;
    let other: ApiUser;
    let olderPublic: string;
    let newerPublic: string;
    let privateRecipe: string;

    await t.test('legt zwei Testnutzer an', async () => {
        owner = await createUser('recipe_public_owner');
        other = await createUser('recipe_public_other');

        assert.match(owner.id, /^[a-f0-9]{24}$/);
        assert.match(other.id, /^[a-f0-9]{24}$/);
    });

    await t.test('verlangt ein Access-Token', async () => {
        const response = await api('/recipes/public');

        assert.equal(response.status, 401);
    });

    await t.test('liefert eine leere Liste ohne öffentliche Rezepte', async () => {
        const response = await api('/recipes/public', { token: owner.token });

        assert.equal(response.status, 200, response.text);
        assert.deepEqual(response.body, []);
    });

    await t.test('liefert alle öffentlichen Rezepte, neueste zuerst', async () => {
        olderPublic = await insertRecipe(
            'Älteres öffentliches Rezept',
            owner.id,
            true,
            new Date('2026-01-01T10:00:00.000Z'),
        );
        privateRecipe = await insertRecipe(
            'Privates Rezept eines anderen',
            other.id,
            false,
            new Date('2026-01-02T10:00:00.000Z'),
        );
        newerPublic = await insertRecipe(
            'Neueres öffentliches Rezept',
            other.id,
            true,
            new Date('2026-01-03T10:00:00.000Z'),
        );

        const response = await api('/recipes/public', { token: owner.token });

        assert.equal(response.status, 200, response.text);
        assert.ok(Array.isArray(response.body));
        assert.deepEqual(
            response.body.map((recipe: { id: string }) => recipe.id),
            [newerPublic, olderPublic],
        );

        for (const recipe of response.body) {
            assert.equal(recipe.status, 'public');
            assert.equal(recipe.isPublic, true);
        }

        assert.equal(response.body[0].createdBy, other.id);
        assert.equal(response.body[1].createdBy, owner.id);
    });

    await t.test('enthält keine privaten Rezepte', async () => {
        const response = await api('/recipes/public', { token: owner.token });

        assert.equal(response.status, 200, response.text);
        assert.equal(
            response.body.some((recipe: { id: string }) => recipe.id === privateRecipe),
            false,
        );
    });
});
