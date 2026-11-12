import { getDb, ObjectId } from '../../../db/mongo.js';
import type { RecipeDocument } from '../types.js';

interface FindAvailableTagsParams {
    userId: string;
}

export default async ({ userId }: FindAvailableTagsParams): Promise<string[]> => {
    const db = getDb();

    const tags = await db
        .collection<RecipeDocument>('recipes')
        .aggregate<{ tag: string }>([
            {
                $match: {
                    $or: [
                        { status: 'public' },
                        { createdBy: new ObjectId(userId) },
                    ],
                },
            },
            { $unwind: '$tags' },
            { $match: { tags: { $type: 'string', $ne: '' } } },
            {
                $group: {
                    _id: { $toLower: '$tags' },
                    tag: { $first: '$tags' },
                },
            },
            { $sort: { _id: 1 } },
            { $limit: 100 },
            { $project: { _id: 0, tag: 1 } },
        ])
        .toArray();

    return tags.map((entry) => entry.tag);
};
