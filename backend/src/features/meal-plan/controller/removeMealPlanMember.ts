import catchAsync from '../../../utils/catchAsync.js';
import services from '../services/index.js';

export default catchAsync(async (req, res) => {
    await services.removeMealPlanMember({
        userId: req.user!.id,
        memberId: req.params.memberId as string,
    });

    res.status(204).send();
});
