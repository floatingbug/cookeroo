import catchAsync from '../../../utils/catchAsync.js';
import services from '../services/index.js';
import type { CreateRecipeInput } from '../types.js';

export default catchAsync(async (req, res) => {
    const recipe = await services.createRecipe({
        userId: req.user!.id,
        input: req.body as CreateRecipeInput,
    });

    res.status(201).json(recipe);
});
