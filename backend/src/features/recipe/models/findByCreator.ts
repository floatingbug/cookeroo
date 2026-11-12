import { getDb, ObjectId } from '../../../db/mongo.js';
import type { RecipeDocument } from '../types.js';

export default async ({ userId }: { userId: string }) => {
    const db = getDb();

    return db
        .collection<RecipeDocument>('recipes')
        .find({ createdBy: new ObjectId(userId) })
        .sort({ createdAt: -1 })
        .toArray();
};
