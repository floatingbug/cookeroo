import { getDb, ObjectId } from '../../../db/mongo.js';
import type { MealPlanMemberDocument } from '../types.js';

interface UpdateMemberPermissionParams {
    ownerId: string;
    memberId: string;
    canEdit: boolean;
}

export default async ({
    ownerId,
    memberId,
    canEdit,
}: UpdateMemberPermissionParams) => {
    const db = getDb();

    return db.collection<MealPlanMemberDocument>('meal_plan_members').findOneAndUpdate(
        {
            ownerId: new ObjectId(ownerId),
            memberId: new ObjectId(memberId),
        },
        {
            $set: {
                canEdit,
                updatedAt: new Date(),
            },
        },
        {
            returnDocument: 'after',
        },
    );
};
