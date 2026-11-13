import { ObjectId } from '../../../db/mongo.js';
import model from '../models/index.js';
import calculateNutrition from './nutrition/calculateNutrition.js';
import toRecipeResponse from './mappers/toRecipeResponse.js';
import normalizeRecipeInput from './normalizeRecipeInput.js';
import type { CreateRecipeInput, NewRecipe, RecipeResponse } from '../types.js';

interface CreateRecipeParams {
    userId: string;
    input: CreateRecipeInput;
}

export default async ({ userId, input }: CreateRecipeParams): Promise<RecipeResponse> => {
    const normalized = normalizeRecipeInput(input);
    const now = new Date();
    const nutrition = await calculateNutrition({
        ingredients: normalized.ingredients,
        servings: normalized.servings,
    });

    const recipe: Omit<NewRecipe, 'nutrition'> = {
        ...normalized,
        createdAt: now,
        updatedAt: now,
        createdBy: new ObjectId(userId),
    };

    const created = await model.insertRecipe({ ...recipe, nutrition });

    return toRecipeResponse(created);
};
