import catchAsync from '../../../utils/catchAsync.js';
import services from '../services/index.js';

export default catchAsync(async (_req, res) => {
    const recipes = await services.listPublicRecipes();

    res.json(recipes);
});
