import { getDb } from '../../../db/mongo.js';
import type { MealPlanInviteDocument } from '../types.js';

interface ConsumeInviteParams {
    tokenHash: string;
}

/**
 * Atomically removes and returns the invitation so a one-time link can only
 * be accepted once.
 */
export default async ({ tokenHash }: ConsumeInviteParams) => {
    const db = getDb();

    return db
        .collection<MealPlanInviteDocument>('meal_plan_invites')
        .findOneAndDelete({ tokenHash });
};
