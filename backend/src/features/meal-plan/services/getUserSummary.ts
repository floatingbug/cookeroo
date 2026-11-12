import { AppError } from '../../../types/errors.js';
import type { UserSummary } from '../../../types/user-summary.js';
import userServices from '../../user/services/index.js';

export default async (userId: string): Promise<UserSummary> => {
    const summaries = await userServices.getUserSummariesByIds({ userIds: [userId] });
    const summary = summaries.get(userId);

    if (!summary) {
        throw new AppError(404, 'User not found');
    }

    return summary;
};
