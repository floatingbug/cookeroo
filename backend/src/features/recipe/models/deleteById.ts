import { getDb, ObjectId } from '../../../db/mongo.js';

export default async ({ recipeId }: { recipeId: string }): Promise<boolean> => {
    const db = getDb();

    const result = await db.collection('recipes').deleteOne({ _id: new ObjectId(recipeId) });

    return result.deletedCount > 0;
};
