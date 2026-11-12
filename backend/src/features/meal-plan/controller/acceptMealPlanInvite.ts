import catchAsync from '../../../utils/catchAsync.js';
import services from '../services/index.js';

export default catchAsync(async (req, res) => {
    const planner = await services.acceptMealPlanInvite({
        userId: req.user!.id,
        token: req.params.token as string,
    });

    res.json(planner);
});
