import { getDb, ObjectId } from '../../../db/mongo.js';
import type { RecipeDocument } from '../types.js';

interface FindAccessibleByIdsParams {
    recipeIds: string[];
    userId: string;
}

export default async ({ recipeIds, userId }: FindAccessibleByIdsParams) => {
    if (recipeIds.length === 0) {
        return [];
    }

    const db = getDb();

    return db
        .collection<RecipeDocument>('recipes')
        .find(
            {
                _id: { $in: [...new Set(recipeIds)].map((recipeId) => new ObjectId(recipeId)) },
                $or: [
                    { status: 'public' },
                    { createdBy: new ObjectId(userId) },
                ],
            },
            {
                projection: {
                    title: 1,
                    imageUrl: 1,
                    category: 1,
                    cuisine: 1,
                    difficulty: 1,
                    prepTime: 1,
                    cookTime: 1,
                    restTime: 1,
                    tags: 1,
                    status: 1,
                },
            },
        )
        .toArray();
};
