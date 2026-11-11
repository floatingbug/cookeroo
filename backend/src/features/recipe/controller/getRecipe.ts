import catchAsync from '../../../utils/catchAsync.js';
import services from '../services/index.js';

export default catchAsync(async (req, res) => {
    const recipe = await services.getRecipeById({
        recipeId: String(req.params.recipeId),
        userId: req.user!.id,
    });

    res.json(recipe);
});
