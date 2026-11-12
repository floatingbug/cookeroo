import type {
    IngredientDocument,
    InstructionDocument,
    NutritionValues,
    RecipeNutrition,
    RecipeRecord,
    RecipeResponse,
} from '../../types.js';

function toIngredientResponse(ingredient: IngredientDocument): IngredientDocument {
    return {
        name: ingredient.name,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        note: ingredient.note,
        isOptional: ingredient.isOptional,
    };
}

function toInstructionResponse(instruction: InstructionDocument): InstructionDocument {
    return {
        step: instruction.step,
        description: instruction.description,
        duration: instruction.duration,
        imageUrl: instruction.imageUrl,
    };
}

function toNutritionValues(value: unknown): NutritionValues | null {
    if (typeof value !== 'object' || value === null) {
        return null;
    }

    const record = value as Record<string, unknown>;
    const values = {} as NutritionValues;
    const keys = [
        'calories',
        'protein',
        'fat',
        'carbohydrates',
        'fiber',
        'sugar',
        'salt',
    ] as const;

    for (const key of keys) {
        const nutrient = record[key];

        if (typeof nutrient !== 'number' || !Number.isFinite(nutrient)) {
            return null;
        }

        values[key] = nutrient;
    }

    return values;
}

function toNutritionResponse(nutrition: unknown): RecipeNutrition | null {
    if (typeof nutrition !== 'object' || nutrition === null) {
        return null;
    }

    const record = nutrition as Record<string, unknown>;
    const total = toNutritionValues(record.total);
    const perServing = toNutritionValues(record.perServing);
    const matchedIngredients = record.matchedIngredients;
    const totalIngredients = record.totalIngredients;
    const unmatchedIngredients = record.unmatchedIngredients;

    if (
        total === null
        || perServing === null
        || typeof matchedIngredients !== 'number'
        || !Number.isInteger(matchedIngredients)
        || matchedIngredients < 0
        || typeof totalIngredients !== 'number'
        || !Number.isInteger(totalIngredients)
        || totalIngredients < 1
        || !Array.isArray(unmatchedIngredients)
        || !unmatchedIngredients.every((ingredient) => typeof ingredient === 'string')
    ) {
        return null;
    }

    return {
        total,
        perServing,
        matchedIngredients,
        totalIngredients,
        unmatchedIngredients: [...unmatchedIngredients],
    };
}

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
    ingredients: recipe.ingredients.map(toIngredientResponse),
    instructions: recipe.instructions.map(toInstructionResponse),
    nutrition: toNutritionResponse(recipe.nutrition),
    createdAt: recipe.createdAt.toISOString(),
    updatedAt: recipe.updatedAt.toISOString(),
    createdBy: String(recipe.createdBy),
    isPublic: recipe.isPublic,
    status: recipe.status,
});
