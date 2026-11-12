import { getDb, ObjectId } from '../../../db/mongo.js';
import type { Filter } from 'mongodb';
import type { RecipeDocument } from '../types.js';

interface SearchRecipesParams {
    userId: string;
    query: string;
    tags: string[];
    offset: number;
    limit: number;
}

function escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default async ({
    userId,
    query,
    tags,
    offset,
    limit,
}: SearchRecipesParams) => {
    const db = getDb();
    const conditions: Filter<RecipeDocument>[] = [
        {
            $or: [
                { status: 'public' },
                { createdBy: new ObjectId(userId) },
            ],
        },
    ];

    if (query !== '') {
        conditions.push({
            title: { $regex: escapeRegex(query), $options: 'i' },
        });
    }

    if (tags.length > 0) {
        conditions.push({
            tags: {
                $all: tags.map((tag) => new RegExp(`^${escapeRegex(tag)}$`, 'i')),
            },
        });
    }

    return db
        .collection<RecipeDocument>('recipes')
        .find({ $and: conditions }, {
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
        })
        .sort({ createdAt: -1, _id: -1 })
        .skip(offset)
        .limit(limit)
        .toArray();
};
