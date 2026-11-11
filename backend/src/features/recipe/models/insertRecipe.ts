import { getDb } from '../../../db/mongo.js';
import type { NewRecipe, RecipeRecord } from '../types.js';

export default async (recipe: NewRecipe): Promise<RecipeRecord> => {
    const db = getDb();

    const result = await db.collection('recipes').insertOne(recipe);

    return { ...recipe, _id: result.insertedId } as RecipeRecord;
};
