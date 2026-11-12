import userServices from '../../user/services/index.js';
import models from '../models/index.js';
import type { SharedMealPlanListResponse } from '../types.js';

interface ListSharedMealPlansParams {
    userId: string;
}

export default async ({
    userId,
}: ListSharedMealPlansParams): Promise<SharedMealPlanListResponse> => {
    const memberships = await models.findMembershipsByMember({ memberId: userId });
    const ownerIds = memberships.map((membership) => String(membership.ownerId));
    const owners = await userServices.getUserSummariesByIds({ userIds: ownerIds });

    return {
        planners: memberships.flatMap((membership) => {
            const owner = owners.get(String(membership.ownerId));

            if (!owner) {
                return [];
            }

            return [{ owner, canEdit: membership.canEdit }];
        }),
    };
};
