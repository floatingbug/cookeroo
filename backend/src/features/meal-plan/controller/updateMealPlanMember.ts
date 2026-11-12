import catchAsync from '../../../utils/catchAsync.js';
import services from '../services/index.js';
import type { MealPlanMemberUpdateInput } from '../types.js';

export default catchAsync(async (req, res) => {
    const member = await services.updateMealPlanMember({
        userId: req.user!.id,
        memberId: req.params.memberId as string,
        input: req.body as MealPlanMemberUpdateInput,
    });

    res.json(member);
});
