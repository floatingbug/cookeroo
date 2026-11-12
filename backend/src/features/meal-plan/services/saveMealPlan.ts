import { ObjectId } from '../../../db/mongo.js';
import { AppError } from '../../../types/errors.js';
import type { RecipeSummary } from '../../../types/recipe.js';
import recipeServices from '../../recipe/services/index.js';
import models from '../models/index.js';
import getUserSummary from './getUserSummary.js';
import resolveAccess from './resolveAccess.js';
import toMealPlanResponse from './mappers/toMealPlanResponse.js';
import validateWeekStart from './validateWeekStart.js';
import type {
    MealPlanEntryDocument,
    MealPlanResponse,
    MealPlanSaveInput,
} from '../types.js';

interface SaveMealPlanParams {
    userId: string;
    weekStart: string;
    input: MealPlanSaveInput;
    ownerId?: string;
}

async function mergeAccessibleSummaries(
    recipeIds: string[],
    userIds: string[],
): Promise<Map<string, RecipeSummary>> {
    const maps = await Promise.all(
        userIds.map((userId) => recipeServices.getRecipeSummariesByIds({ recipeIds, userId })),
    );
    const merged = new Map<string, RecipeSummary>();

    for (const summaries of maps) {
        for (const [recipeId, summary] of summaries) {
            if (!merged.has(recipeId)) {
                merged.set(recipeId, summary);
            }
        }
    }

    return merged;
}

export default async ({
    userId,
    weekStart,
    input,
    ownerId,
}: SaveMealPlanParams): Promise<MealPlanResponse> => {
    validateWeekStart(weekStart);

    const access = await resolveAccess({ userId, ownerId });

    if (!access.canEdit) {
        throw new AppError(403, 'You may not change this meal plan.');
    }

    const slots = new Set<string>();

    for (const entry of input.entries) {
        const slot = `${entry.day}:${entry.meal}`;

        if (slots.has(slot)) {
            throw new AppError(400, 'Each day and meal combination may occur only once.');
        }

        slots.add(slot);
    }

    const recipeIds = [...new Set(input.entries.map((entry) => entry.recipeId))];
    const summaries = await recipeServices.getRecipeSummariesByIds({ recipeIds, userId });
    const validationSummaries = access.ownerId === userId
        ? summaries
        : await mergeAccessibleSummaries(recipeIds, [userId, access.ownerId]);

    if (recipeIds.some((recipeId) => !validationSummaries.has(recipeId))) {
        throw new AppError(400, 'One or more recipes are not available.');
    }

    const entries: MealPlanEntryDocument[] = input.entries.map((entry) => ({
        day: entry.day,
        meal: entry.meal,
        recipeId: new ObjectId(entry.recipeId),
    }));

    const plan = await models.upsertByUserAndWeek({
        userId: access.ownerId,
        weekStart,
        entries,
    });

    if (!plan) {
        throw new AppError(500, 'Failed to save meal plan.');
    }

    const owner = await getUserSummary(access.ownerId);

    return toMealPlanResponse(weekStart, plan, summaries, owner, access.canEdit);
};
