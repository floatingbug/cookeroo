import { getDb, ObjectId } from '../../../db/mongo.js';
import type { MealPlanMemberDocument } from '../types.js';

interface FindMembersByOwnerParams {
    ownerId: string;
}

export default async ({ ownerId }: FindMembersByOwnerParams) => {
    const db = getDb();

    return db
        .collection<MealPlanMemberDocument>('meal_plan_members')
        .find({ ownerId: new ObjectId(ownerId) })
        .sort({ createdAt: 1 })
        .toArray();
};
