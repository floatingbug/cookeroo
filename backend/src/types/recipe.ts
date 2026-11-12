export type RecipeDifficulty = 'easy' | 'medium' | 'hard';

export type RecipeStatus = 'public' | 'private';

/**
 * Compact recipe data used by recipe search results and meal plan entries.
 * Shared because both the recipe and meal-plan features expose it.
 */
export interface RecipeSummary {
    id: string;
    title: string;
    imageUrl: string | null;
    category: string | null;
    cuisine: string | null;
    difficulty: RecipeDifficulty | null;
    prepTime: number;
    cookTime: number;
    restTime: number | null;
    tags: string[];
    status: RecipeStatus;
}
