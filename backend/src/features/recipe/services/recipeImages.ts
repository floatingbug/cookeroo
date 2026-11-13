import logger from '../../../utils/logger.js';
import { deleteUploadedFile, getUploadFileName } from '../../../utils/uploadedImages.js';
import model from '../models/index.js';
import type { RecipeRecord } from '../types.js';

type RecipeImages = Pick<RecipeRecord, 'imageUrl' | 'instructions'>;

/** Sammelt alle vom Rezept referenzierten Upload-Bild-URLs ohne Duplikate. */
export function collectImageUrls(recipe: RecipeImages): string[] {
    const urls = [recipe.imageUrl, ...recipe.instructions.map((instruction) => instruction.imageUrl)];

    return [...new Set(urls.filter((url): url is string => typeof url === 'string' && url !== ''))];
}

/** Liefert die Bild-URLs, die im neuen Stand nicht mehr referenziert werden. */
export function removedImageUrls(previous: RecipeImages, next: RecipeImages): string[] {
    const nextUrls = new Set(collectImageUrls(next));

    return collectImageUrls(previous).filter((url) => !nextUrls.has(url));
}

/**
 * Löscht nicht mehr referenzierte Upload-Bilder, sofern kein anderes Rezept
 * sie weiterhin verwendet. Fehler beim Aufräumen verhindern die eigentliche
 * Rezept-Operation nicht.
 */
export async function removeUnusedImages(recipeId: string, imageUrls: string[]): Promise<void> {
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
