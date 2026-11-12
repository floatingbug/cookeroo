import { AppError } from '../../../types/errors.js';
import models from '../models/index.js';
import getUserSummary from './getUserSummary.js';
import type {
    MealPlanMemberResponse,
    MealPlanMemberUpdateInput,
} from '../types.js';

interface UpdateMealPlanMemberParams {
    userId: string;
    memberId: string;
    input: MealPlanMemberUpdateInput;
}

export default async ({
    userId,
    memberId,
    input,
}: UpdateMealPlanMemberParams): Promise<MealPlanMemberResponse> => {
    const member = await models.updateMemberPermission({
        ownerId: userId,
        memberId,
        canEdit: input.canEdit,
    });

    if (!member) {
        throw new AppError(404, 'Member not found');
    }

    const user = await getUserSummary(memberId);

    return {
        user,
        canEdit: member.canEdit,
        joinedAt: member.createdAt.toISOString(),
    };
};
