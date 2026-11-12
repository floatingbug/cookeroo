import { getDb } from '../../../db/mongo.js';
import type { RecipeDocument } from '../types.js';

export default async () => {
    const db = getDb();

    return db
        .collection<RecipeDocument>('recipes')
        .find({ status: 'public' })
        .sort({ createdAt: -1 })
        .toArray();
};
