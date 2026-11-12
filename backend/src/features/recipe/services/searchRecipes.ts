import models from '../models/index.js';
import toRecipeSummary from './mappers/toRecipeSummary.js';
import type { RecipeSearchResponse } from '../types.js';

const PAGE_SIZE = 10;

interface SearchRecipesParams {
    userId: string;
    query: string;
    tags: string[];
    offset: number;
}

function normalizeTags(tags: string[]): string[] {
    const byLowerCase = new Map<string, string>();

    for (const rawTag of tags) {
        const tag = rawTag.trim();

        if (tag !== '') {
            byLowerCase.set(tag.toLocaleLowerCase(), tag);
        }
    }

    return [...byLowerCase.values()];
}

export default async ({
    userId,
    query,
    tags,
    offset,
}: SearchRecipesParams): Promise<RecipeSearchResponse> => {
    const recipes = await models.searchRecipes({
        userId,
        query: query.trim(),
        tags: normalizeTags(tags),
        offset,
        limit: PAGE_SIZE + 1,
    });

    return {
        items: recipes.slice(0, PAGE_SIZE).map(toRecipeSummary),
        nextOffset: recipes.length > PAGE_SIZE ? offset + PAGE_SIZE : null,
    };
};
