import { getDb, ObjectId } from '../../../db/mongo.js';
import type { MealPlanDocument, MealPlanEntryDocument } from '../types.js';

interface UpsertByUserAndWeekParams {
    userId: string;
    weekStart: string;
    entries: MealPlanEntryDocument[];
}

export default async ({ userId, weekStart, entries }: UpsertByUserAndWeekParams) => {
    const db = getDb();
    const now = new Date();

    return db.collection<MealPlanDocument>('meal_plans').findOneAndUpdate(
        {
            userId: new ObjectId(userId),
            weekStart,
        },
        {
            $set: {
                entries,
                updatedAt: now,
            },
            $setOnInsert: {
                userId: new ObjectId(userId),
                weekStart,
                createdAt: now,
            },
        },
        {
            upsert: true,
            returnDocument: 'after',
        },
    );
};
