import { AppError } from '../../../types/errors.js';
import type {
    CreateRecipeInput,
    IngredientDocument,
    InstructionDocument,
    RecipeDocument,
} from '../types.js';

export type NormalizedRecipeInput = Omit<
    RecipeDocument,
    '_id' | 'nutrition' | 'createdAt' | 'updatedAt' | 'createdBy'
>;

function requiredText(value: unknown, field: string): string {
    const text = typeof value === 'string' ? value.trim() : '';

    if (!text) {
        throw new AppError(400, `${field} must not be empty.`);
    }

    return text;
}

function optionalText(value: unknown): string | null {
    if (typeof value !== 'string') {
        return null;
    }

    const text = value.trim();

    return text === '' ? null : text;
}

function normalizeIngredients(input: CreateRecipeInput['ingredients']): IngredientDocument[] {
    return input.map((ingredient) => ({
        name: requiredText(ingredient.name, 'Ingredient name'),
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        note: optionalText(ingredient.note),
        isOptional: ingredient.isOptional === true,
    }));
}

function normalizeInstructions(input: CreateRecipeInput['instructions']): InstructionDocument[] {
    const instructions = input
        .map((instruction) => ({
            step: instruction.step,
            description: requiredText(instruction.description, 'Instruction description'),
            duration: typeof instruction.duration === 'number' ? instruction.duration : null,
            imageUrl: optionalText(instruction.imageUrl),
        }))
        .sort((a, b) => a.step - b.step);

    instructions.forEach((instruction, index) => {
        if (instruction.step !== index + 1) {
            throw new AppError(400, 'Instruction steps must be unique and start at 1.');
        }
    });

    return instructions;
}

function normalizeTags(tags: unknown): string[] {
    if (!Array.isArray(tags)) {
        return [];
    }

    return [...new Set(
        tags
            .filter((tag): tag is string => typeof tag === 'string')
            .map((tag) => tag.trim())
            .filter((tag) => tag !== ''),
    )];
}

/**
 * Validiert und normalisiert die vom Client gelieferten Rezeptfelder.
 * Wird von Create und Update gemeinsam genutzt, damit beide Endpunkte
 * identische Regeln anwenden.
 */
export default function normalizeRecipeInput(input: CreateRecipeInput): NormalizedRecipeInput {
    const ingredients = normalizeIngredients(input.ingredients);
    const instructions = normalizeInstructions(input.instructions);
    const isPublic = input.isPublic !== false;

    return {
        title: requiredText(input.title, 'Title'),
        description: optionalText(input.description),
        imageUrl: optionalText(input.imageUrl),
        category: optionalText(input.category),
        cuisine: optionalText(input.cuisine),
        difficulty: input.difficulty ?? null,
        prepTime: input.prepTime,
        cookTime: input.cookTime,
        restTime: typeof input.restTime === 'number' ? input.restTime : null,
        servings: input.servings,
        servingUnit: optionalText(input.servingUnit),
        tags: normalizeTags(input.tags),
        ingredients,
        instructions,
        isPublic,
        status: isPublic ? 'public' : 'private',
    };
}
