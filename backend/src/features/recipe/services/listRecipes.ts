import model from '../models/index.js';
import toRecipeResponse from './mappers/toRecipeResponse.js';
import type { RecipeResponse } from '../types.js';

interface ListRecipesParams {
    userId: string;
}

export default async ({ userId }: ListRecipesParams): Promise<RecipeResponse[]> => {
    const recipes = await model.findByCreator({ userId });

    return recipes.map(toRecipeResponse);
};
