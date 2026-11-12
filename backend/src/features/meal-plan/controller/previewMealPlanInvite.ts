import catchAsync from '../../../utils/catchAsync.js';
import services from '../services/index.js';

export default catchAsync(async (req, res) => {
    const preview = await services.previewMealPlanInvite({
        token: req.params.token as string,
    });

    res.json(preview);
});
