import { AppError } from '../../../types/errors.js';
import models from '../models/index.js';
import getUserSummary from './getUserSummary.js';
import { hashInviteToken } from './inviteToken.js';
import type { MealPlanInvitePreviewResponse } from '../types.js';

interface PreviewMealPlanInviteParams {
    token: string;
}

export default async ({
    token,
}: PreviewMealPlanInviteParams): Promise<MealPlanInvitePreviewResponse> => {
    const invite = await models.findInviteByTokenHash({
        tokenHash: hashInviteToken(token),
    });

    if (!invite) {
        throw new AppError(404, 'Invitation not found');
    }

    const owner = await getUserSummary(String(invite.ownerId));

    return { owner };
};
