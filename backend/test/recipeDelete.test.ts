import { test, before, after } from 'node:test';
import type { TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { access, mkdtemp, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { ObjectId } from 'mongodb';
import testServerModule from './helpers/testServer.js';
import type { TestServer } from './helpers/testServer.js';

const { startTestServer } = testServerModule;

let server: TestServer;
let uploadDir: string;
let owner: ApiUser;
let other: ApiUser;

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

function recipeBody(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
        title: 'Löschbares Rezept',
        prepTime: 10,
        cookTime: 20,
        servings: 2,
        ingredients: [
            { name: 'Zutat A', quantity: 200, unit: 'g', note: null, isOptional: false },
        ],
        instructions: [
            { step: 1, description: 'Alles zubereiten.', duration: 5, imageUrl: null },
        ],
        isPublic: true,
        ...overrides,
    };
}

async function createRecipe(user: ApiUser, overrides: Record<string, unknown> = {}): Promise<any> {
    const response = await api('/recipes', {
        method: 'POST',
        body: recipeBody(overrides),
        token: user.token,
    });

    assert.equal(response.status, 201, response.text);

    return response.body;
}

async function writeUpload(fileName: string): Promise<void> {
    await writeFile(path.join(uploadDir, fileName), Buffer.from('image'));
}

async function assertFileExists(fileName: string): Promise<void> {
    await access(path.join(uploadDir, fileName));
}

async function assertFileMissing(fileName: string): Promise<void> {
    await assert.rejects(access(path.join(uploadDir, fileName)));
}

function uploadUrl(fileName: string): string {
    return `http://uploads.test/uploads/${fileName}`;
}

before(async () => {
    uploadDir = await mkdtemp(path.join('/tmp/opencode', 'cookeroo-recipe-delete-'));

    server = await startTestServer({
        env: {
            UPLOAD_DIR: uploadDir,
            PUBLIC_BASE_URL: 'http://uploads.test',
        },
    });

    owner = await createUser('recipe_delete_owner');
    other = await createUser('recipe_delete_other');
});

after(async () => {
    await server.close();
    await rm(uploadDir, { recursive: true, force: true });
});

test('Recipe Delete API', async (t: TestContext) => {
    await t.test('verlangt ein Access-Token', async () => {
        const response = await api(`/recipes/${owner.id}`, { method: 'DELETE' });

        assert.equal(response.status, 401);
    });

    await t.test('lehnt ungültige Rezept-IDs ab', async () => {
        const response = await api('/recipes/not-an-object-id', {
            method: 'DELETE',
            token: owner.token,
        });

        assert.equal(response.status, 400, response.text);
    });

    await t.test('meldet fremde Rezepte als nicht gefunden', async () => {
        const foreign = await createRecipe(other, { title: 'Fremdes Rezept' });

        const response = await api(`/recipes/${foreign.id}`, {
            method: 'DELETE',
            token: owner.token,
        });

        assert.equal(response.status, 404, response.text);

        const stored = await server.db
            .collection('recipes')
            .findOne({ _id: new ObjectId(foreign.id) });

        assert.ok(stored);
    });

    await t.test('löscht ein eigenes Rezept samt Rezept- und Schrittbild', async () => {
        const mainFile = `main-${process.pid}-${Date.now()}.png`;
        const stepFile = `step-${process.pid}-${Date.now()}.webp`;

        await writeUpload(mainFile);
        await writeUpload(stepFile);

        const recipe = await createRecipe(owner, {
            title: 'Rezept mit Bildern',
            imageUrl: uploadUrl(mainFile),
            instructions: [
                {
                    step: 1,
                    description: 'Mit Bild.',
                    duration: null,
                    imageUrl: uploadUrl(stepFile),
                },
            ],
        });

        const response = await api(`/recipes/${recipe.id}`, {
            method: 'DELETE',
            token: owner.token,
        });

        assert.equal(response.status, 204, response.text);
        assert.equal(response.text, '');

        const stored = await server.db
            .collection('recipes')
            .findOne({ _id: new ObjectId(recipe.id) });

        assert.equal(stored, null);

        const getResponse = await api(`/recipes/${recipe.id}`, { token: owner.token });

        assert.equal(getResponse.status, 404, getResponse.text);

        await assertFileMissing(mainFile);
        await assertFileMissing(stepFile);
    });

    await t.test('behält Bilder, die ein anderes Rezept noch nutzt', async () => {
        const sharedFile = `shared-${process.pid}-${Date.now()}.png`;
        const sharedUrl = uploadUrl(sharedFile);

        await writeUpload(sharedFile);

        const recipe = await createRecipe(owner, {
            title: 'Rezept mit geteiltem Bild',
            imageUrl: sharedUrl,
        });

        const otherRecipe = await createRecipe(other, {
            title: 'Anderes Rezept mit geteiltem Bild',
            imageUrl: null,
            instructions: [
                {
                    step: 1,
                    description: 'Nutzt dasselbe Bild.',
                    duration: null,
                    imageUrl: sharedUrl,
                },
            ],
        });

        const response = await api(`/recipes/${recipe.id}`, {
            method: 'DELETE',
            token: owner.token,
        });

        assert.equal(response.status, 204, response.text);

        await assertFileExists(sharedFile);

        const otherResponse = await api(`/recipes/${otherRecipe.id}`, { token: other.token });

        assert.equal(otherResponse.status, 200, otherResponse.text);
        assert.equal(otherResponse.body.instructions[0].imageUrl, sharedUrl);
    });

    await t.test('ignoriert externe Bild-URLs', async () => {
        const recipe = await createRecipe(owner, {
            title: 'Rezept mit externem Bild',
            imageUrl: 'https://example.com/images/recipe.png',
        });

        const response = await api(`/recipes/${recipe.id}`, {
            method: 'DELETE',
            token: owner.token,
        });

        assert.equal(response.status, 204, response.text);

        const stored = await server.db
            .collection('recipes')
            .findOne({ _id: new ObjectId(recipe.id) });

        assert.equal(stored, null);
    });

    await t.test('löscht ein Rezept ohne Bilder', async () => {
        const recipe = await createRecipe(owner, { title: 'Rezept ohne Bilder' });

        const response = await api(`/recipes/${recipe.id}`, {
            method: 'DELETE',
            token: owner.token,
        });

        assert.equal(response.status, 204, response.text);

        const getResponse = await api(`/recipes/${recipe.id}`, { token: owner.token });

        assert.equal(getResponse.status, 404, getResponse.text);
    });
});
