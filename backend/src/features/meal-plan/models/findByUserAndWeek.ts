import { getDb, ObjectId } from '../../../db/mongo.js';
import type { MealPlanDocument } from '../types.js';

interface FindByUserAndWeekParams {
    userId: string;
    weekStart: string;
}

export default async ({ userId, weekStart }: FindByUserAndWeekParams) => {
    const db = getDb();

    return db.collection<MealPlanDocument>('meal_plans').findOne({
        userId: new ObjectId(userId),
        weekStart,
    });
};
