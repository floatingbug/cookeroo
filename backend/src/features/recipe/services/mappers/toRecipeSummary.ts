import type { RecipeRecord } from '../../types.js';
import type { RecipeSummary } from '../../../../types/recipe.js';

export default (recipe: RecipeRecord): RecipeSummary => ({
    id: String(recipe._id),
    title: recipe.title,
    imageUrl: recipe.imageUrl,
    category: recipe.category,
    cuisine: recipe.cuisine,
    difficulty: recipe.difficulty,
    prepTime: recipe.prepTime,
    cookTime: recipe.cookTime,
    restTime: recipe.restTime,
    tags: Array.isArray(recipe.tags) ? [...recipe.tags] : [],
    status: recipe.status,
});
