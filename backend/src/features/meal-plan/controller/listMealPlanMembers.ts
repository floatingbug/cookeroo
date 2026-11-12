import catchAsync from '../../../utils/catchAsync.js';
import services from '../services/index.js';

export default catchAsync(async (req, res) => {
    const members = await services.listMealPlanMembers({
        userId: req.user!.id,
    });

    res.json(members);
});
