import { getDb, ObjectId } from '../../../db/mongo.js';
import type { MealPlanMemberDocument } from '../types.js';

interface FindMemberParams {
    ownerId: string;
    memberId: string;
}

export default async ({ ownerId, memberId }: FindMemberParams) => {
    const db = getDb();

    return db.collection<MealPlanMemberDocument>('meal_plan_members').findOne({
        ownerId: new ObjectId(ownerId),
        memberId: new ObjectId(memberId),
    });
};
