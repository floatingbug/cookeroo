import { getDb, ObjectId } from '../../../db/mongo.js';
import type { UserDocument } from '../../../types/user.js';

interface FindByIdsParams {
    userIds: string[];
}

export default async ({ userIds }: FindByIdsParams) => {
    if (userIds.length === 0) {
        return [];
    }

    const db = getDb();

    return db
        .collection<UserDocument>('users')
        .find({
            _id: { $in: [...new Set(userIds)].map((userId) => new ObjectId(userId)) },
        })
        .toArray();
};
