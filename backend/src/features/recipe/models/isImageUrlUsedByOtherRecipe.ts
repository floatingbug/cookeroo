import { getDb, ObjectId } from '../../../db/mongo.js';
import type { RecipeDocument } from '../types.js';

interface IsImageUrlUsedByOtherRecipeParams {
    recipeId: string;
    imageUrl: string;
}

export default async ({ recipeId, imageUrl }: IsImageUrlUsedByOtherRecipeParams): Promise<boolean> => {
    const db = getDb();

    const recipe = await db.collection<RecipeDocument>('recipes').findOne(
        {
            _id: { $ne: new ObjectId(recipeId) },
            $or: [{ imageUrl }, { 'instructions.imageUrl': imageUrl }],
        },
        { projection: { _id: 1 } },
    );

    return recipe !== null;
};
