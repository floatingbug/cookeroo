import catchAsync from '../../../utils/catchAsync.js';
import services from '../services/index.js';

function queryString(value: unknown): string | undefined {
    return typeof value === 'string' ? value : undefined;
}

export default catchAsync(async (req, res) => {
    const mealPlan = await services.getMealPlan({
        userId: req.user!.id,
        weekStart: req.params.weekStart as string,
        ownerId: queryString(req.query.ownerId),
    });

    res.json(mealPlan);
});
