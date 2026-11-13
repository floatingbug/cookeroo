import catchAsync from '../../../utils/catchAsync.js';
import services from '../services/index.js';
import type { UpdateRecipeInput } from '../types.js';

export default catchAsync(async (req, res) => {
    const recipe = await services.updateRecipe({
        recipeId: String(req.params.recipeId),
        userId: req.user!.id,
        input: req.body as UpdateRecipeInput,
    });

    res.status(200).json(recipe);
});
