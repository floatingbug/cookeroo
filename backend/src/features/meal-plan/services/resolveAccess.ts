import { AppError } from '../../../types/errors.js';
import models from '../models/index.js';
import type { MealPlanAccess } from '../types.js';

interface ResolveAccessParams {
    userId: string;
    ownerId?: string;
}

/**
 * Resolves which planner the request targets and whether the authenticated
 * user may change it. Foreign planners are reported as not found when the
 * user is not a member.
 */
export default async ({ userId, ownerId }: ResolveAccessParams): Promise<MealPlanAccess> => {
    if (!ownerId || ownerId === userId) {
        return { ownerId: userId, canEdit: true };
    }

    const member = await models.findMember({ ownerId, memberId: userId });

    if (!member) {
        throw new AppError(404, 'Meal plan not found');
    }

    return { ownerId, canEdit: member.canEdit };
};
