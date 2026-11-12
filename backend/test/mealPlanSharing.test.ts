import { test, before, after } from 'node:test';
import type { TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { ObjectId } from 'mongodb';
import testServerModule from './helpers/testServer.js';
import type { TestServer } from './helpers/testServer.js';
import type {
    MealPlanDocument,
    MealPlanInviteDocument,
    MealPlanMemberDocument,
} from '../src/features/meal-plan/types.js';

const { startTestServer } = testServerModule;

const WEEK_START = '2026-11-09';
const OTHER_WEEK_START = '2026-11-16';

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

async function api(
    path: string,
    { method = 'GET', body, token }: ApiOptions = {},
): Promise<ApiResponse> {
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

test('MealPlan sharing API', async (t: TestContext) => {
    let owner: ApiUser;
    let member: ApiUser;
    let outsider: ApiUser;
    let ownerPrivateRecipeId: string;
    let memberPrivateRecipeId: string;
    let publicRecipeId: string;
    let inviteToken = '';
    let inviteTokenHash = '';

    await t.test('legt Testnutzer und Rezepte an', async () => {
        owner = await createUser('meal_share_owner');
        member = await createUser('meal_share_member');
        outsider = await createUser('meal_share_outsider');

        ownerPrivateRecipeId = await createRecipe(owner, 'Privates Rezept des Besitzers', false);
        memberPrivateRecipeId = await createRecipe(member, 'Privates Rezept des Mitglieds', false);
        publicRecipeId = await createRecipe(outsider, 'Öffentliches Rezept', true);

        assert.match(owner.id, /^[a-f0-9]{24}$/);
        assert.match(memberPrivateRecipeId, /^[a-f0-9]{24}$/);
    });

    await t.test('legt die Freigabe-Indizes an', async () => {
        const members = await server.db.collection('meal_plan_members').indexes();
        const invites = await server.db.collection('meal_plan_invites').indexes();

        const memberIndex = members.find(
            (entry) => entry.name === 'uniq_meal_plan_members_owner_member',
        );
        const inviteIndex = invites.find(
            (entry) => entry.name === 'uniq_meal_plan_invites_token',
        );

        assert.ok(memberIndex, 'Index uniq_meal_plan_members_owner_member fehlt');
        assert.equal(memberIndex.unique, true);
        assert.ok(inviteIndex, 'Index uniq_meal_plan_invites_token fehlt');
        assert.equal(inviteIndex.unique, true);
    });

    await t.test('liefert den eigenen Plan mit Besitzer und Bearbeitungsrecht', async () => {
        const response = await api(`/meal-plans/${WEEK_START}`, { token: owner.token });

        assert.equal(response.status, 200, response.text);
        assert.deepEqual(response.body.owner, { id: owner.id, name: owner.name });
        assert.equal(response.body.canEdit, true);
    });

    await t.test('erstellt einen Einmal-Link und speichert nur den Hash', async () => {
        const response = await api('/meal-plans/invites', {
            method: 'POST',
            token: owner.token,
        });

        assert.equal(response.status, 201, response.text);
        assert.match(response.body.token, /^[a-f0-9]{64}$/);
        assert.equal(
            response.body.url,
            `http://localhost:5173/meal-plan/join/${response.body.token}`,
        );

        inviteToken = response.body.token;

        const stored = await server.db
            .collection<MealPlanInviteDocument>('meal_plan_invites')
            .findOne({ ownerId: new ObjectId(owner.id) });

        assert.ok(stored);
        inviteTokenHash = stored.tokenHash;
        assert.notEqual(stored.tokenHash, inviteToken);
        assert.match(stored.tokenHash, /^[a-f0-9]{64}$/);
    });

    await t.test('zeigt die Einladung öffentlich an, ohne sie zu verbrauchen', async () => {
        const first = await api(`/meal-plans/invites/${inviteToken}`);
        const second = await api(`/meal-plans/invites/${inviteToken}`);

        assert.equal(first.status, 200, first.text);
        assert.deepEqual(first.body, { owner: { id: owner.id, name: owner.name } });
        assert.equal(second.status, 200, second.text);
    });

    await t.test('weist unbekannte Einladungen ab', async () => {
        const unknown = 'a'.repeat(64);
        const preview = await api(`/meal-plans/invites/${unknown}`);
        const accept = await api(`/meal-plans/invites/${unknown}/accept`, {
            method: 'POST',
            token: member.token,
        });

        assert.equal(preview.status, 404);
        assert.equal(accept.status, 404);
    });

    await t.test('nimmt die Einladung mit Standard-Leserecht an', async () => {
        const response = await api(`/meal-plans/invites/${inviteToken}/accept`, {
            method: 'POST',
            token: member.token,
        });

        assert.equal(response.status, 200, response.text);
        assert.deepEqual(response.body, {
            owner: { id: owner.id, name: owner.name },
            canEdit: false,
        });

        const membership = await server.db
            .collection<MealPlanMemberDocument>('meal_plan_members')
            .findOne({
                ownerId: new ObjectId(owner.id),
                memberId: new ObjectId(member.id),
            });

        assert.ok(membership);
        assert.equal(membership.canEdit, false);
    });

    await t.test('verbraucht den Einmal-Link', async () => {
        const response = await api(`/meal-plans/invites/${inviteToken}/accept`, {
            method: 'POST',
            token: outsider.token,
        });

        assert.equal(response.status, 404);
        assert.equal(
            await server.db
                .collection('meal_plan_invites')
                .countDocuments({ tokenHash: inviteTokenHash }),
            0,
        );
    });

    await t.test('listet den freigegebenen Wochenplaner für das Mitglied', async () => {
        const response = await api('/meal-plans/shared', { token: member.token });

        assert.equal(response.status, 200, response.text);
        assert.deepEqual(response.body, {
            planners: [{ owner: { id: owner.id, name: owner.name }, canEdit: false }],
        });

        const outsiderResponse = await api('/meal-plans/shared', { token: outsider.token });

        assert.equal(outsiderResponse.status, 200, outsiderResponse.text);
        assert.deepEqual(outsiderResponse.body, { planners: [] });
    });

    await t.test('speichert einen Plan mit privaten Rezepten des Besitzers', async () => {
        const response = await api(`/meal-plans/${WEEK_START}`, {
            method: 'PUT',
            token: owner.token,
            body: {
                entries: [
                    { day: 'monday', meal: 'breakfast', recipeId: ownerPrivateRecipeId },
                    { day: 'tuesday', meal: 'dinner', recipeId: publicRecipeId },
                ],
            },
        });

        assert.equal(response.status, 200, response.text);
        assert.equal(response.body.canEdit, true);
    });

    await t.test('Mitglied liest den Plan, sieht aber fremde private Rezepte nicht', async () => {
        const response = await api(
            `/meal-plans/${WEEK_START}?ownerId=${owner.id}`,
            { token: member.token },
        );

        assert.equal(response.status, 200, response.text);
        assert.deepEqual(response.body.owner, { id: owner.id, name: owner.name });
        assert.equal(response.body.canEdit, false);
        assert.equal(response.body.entries[0].recipeId, ownerPrivateRecipeId);
        assert.equal(response.body.entries[0].recipe, null);
        assert.equal(response.body.entries[1].recipe.title, 'Öffentliches Rezept');
    });

    await t.test('Nicht-Mitglieder erhalten keinen Zugriff', async () => {
        const get = await api(`/meal-plans/${WEEK_START}?ownerId=${owner.id}`, {
            token: outsider.token,
        });
        const put = await api(`/meal-plans/${WEEK_START}?ownerId=${owner.id}`, {
            method: 'PUT',
            token: outsider.token,
            body: { entries: [] },
        });

        assert.equal(get.status, 404);
        assert.equal(put.status, 404);
    });

    await t.test('Mitglied ohne Bearbeitungsrecht darf nicht speichern', async () => {
        const response = await api(`/meal-plans/${WEEK_START}?ownerId=${owner.id}`, {
            method: 'PUT',
            token: member.token,
            body: { entries: [] },
        });

        assert.equal(response.status, 403);
        assert.equal(response.body.message, 'You may not change this meal plan.');
    });

    await t.test('Besitzer listet die Mitglieder', async () => {
        const response = await api('/meal-plans/members', { token: owner.token });

        assert.equal(response.status, 200, response.text);
        assert.equal(response.body.members.length, 1);
        assert.deepEqual(response.body.members[0].user, {
            id: member.id,
            name: member.name,
        });
        assert.equal(response.body.members[0].canEdit, false);
        assert.ok(response.body.members[0].joinedAt);
    });

    await t.test('Mitglieder können keine fremden Mitglieder verwalten', async () => {
        const list = await api('/meal-plans/members', { token: member.token });
        const update = await api(`/meal-plans/members/${owner.id}`, {
            method: 'PATCH',
            token: member.token,
            body: { canEdit: true },
        });
        const remove = await api(`/meal-plans/members/${owner.id}`, {
            method: 'DELETE',
            token: member.token,
        });

        assert.equal(list.status, 200);
        assert.deepEqual(list.body, { members: [] });
        assert.equal(update.status, 404);
        assert.equal(remove.status, 404);
    });

    await t.test('Besitzer erteilt Bearbeitungsrecht', async () => {
        const response = await api(`/meal-plans/members/${member.id}`, {
            method: 'PATCH',
            token: owner.token,
            body: { canEdit: true },
        });

        assert.equal(response.status, 200, response.text);
        assert.deepEqual(response.body.user, { id: member.id, name: member.name });
        assert.equal(response.body.canEdit, true);
    });

    await t.test('Mitglied speichert den freigegebenen Plan', async () => {
        const response = await api(`/meal-plans/${WEEK_START}?ownerId=${owner.id}`, {
            method: 'PUT',
            token: member.token,
            body: {
                entries: [
                    { day: 'monday', meal: 'breakfast', recipeId: ownerPrivateRecipeId },
                    { day: 'wednesday', meal: 'lunch', recipeId: memberPrivateRecipeId },
                    { day: 'friday', meal: 'dinner', recipeId: publicRecipeId },
                ],
            },
        });

        assert.equal(response.status, 200, response.text);
        assert.equal(response.body.canEdit, true);
        assert.equal(response.body.entries.length, 3);
        assert.equal(response.body.entries[0].recipe, null);
        assert.equal(response.body.entries[1].recipe.title, 'Privates Rezept des Mitglieds');

        const stored = await server.db
            .collection<MealPlanDocument>('meal_plans')
            .findOne({
                userId: new ObjectId(owner.id),
                weekStart: WEEK_START,
            });

        assert.ok(stored);
        assert.equal(stored.entries.length, 3);

        const memberPlan = await server.db
            .collection<MealPlanDocument>('meal_plans')
            .findOne({
                userId: new ObjectId(member.id),
                weekStart: WEEK_START,
            });

        assert.equal(memberPlan, null);
    });

    await t.test('Mitglied kann auch andere Wochen des Besitzers bearbeiten', async () => {
        const response = await api(`/meal-plans/${OTHER_WEEK_START}?ownerId=${owner.id}`, {
            method: 'PUT',
            token: member.token,
            body: {
                entries: [
                    { day: 'sunday', meal: 'dinner', recipeId: publicRecipeId },
                ],
            },
        });

        assert.equal(response.status, 200, response.text);
        assert.equal(response.body.weekStart, OTHER_WEEK_START);
    });

    await t.test('Besitzer entzieht das Bearbeitungsrecht wieder', async () => {
        const update = await api(`/meal-plans/members/${member.id}`, {
            method: 'PATCH',
            token: owner.token,
            body: { canEdit: false },
        });

        assert.equal(update.status, 200, update.text);
        assert.equal(update.body.canEdit, false);

        const save = await api(`/meal-plans/${WEEK_START}?ownerId=${owner.id}`, {
            method: 'PUT',
            token: member.token,
            body: { entries: [] },
        });

        assert.equal(save.status, 403);
    });

    await t.test('Besitzer entfernt das Mitglied', async () => {
        const remove = await api(`/meal-plans/members/${member.id}`, {
            method: 'DELETE',
            token: owner.token,
        });

        assert.equal(remove.status, 204);

        const shared = await api('/meal-plans/shared', { token: member.token });
        const plan = await api(`/meal-plans/${WEEK_START}?ownerId=${owner.id}`, {
            token: member.token,
        });

        assert.deepEqual(shared.body, { planners: [] });
        assert.equal(plan.status, 404);
    });

    await t.test('eigener Einladungslink kann nicht angenommen werden', async () => {
        const invite = await api('/meal-plans/invites', {
            method: 'POST',
            token: owner.token,
        });

        assert.equal(invite.status, 201, invite.text);

        const accept = await api(`/meal-plans/invites/${invite.body.token}/accept`, {
            method: 'POST',
            token: owner.token,
        });

        assert.equal(accept.status, 400);
        assert.equal(accept.body.message, 'You cannot join your own meal planner.');
    });

    await t.test('verlangt Authentifizierung für geschützte Endpunkte', async () => {
        const shared = await api('/meal-plans/shared');
        const createInvite = await api('/meal-plans/invites', { method: 'POST' });
        const acceptInvite = await api(`/meal-plans/invites/${'a'.repeat(64)}/accept`, {
            method: 'POST',
        });
        const members = await api('/meal-plans/members');
        const updateMember = await api(`/meal-plans/members/${member.id}`, {
            method: 'PATCH',
            body: { canEdit: true },
        });
        const removeMember = await api(`/meal-plans/members/${member.id}`, {
            method: 'DELETE',
        });

        assert.equal(shared.status, 401);
        assert.equal(createInvite.status, 401);
        assert.equal(acceptInvite.status, 401);
        assert.equal(members.status, 401);
        assert.equal(updateMember.status, 401);
        assert.equal(removeMember.status, 401);
    });
});
