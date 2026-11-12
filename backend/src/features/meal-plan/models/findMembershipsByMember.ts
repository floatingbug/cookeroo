import { getDb, ObjectId } from '../../../db/mongo.js';
import type { MealPlanMemberDocument } from '../types.js';

interface FindMembershipsByMemberParams {
    memberId: string;
}

export default async ({ memberId }: FindMembershipsByMemberParams) => {
    const db = getDb();

    return db
        .collection<MealPlanMemberDocument>('meal_plan_members')
        .find({ memberId: new ObjectId(memberId) })
        .sort({ createdAt: 1 })
        .toArray();
};
