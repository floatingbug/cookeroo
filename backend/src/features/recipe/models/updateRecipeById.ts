import { getDb, ObjectId } from '../../../db/mongo.js';
import type { RecipeDocument, RecipeRecord } from '../types.js';

type RecipeUpdateFields = Partial<Omit<RecipeDocument, '_id' | 'createdAt' | 'createdBy'>>;

interface UpdateRecipeByIdParams {
    recipeId: string;
    update: RecipeUpdateFields;
}

export default async ({ recipeId, update }: UpdateRecipeByIdParams): Promise<RecipeRecord | null> => {
    const db = getDb();

    return db.collection<RecipeDocument>('recipes').findOneAndUpdate(
        { _id: new ObjectId(recipeId) },
        { $set: update },
        { returnDocument: 'after' },
    );
};
