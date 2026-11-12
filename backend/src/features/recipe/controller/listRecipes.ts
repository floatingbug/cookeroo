import catchAsync from '../../../utils/catchAsync.js';
import services from '../services/index.js';

export default catchAsync(async (req, res) => {
    const recipes = await services.listRecipes({
        userId: req.user!.id,
    });

    res.json(recipes);
});
