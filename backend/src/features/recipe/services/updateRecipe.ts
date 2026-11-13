import { AppError } from '../../../types/errors.js';
import model from '../models/index.js';
import calculateNutrition from './nutrition/calculateNutrition.js';
import toRecipeResponse from './mappers/toRecipeResponse.js';
import normalizeRecipeInput from './normalizeRecipeInput.js';
import { removedImageUrls, removeUnusedImages } from './recipeImages.js';
import type { RecipeResponse, UpdateRecipeInput } from '../types.js';

interface UpdateRecipeParams {
    recipeId: string;
    userId: string;
    input: UpdateRecipeInput;
}

export default async ({ recipeId, userId, input }: UpdateRecipeParams): Promise<RecipeResponse> => {
    const existing = await model.findById({ recipeId });

    if (!existing || String(existing.createdBy) !== userId) {
        throw new AppError(404, 'Recipe not found');
    }

    const normalized = normalizeRecipeInput(input);
    const nutrition = await calculateNutrition({
        ingredients: normalized.ingredients,
        servings: normalized.servings,
    });

    const updated = await model.updateRecipeById({
        recipeId,
        update: {
            ...normalized,
            nutrition,
            updatedAt: new Date(),
        },
    });

    if (!updated) {
        throw new AppError(404, 'Recipe not found');
    }

    await removeUnusedImages(recipeId, removedImageUrls(existing, normalized));

    return toRecipeResponse(updated);
};
