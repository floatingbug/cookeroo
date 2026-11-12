import catchAsync from '../../../utils/catchAsync.js';
import services from '../services/index.js';
import type { MealPlanSaveInput } from '../types.js';

function queryString(value: unknown): string | undefined {
    return typeof value === 'string' ? value : undefined;
}

export default catchAsync(async (req, res) => {
    const mealPlan = await services.saveMealPlan({
        userId: req.user!.id,
        weekStart: req.params.weekStart as string,
        input: req.body as MealPlanSaveInput,
        ownerId: queryString(req.query.ownerId),
    });

    res.json(mealPlan);
});
