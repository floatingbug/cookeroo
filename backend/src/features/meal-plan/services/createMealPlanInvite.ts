import config from '../../../config/index.js';
import models from '../models/index.js';
import { createInviteToken, hashInviteToken } from './inviteToken.js';
import type { MealPlanInviteResponse } from '../types.js';

interface CreateMealPlanInviteParams {
    userId: string;
}

export default async ({
    userId,
}: CreateMealPlanInviteParams): Promise<MealPlanInviteResponse> => {
    const token = createInviteToken();

    await models.createInvite({
        ownerId: userId,
        tokenHash: hashInviteToken(token),
    });

    const baseUrl = config.clientBaseUrl.replace(/\/+$/, '');

    return {
        token,
        url: `${baseUrl}/meal-plan/join/${token}`,
    };
};
