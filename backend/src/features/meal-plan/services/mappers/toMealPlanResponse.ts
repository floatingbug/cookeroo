import type { RecipeSummary } from '../../../../types/recipe.js';
import type {
    MealPlanEntryDocument,
    MealPlanEntryResponse,
    MealPlanRecord,
    MealPlanResponse,
    MealPlanUserSummary,
} from '../../types.js';

function toEntryResponse(
    entry: MealPlanEntryDocument,
    summaries: Map<string, RecipeSummary>,
): MealPlanEntryResponse {
    const recipeId = String(entry.recipeId);

    return {
        day: entry.day,
        meal: entry.meal,
        recipeId,
        recipe: summaries.get(recipeId) ?? null,
    };
}

export default (
    weekStart: string,
    plan: MealPlanRecord | null,
    summaries: Map<string, RecipeSummary>,
    owner: MealPlanUserSummary,
    canEdit: boolean,
): MealPlanResponse => ({
    weekStart,
    entries: plan ? plan.entries.map((entry) => toEntryResponse(entry, summaries)) : [],
    updatedAt: plan ? plan.updatedAt.toISOString() : null,
    owner,
    canEdit,
});
