import { MongoClient, ObjectId } from 'mongodb';
import type { Db } from 'mongodb';
import config from '../config/index.js';
import logger from '../utils/logger.js';

let client: MongoClient | undefined;
let db: Db | undefined;

/**
 * Name and email are login identifiers, so they must be unique.
 * Existing duplicates only get logged: the server still starts and the
 * unique constraint applies to new documents as soon as it can be built.
 */
async function ensureIndexes(database: Db): Promise<void> {
    try {
        await database
            .collection('users')
            .createIndex(
                { email: 1 },
                { unique: true, name: 'uniq_users_email' }
            );

        await database
            .collection('users')
            .createIndex(
                { name: 1 },
                { unique: true, name: 'uniq_users_name' }
            );

        await database
            .collection('meal_plans')
            .createIndex(
                { userId: 1, weekStart: 1 },
                { unique: true, name: 'uniq_meal_plans_user_week' }
            );

        await database
            .collection('meal_plan_members')
            .createIndex(
                { ownerId: 1, memberId: 1 },
                { unique: true, name: 'uniq_meal_plan_members_owner_member' }
            );

        await database
            .collection('meal_plan_members')
            .createIndex(
                { memberId: 1 },
                { name: 'meal_plan_members_member' }
            );

        await database
            .collection('meal_plan_invites')
            .createIndex(
                { tokenHash: 1 },
                { unique: true, name: 'uniq_meal_plan_invites_token' }
            );

        await database
            .collection('recipes')
            .createIndex(
                { status: 1, createdAt: -1 },
                { name: 'recipes_status_created' }
            );

        await database
            .collection('recipes')
            .createIndex(
                { createdBy: 1, createdAt: -1 },
                { name: 'recipes_creator_created' }
            );
    }
    catch (err) {
        logger.error({ err }, 'Failed to create indexes');
    }
}

async function connect(): Promise<Db> {
    if (db) {
        return db;
    }

    client = new MongoClient(config.mongoUri);

    await client.connect();

    db = client.db(config.dbName);

    await ensureIndexes(db);

    return db;
}

function getDb(): Db {
    if (!db) {
        throw new Error('Database not connected. Call connect() first.');
    }

    return db;
}

const _client = (): MongoClient | undefined => client;

export { connect, getDb, ObjectId, _client };

export default {
    connect,
    getDb,
    ObjectId,
    _client,
};
