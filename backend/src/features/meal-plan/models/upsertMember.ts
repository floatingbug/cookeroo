import { getDb, ObjectId } from '../../../db/mongo.js';
import type { MealPlanMemberDocument } from '../types.js';

interface UpsertMemberParams {
    ownerId: string;
    memberId: string;
}

/**
 * Adds a member with read-only access. Existing members keep their current
 * permission.
 */
export default async ({ ownerId, memberId }: UpsertMemberParams) => {
    const db = getDb();
    const now = new Date();

    return db.collection<MealPlanMemberDocument>('meal_plan_members').findOneAndUpdate(
        {
            ownerId: new ObjectId(ownerId),
            memberId: new ObjectId(memberId),
        },
        {
            $set: {
                updatedAt: now,
            },
            $setOnInsert: {
                ownerId: new ObjectId(ownerId),
                memberId: new ObjectId(memberId),
                canEdit: false,
                createdAt: now,
            },
        },
        {
            upsert: true,
            returnDocument: 'after',
        },
    );
};
