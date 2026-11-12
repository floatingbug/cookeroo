import { AppError } from '../../../types/errors.js';
import models from '../models/index.js';
import getUserSummary from './getUserSummary.js';
import { hashInviteToken } from './inviteToken.js';
import type { SharedMealPlanResponse } from '../types.js';

interface AcceptMealPlanInviteParams {
    userId: string;
    token: string;
}

export default async ({
    userId,
    token,
}: AcceptMealPlanInviteParams): Promise<SharedMealPlanResponse> => {
    const invite = await models.consumeInvite({
        tokenHash: hashInviteToken(token),
    });

    if (!invite) {
        throw new AppError(404, 'Invitation not found');
    }

    const ownerId = String(invite.ownerId);

    if (ownerId === userId) {
        throw new AppError(400, 'You cannot join your own meal planner.');
    }

    const owner = await getUserSummary(ownerId);
    const member = await models.upsertMember({ ownerId, memberId: userId });

    if (!member) {
        throw new AppError(500, 'Failed to accept invitation.');
    }

    return {
        owner,
        canEdit: member.canEdit,
    };
};
