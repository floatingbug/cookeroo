import { getDb } from '../../../db/mongo.js';
import type { MealPlanInviteDocument } from '../types.js';

interface FindInviteByTokenHashParams {
    tokenHash: string;
}

export default async ({ tokenHash }: FindInviteByTokenHashParams) => {
    const db = getDb();

    return db
        .collection<MealPlanInviteDocument>('meal_plan_invites')
        .findOne({ tokenHash });
};
