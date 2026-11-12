import { AppError } from '../../../types/errors.js';
import models from '../models/index.js';

interface RemoveMealPlanMemberParams {
    userId: string;
    memberId: string;
}

export default async ({
    userId,
    memberId,
}: RemoveMealPlanMemberParams): Promise<void> => {
    const result = await models.deleteMember({ ownerId: userId, memberId });

    if (result.deletedCount === 0) {
        throw new AppError(404, 'Member not found');
    }
};
