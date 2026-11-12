import catchAsync from '../../../utils/catchAsync.js';
import services from '../services/index.js';

export default catchAsync(async (req, res) => {
    const invite = await services.createMealPlanInvite({
        userId: req.user!.id,
    });

    res.status(201).json(invite);
});
