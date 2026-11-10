/**
 * Legt den Testnutzer "bob" direkt in der Datenbank an.
 *
 * Der Umweg über die Registrierung ist nicht möglich, weil das Passwort
 * die Passwort-Policy des API-Vertrags verletzt und neue Nutzer erst ihre
 * E-Mail bestätigen müssten. Die Anmeldung prüft nur Hash + emailVerified,
 * daher funktioniert der Nutzer danach normal.
 *
 * Ausführung: npm run seed:test-user (im Ordner backend/)
 */
import config from '../src/config/index.js';
import db from '../src/db/mongo.js';
import password from '../src/utils/password.js';
import type { NewUser } from '../src/types/user.js';

const TEST_USER_NAME = 'bob';
const TEST_USER_EMAIL = 'bob@example.com';
const TEST_USER_PASSWORD = 'bob';

async function main(): Promise<void> {
    console.log(`Ziel-Datenbank: ${config.mongoUri}/${config.dbName}`);

    if (config.env === 'production') {
        console.error('Seed-Script läuft nicht in Produktion (NODE_ENV=production). Abbruch.');
        process.exitCode = 1;

        return;
    }

    await db.connect();

    const passwordHash = await password.hashPassword(TEST_USER_PASSWORD);

    const fields: Omit<NewUser, 'createdAt'> = {
        name: TEST_USER_NAME,
        email: TEST_USER_EMAIL,
        pendingEmail: null,
        pendingEmailToken: null,
        pendingEmailExpiresAt: null,
        password: passwordHash,
        emailVerified: true,
        emailTokenHash: null,
        emailTokenExpiresAt: null,
    };

    const database = db.getDb();

    const result = await database.collection('users').updateOne(
        { name: TEST_USER_NAME },
        {
            $set: fields,
            $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true }
    );

    if (result.upsertedCount > 0) {
        console.log(`Testnutzer "${TEST_USER_NAME}" angelegt (${TEST_USER_EMAIL}).`);
    }
    else {
        console.log(`Testnutzer "${TEST_USER_NAME}" war bereits vorhanden und wurde aktualisiert.`);
    }

    console.log('Anmeldung: POST /auth/sign-in mit { "nameOrEmail": "bob", "password": "bob" }');

    await db._client()?.close();
}

main().catch((err) => {
    console.error('Seed fehlgeschlagen:', err);
    process.exitCode = 1;
});
