import catchAsync from '../../../utils/catchAsync.js';
import services from '../services/index.js';

export default catchAsync(async (req, res) => {
    const planners = await services.listSharedMealPlans({
        userId: req.user!.id,
    });

    res.json(planners);
});
