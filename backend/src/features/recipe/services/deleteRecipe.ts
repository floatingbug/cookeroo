import { AppError } from '../../../types/errors.js';
import model from '../models/index.js';
import { collectImageUrls, removeUnusedImages } from './recipeImages.js';

interface DeleteRecipeParams {
    recipeId: string;
    userId: string;
}

export default async ({ recipeId, userId }: DeleteRecipeParams): Promise<void> => {
    const recipe = await model.findById({ recipeId });

    if (!recipe || String(recipe.createdBy) !== userId) {
        throw new AppError(404, 'Recipe not found');
    }

    await model.deleteById({ recipeId });
    await removeUnusedImages(recipeId, collectImageUrls(recipe));
};
