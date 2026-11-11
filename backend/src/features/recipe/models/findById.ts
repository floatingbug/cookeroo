import { getDb, ObjectId } from '../../../db/mongo.js';
import type { RecipeDocument } from '../types.js';

export default async ({ recipeId }: { recipeId: string }) => {
    const db = getDb();

    return db.collection<RecipeDocument>('recipes').findOne({ _id: new ObjectId(recipeId) });
};
