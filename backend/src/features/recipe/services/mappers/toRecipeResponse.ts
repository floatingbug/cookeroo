import type { RecipeRecord, RecipeResponse } from '../../types.js';

export default (recipe: RecipeRecord): RecipeResponse => ({
    id: String(recipe._id),
    title: recipe.title,
    description: recipe.description,
    imageUrl: recipe.imageUrl,
    category: recipe.category,
    cuisine: recipe.cuisine,
    difficulty: recipe.difficulty,
    prepTime: recipe.prepTime,
    cookTime: recipe.cookTime,
    restTime: recipe.restTime,
    servings: recipe.servings,
    servingUnit: recipe.servingUnit,
    tags: recipe.tags,
    ingredients: recipe.ingredients,
    instructions: recipe.instructions,
    createdAt: recipe.createdAt.toISOString(),
    updatedAt: recipe.updatedAt.toISOString(),
    createdBy: String(recipe.createdBy),
    isPublic: recipe.isPublic,
    status: recipe.status,
});
