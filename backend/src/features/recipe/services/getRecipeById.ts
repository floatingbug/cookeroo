import { AppError } from '../../../types/errors.js';
import model from '../models/index.js';
import toRecipeResponse from './mappers/toRecipeResponse.js';
import type { RecipeResponse } from '../types.js';

interface GetRecipeByIdParams {
    recipeId: string;
    userId: string;
}

export default async ({ recipeId, userId }: GetRecipeByIdParams): Promise<RecipeResponse> => {
    const recipe = await model.findById({ recipeId });

    if (!recipe) {
        throw new AppError(404, 'Recipe not found');
    }

    if (recipe.status === 'private' && String(recipe.createdBy) !== userId) {
        throw new AppError(404, 'Recipe not found');
    }

    return toRecipeResponse(recipe);
};
