import model from '../../models/index.js';
import { foodAliasFor } from './foodAliases.js';
import { buildSearchPrefixes, matchFood } from './matchFood.js';
import { toGrams } from './units.js';
import type {
    IngredientDocument,
    NutritionValues,
    RecipeNutrition,
} from '../../types.js';
import type { FoodRecord } from './types.js';

interface CalculateNutritionParams {
    ingredients: IngredientDocument[];
    servings: number;
}

function emptyValues(): NutritionValues {
    return {
        calories: 0,
        protein: 0,
        fat: 0,
        carbohydrates: 0,
        fiber: 0,
        sugar: 0,
        salt: 0,
    };
}

function nutrient(food: FoodRecord, code: string): number {
    return food.nutrients[code] ?? 0;
}

function addFood(target: NutritionValues, food: FoodRecord, factor: number): void {
    target.calories += nutrient(food, 'ENERCC') * factor;
    target.protein += nutrient(food, 'PROT625') * factor;
    target.fat += nutrient(food, 'FAT') * factor;
    target.carbohydrates += nutrient(food, 'CHO') * factor;
    target.fiber += nutrient(food, 'FIBT') * factor;
    target.sugar += nutrient(food, 'SUGAR') * factor;
    target.salt += nutrient(food, 'NACL') * factor;
}

function round(value: number, digits: number): number {
    const factor = 10 ** digits;
    const rounded = Math.round((value + Number.EPSILON) * factor) / factor;

    return Object.is(rounded, -0) ? 0 : rounded;
}

function roundValues(values: NutritionValues): NutritionValues {
    return {
        calories: round(values.calories, 0),
        protein: round(values.protein, 1),
        fat: round(values.fat, 1),
        carbohydrates: round(values.carbohydrates, 1),
        fiber: round(values.fiber, 1),
        sugar: round(values.sugar, 1),
        salt: round(values.salt, 2),
    };
}

function scaleValues(values: NutritionValues, factor: number): NutritionValues {
    return {
        calories: values.calories * factor,
        protein: values.protein * factor,
        fat: values.fat * factor,
        carbohydrates: values.carbohydrates * factor,
        fiber: values.fiber * factor,
        sugar: values.sugar * factor,
        salt: values.salt * factor,
    };
}

export default async ({
    ingredients,
    servings,
}: CalculateNutritionParams): Promise<RecipeNutrition | null> => {
    const prefixes = buildSearchPrefixes(
        ingredients.flatMap((ingredient) => {
            const alias = foodAliasFor(ingredient.name);

            return alias === null ? [ingredient.name] : [ingredient.name, alias];
        }),
    );
    const foods = await model.findFoodCandidates(prefixes);

    const total = emptyValues();
    const unmatchedIngredients: string[] = [];
    let matchedIngredients = 0;

    for (const ingredient of ingredients) {
        const grams = toGrams(ingredient.quantity, ingredient.unit);
        const food = grams === null ? null : matchFood(ingredient.name, foods);

        if (grams === null || food === null || food.baseAmount <= 0) {
            unmatchedIngredients.push(ingredient.name);
            continue;
        }

        matchedIngredients += 1;
        addFood(total, food, grams / food.baseAmount);
    }

    if (matchedIngredients === 0) {
        return null;
    }

    const servingFactor = 1 / (servings > 0 ? servings : 1);

    return {
        total: roundValues(total),
        perServing: roundValues(scaleValues(total, servingFactor)),
        matchedIngredients,
        totalIngredients: ingredients.length,
        unmatchedIngredients,
    };
};
