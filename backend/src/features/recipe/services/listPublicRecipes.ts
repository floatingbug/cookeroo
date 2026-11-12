import model from '../models/index.js';
import toRecipeResponse from './mappers/toRecipeResponse.js';
import type { RecipeResponse } from '../types.js';

export default async (): Promise<RecipeResponse[]> => {
    const recipes = await model.findPublic();

    return recipes.map(toRecipeResponse);
};
