import logger from '../../../utils/logger.js';
import { deleteUploadedFile, getUploadFileName } from '../../../utils/uploadedImages.js';
import { AppError } from '../../../types/errors.js';
import model from '../models/index.js';
import type { RecipeRecord } from '../types.js';

interface DeleteRecipeParams {
    recipeId: string;
    userId: string;
}

function collectImageUrls(recipe: RecipeRecord): string[] {
    const urls = [recipe.imageUrl, ...recipe.instructions.map((instruction) => instruction.imageUrl)];

    return [...new Set(urls.filter((url): url is string => typeof url === 'string' && url !== ''))];
}

async function removeUnusedImages(recipeId: string, imageUrls: string[]): Promise<void> {
    for (const imageUrl of imageUrls) {
        const fileName = getUploadFileName(imageUrl);

        if (!fileName) {
            continue;
        }

        const usedByOtherRecipe = await model.isImageUrlUsedByOtherRecipe({ recipeId, imageUrl });

        if (usedByOtherRecipe) {
            continue;
        }

        try {
            await deleteUploadedFile(fileName);
        }
        catch (error) {
            logger.warn({ err: error, fileName, recipeId }, 'Failed to delete uploaded recipe image');
        }
    }
}

export default async ({ recipeId, userId }: DeleteRecipeParams): Promise<void> => {
    const recipe = await model.findById({ recipeId });

    if (!recipe || String(recipe.createdBy) !== userId) {
        throw new AppError(404, 'Recipe not found');
    }

    await model.deleteById({ recipeId });
    await removeUnusedImages(recipeId, collectImageUrls(recipe));
};
