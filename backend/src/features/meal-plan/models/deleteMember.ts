import { getDb, ObjectId } from '../../../db/mongo.js';
import type { MealPlanMemberDocument } from '../types.js';

interface DeleteMemberParams {
    ownerId: string;
    memberId: string;
}

export default async ({ ownerId, memberId }: DeleteMemberParams) => {
    const db = getDb();

    return db.collection<MealPlanMemberDocument>('meal_plan_members').deleteOne({
        ownerId: new ObjectId(ownerId),
        memberId: new ObjectId(memberId),
    });
};
