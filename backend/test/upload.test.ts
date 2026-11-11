import { test, before, after } from 'node:test';
import type { TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import testServerModule from './helpers/testServer.js';
import type { TestServer } from './helpers/testServer.js';

const { startTestServer } = testServerModule;

let server: TestServer;
let uploadDir: string;
let token: string;

interface UploadResponse {
    status: number;
    body: any;
    text: string;
}

async function uploadImage(file: Blob | null, fileName: string, bearer?: string): Promise<UploadResponse> {
    const form = new FormData();

    if (file) {
        form.append('file', file, fileName);
    }

    const headers: Record<string, string> = {};

    if (bearer) {
        headers.authorization = `Bearer ${bearer}`;
    }

    const response = await fetch(`${server.baseUrl}/uploads/images`, {
        method: 'POST',
        headers,
        body: form,
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

async function api(path: string, method: string, body?: unknown): Promise<Response> {
    return fetch(server.baseUrl + path, {
        method,
        headers: body === undefined ? {} : { 'content-type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
    });
}

before(async () => {
    uploadDir = await mkdtemp(path.join('/tmp/opencode', 'cookeroo-upload-'));

    server = await startTestServer({
        env: {
            UPLOAD_DIR: uploadDir,
            PUBLIC_BASE_URL: 'http://uploads.test',
            UPLOAD_MAX_FILE_SIZE: '1024',
        },
    });

    const suffix = `${process.pid}_${Date.now()}`;
    const name = `upload_${suffix}`;
    const email = `${name}@example.com`;
    const mark = server.output().length;

    const signUp = await api('/auth/sign-up', 'POST', {
        name,
        email,
        password: 'Passwort1',
    });

    assert.equal(signUp.status, 201);

    const match = await server.waitForLog(mark, /\/verify-email\?token=([a-f0-9]{64})/);
    const verify = await api(`/auth/verify-email?token=${match[1]}`, 'GET');

    assert.equal(verify.status, 200);

    const signIn = await api('/auth/sign-in', 'POST', {
        nameOrEmail: email,
        password: 'Passwort1',
    });
    const signInBody = await signIn.json() as { accessToken: string };

    token = signInBody.accessToken;
});

after(async () => {
    await server.close();
    await rm(uploadDir, { recursive: true, force: true });
});

test('Upload API', async (t: TestContext) => {
    await t.test('verlangt ein Access-Token', async () => {
        const response = await uploadImage(new Blob(['abc'], { type: 'image/png' }), 'test.png');

        assert.equal(response.status, 401);
    });

    await t.test('lehnt fehlende Dateien ab', async () => {
        const response = await uploadImage(null, '', token);

        assert.equal(response.status, 400, response.text);
    });

    await t.test('lehnt fremde MIME-Typen ab', async () => {
        const response = await uploadImage(new Blob(['abc'], { type: 'text/plain' }), 'test.txt', token);

        assert.equal(response.status, 400, response.text);
        assert.equal(response.body.message, 'Only JPEG, PNG and WebP images are allowed.');
    });

    await t.test('lehnt zu große Dateien ab', async () => {
        const response = await uploadImage(
            new Blob([new Uint8Array(2048)], { type: 'image/png' }),
            'large.png',
            token,
        );

        assert.equal(response.status, 413, response.text);
    });

    await t.test('speichert ein Bild und liefert es statisch aus', async () => {
        const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
        const response = await uploadImage(new Blob([bytes], { type: 'image/png' }), 'image.png', token);

        assert.equal(response.status, 201, response.text);
        assert.match(response.body.url, /^http:\/\/uploads\.test\/uploads\/[a-f0-9-]+\.png$/);

        const fileName = path.basename(new URL(response.body.url).pathname);
        const stored = await readFile(path.join(uploadDir, fileName));

        assert.deepEqual(new Uint8Array(stored), bytes);
        assert.deepEqual(await readdir(uploadDir), [fileName]);

        const served = await fetch(`${server.baseUrl}/uploads/${fileName}`);

        assert.equal(served.status, 200);
        assert.equal(served.headers.get('content-type'), 'image/png');
        assert.deepEqual(new Uint8Array(await served.arrayBuffer()), bytes);
    });
});
