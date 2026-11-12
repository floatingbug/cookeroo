import recipeServices from '../../recipe/services/index.js';
import models from '../models/index.js';
import getUserSummary from './getUserSummary.js';
import resolveAccess from './resolveAccess.js';
import toMealPlanResponse from './mappers/toMealPlanResponse.js';
import validateWeekStart from './validateWeekStart.js';
import type { MealPlanResponse } from '../types.js';

interface GetMealPlanParams {
    userId: string;
    weekStart: string;
    ownerId?: string;
}

export default async ({
    userId,
    weekStart,
    ownerId,
}: GetMealPlanParams): Promise<MealPlanResponse> => {
    validateWeekStart(weekStart);

    const access = await resolveAccess({ userId, ownerId });
    const plan = await models.findByUserAndWeek({
        userId: access.ownerId,
        weekStart,
    });
    const recipeIds = plan ? plan.entries.map((entry) => String(entry.recipeId)) : [];
    const summaries = await recipeServices.getRecipeSummariesByIds({ recipeIds, userId });
    const owner = await getUserSummary(access.ownerId);

    return toMealPlanResponse(weekStart, plan, summaries, owner, access.canEdit);
};
