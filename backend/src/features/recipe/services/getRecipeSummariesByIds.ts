import type { RecipeSummary } from '../../../types/recipe.js';
import models from '../models/index.js';
import toRecipeSummary from './mappers/toRecipeSummary.js';

interface GetRecipeSummariesByIdsParams {
    recipeIds: string[];
    userId: string;
}

/**
 * Returns summaries for all requested recipes the user may access. IDs of
 * foreign private or missing recipes are omitted from the map.
 */
export default async ({
    recipeIds,
    userId,
}: GetRecipeSummariesByIdsParams): Promise<Map<string, RecipeSummary>> => {
    const recipes = await models.findAccessibleByIds({ recipeIds, userId });

    return new Map(
        recipes.map((recipe) => {
            const summary = toRecipeSummary(recipe);

            return [summary.id, summary];
        }),
    );
};
