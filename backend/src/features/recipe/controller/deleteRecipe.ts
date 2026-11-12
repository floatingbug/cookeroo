import catchAsync from '../../../utils/catchAsync.js';
import services from '../services/index.js';

export default catchAsync(async (req, res) => {
    await services.deleteRecipe({
        recipeId: String(req.params.recipeId),
        userId: req.user!.id,
    });

    res.status(204).end();
});
