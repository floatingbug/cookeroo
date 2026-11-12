import { ObjectId } from '../../../db/mongo.js';
import { AppError } from '../../../types/errors.js';
import model from '../models/index.js';
import calculateNutrition from './nutrition/calculateNutrition.js';
import toRecipeResponse from './mappers/toRecipeResponse.js';
import type {
  CreateRecipeInput,
  IngredientDocument,
  InstructionDocument,
  NewRecipe,
  RecipeResponse,
} from '../types.js';

interface CreateRecipeParams {
  userId: string;
  input: CreateRecipeInput;
}

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

export default async ({ userId, input }: CreateRecipeParams): Promise<RecipeResponse> => {
  const ingredients = normalizeIngredients(input.ingredients);
  const instructions = normalizeInstructions(input.instructions);
  const servings = input.servings;
  const now = new Date();
  const isPublic = input.isPublic !== false;

  const recipe: Omit<NewRecipe, 'nutrition'> = {
    title: requiredText(input.title, 'Title'),
    description: optionalText(input.description),
    imageUrl: optionalText(input.imageUrl),
    category: optionalText(input.category),
    cuisine: optionalText(input.cuisine),
    difficulty: input.difficulty ?? null,
    prepTime: input.prepTime,
    cookTime: input.cookTime,
    restTime: typeof input.restTime === 'number' ? input.restTime : null,
    servings,
    servingUnit: optionalText(input.servingUnit),
    tags: normalizeTags(input.tags),
    ingredients,
    instructions,
    createdAt: now,
    updatedAt: now,
    createdBy: new ObjectId(userId),
    isPublic,
    status: isPublic ? 'public' : 'private',
  };

  const nutrition = await calculateNutrition({ ingredients, servings });

  console.log(nutrition);

  const created = await model.insertRecipe({ ...recipe, nutrition });

  return toRecipeResponse(created);
};
