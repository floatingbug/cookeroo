import type { ObjectId, OptionalId, WithId } from 'mongodb';

export type IngredientUnit = 'g' | 'kg' | 'ml' | 'l' | 'piece' | 'tbsp' | 'tsp';

export type RecipeDifficulty = 'easy' | 'medium' | 'hard';

export type RecipeStatus = 'public' | 'private';

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
