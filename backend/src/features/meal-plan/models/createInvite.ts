import { getDb, ObjectId } from '../../../db/mongo.js';
import type { MealPlanInviteDocument } from '../types.js';

interface CreateInviteParams {
    ownerId: string;
    tokenHash: string;
}

export default async ({ ownerId, tokenHash }: CreateInviteParams) => {
    const db = getDb();

    return db.collection<MealPlanInviteDocument>('meal_plan_invites').insertOne({
        ownerId: new ObjectId(ownerId),
        tokenHash,
        createdAt: new Date(),
    });
};
