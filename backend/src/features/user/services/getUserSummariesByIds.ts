import model from '../models/index.js';
import type { UserSummary } from '../../../types/user-summary.js';

interface GetUserSummariesByIdsParams {
    userIds: string[];
}

/**
 * Returns compact user summaries (id and name) for all requested users.
 * Missing users are omitted from the map.
 */
export default async ({
    userIds,
}: GetUserSummariesByIdsParams): Promise<Map<string, UserSummary>> => {
    const users = await model.findByIds({ userIds });

    return new Map(
        users.map((user) => {
            const summary: UserSummary = {
                id: String(user._id),
                name: user.name,
            };

            return [summary.id, summary];
        }),
    );
};
