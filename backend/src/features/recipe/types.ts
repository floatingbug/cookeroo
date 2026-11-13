import type { ObjectId, OptionalId, WithId } from 'mongodb';
import type { RecipeDifficulty, RecipeStatus, RecipeSummary } from '../../types/recipe.js';

export type { RecipeDifficulty, RecipeStatus } from '../../types/recipe.js';

export type IngredientUnit = 'g' | 'kg' | 'ml' | 'l' | 'piece' | 'tbsp' | 'tsp';

export interface IngredientDocument {
    name: string;
    quantity: number;
    unit: IngredientUnit;
    note: string | null;
    isOptional: boolean;
}

export interface InstructionDocument {
    step: number;
    description: string;
    duration: number | null;
    imageUrl: string | null;
}

export interface NutritionValues {
    calories: number;
    protein: number;
    fat: number;
    carbohydrates: number;
    fiber: number;
    sugar: number;
    salt: number;
}

export interface RecipeNutrition {
    total: NutritionValues;
    perServing: NutritionValues;
    matchedIngredients: number;
    totalIngredients: number;
    unmatchedIngredients: string[];
}

export interface CreateRecipeInput {
    title: string;
    description?: string | null;
    imageUrl?: string | null;
    category?: string | null;
    cuisine?: string | null;
    difficulty?: RecipeDifficulty | null;
    prepTime: number;
    cookTime: number;
    restTime?: number | null;
    servings: number;
    servingUnit?: string | null;
    tags?: string[];
    ingredients: IngredientDocument[];
    instructions: InstructionDocument[];
    isPublic?: boolean;
}

export type UpdateRecipeInput = CreateRecipeInput;

export interface RecipeDocument {
    _id?: ObjectId;
    title: string;
    description: string | null;
    imageUrl: string | null;
    category: string | null;
    cuisine: string | null;
    difficulty: RecipeDifficulty | null;
    prepTime: number;
    cookTime: number;
    restTime: number | null;
    servings: number;
    servingUnit: string | null;
    tags: string[];
    ingredients: IngredientDocument[];
    instructions: InstructionDocument[];
    nutrition: RecipeNutrition | null;
    createdAt: Date;
    updatedAt: Date;
    createdBy: ObjectId;
    isPublic: boolean;
    status: RecipeStatus;
}

export type NewRecipe = OptionalId<RecipeDocument>;

export type RecipeRecord = WithId<RecipeDocument>;

export interface RecipeSearchResponse {
    items: RecipeSummary[];
    nextOffset: number | null;
}

export interface RecipeResponse {
    id: string;
    title: string;
    description: string | null;
    imageUrl: string | null;
    category: string | null;
    cuisine: string | null;
    difficulty: RecipeDifficulty | null;
    prepTime: number;
    cookTime: number;
    restTime: number | null;
    servings: number;
    servingUnit: string | null;
    tags: string[];
    ingredients: IngredientDocument[];
    instructions: InstructionDocument[];
    nutrition: RecipeNutrition | null;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    isPublic: boolean;
    status: RecipeStatus;
}
