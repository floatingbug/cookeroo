import userServices from '../../user/services/index.js';
import models from '../models/index.js';
import type { MealPlanMemberListResponse } from '../types.js';

interface ListMealPlanMembersParams {
    userId: string;
}

export default async ({
    userId,
}: ListMealPlanMembersParams): Promise<MealPlanMemberListResponse> => {
    const members = await models.findMembersByOwner({ ownerId: userId });
    const users = await userServices.getUserSummariesByIds({
        userIds: members.map((member) => String(member.memberId)),
    });

    return {
        members: members.flatMap((member) => {
            const user = users.get(String(member.memberId));

            if (!user) {
                return [];
            }

            return [{
                user,
                canEdit: member.canEdit,
                joinedAt: member.createdAt.toISOString(),
            }];
        }),
    };
};
