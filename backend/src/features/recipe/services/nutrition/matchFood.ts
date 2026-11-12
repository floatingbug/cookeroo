import { normalizeFoodName } from '../../../../utils/normalizeFoodName.js';
import { foodAliasFor } from './foodAliases.js';
import type { FoodRecord } from './types.js';

const MIN_SCORE = 0.8;
const HIGH_CONFIDENCE_SCORE = 0.9;
const AMBIGUITY_GAP = 0.08;
const MIN_FUZZY_SIMILARITY = 0.9;
const PREFIX_LENGTH = 5;

function compact(value: string): string {
    return value.replace(/ /g, '');
}

function levenshtein(left: string, right: string): number {
    let previous = Array.from({ length: right.length + 1 }, (_, index) => index);

    for (let row = 1; row <= left.length; row += 1) {
        const current = [row];

        for (let column = 1; column <= right.length; column += 1) {
            const replacementCost = left[row - 1] === right[column - 1] ? 0 : 1;

            current[column] = Math.min(
                (previous[column] ?? 0) + 1,
                (current[column - 1] ?? 0) + 1,
                (previous[column - 1] ?? 0) + replacementCost,
            );
        }

        previous = current;
    }

    return previous[right.length] ?? 0;
}

function similarity(left: string, right: string): number {
    const longest = Math.max(left.length, right.length);

    if (longest === 0) {
        return 1;
    }

    return 1 - levenshtein(left, right) / longest;
}

function scoreTokens(ingredientTokens: string[], foodTokens: string[]): number | null {
    let hasCompoundMatch = false;

    for (const ingredientToken of ingredientTokens) {
        if (foodTokens.includes(ingredientToken)) {
            continue;
        }

        const compoundMatch = foodTokens.some((foodToken) => (
            foodToken.length >= ingredientToken.length + 2
            && (foodToken.includes(ingredientToken) || ingredientToken.includes(foodToken))
        ));

        if (!compoundMatch) {
            return null;
        }

        hasCompoundMatch = true;
    }

    const baseScore = hasCompoundMatch ? 0.84 : 0.86;
    const extraTokens = Math.max(0, foodTokens.length - ingredientTokens.length);

    return baseScore - Math.min(extraTokens, 3) * 0.02;
}

/**
 * Erzeugt kurze Suchpräfixe für die Kandidatensuche in der foods-Collection.
 * Bewusst kurz, damit auch getrennt geschriebene Komposita wie
 * "Haferflocken" -> "Hafer Flocken" gefunden werden.
 */
export function buildSearchPrefixes(names: string[]): string[] {
    const prefixes = new Set<string>();

    for (const name of names) {
        const tokens = normalizeFoodName(name)
            .split(' ')
            .filter((token) => token.length >= 3 && !/^\d+$/.test(token));

        for (const token of tokens) {
            prefixes.add(token.slice(0, PREFIX_LENGTH));
        }
    }

    return [...prefixes];
}

export function scoreFood(ingredientName: string, food: FoodRecord): number {
    const ingredientNormalized = normalizeFoodName(ingredientName);
    const foodNormalized = food.nameNormalized || normalizeFoodName(food.nameDe);

    if (!ingredientNormalized || !foodNormalized) {
        return 0;
    }

    if (ingredientNormalized === foodNormalized) {
        return 1;
    }

    const ingredientCompact = compact(ingredientNormalized);
    const foodCompact = compact(foodNormalized);

    if (ingredientCompact === foodCompact) {
        return 0.98;
    }

    if (foodNormalized.startsWith(`${ingredientNormalized} `)) {
        return 0.92;
    }

    if (ingredientNormalized.startsWith(`${foodNormalized} `)) {
        return 0.88;
    }

    const tokenScore = scoreTokens(
        ingredientNormalized.split(' '),
        foodNormalized.split(' '),
    );

    if (tokenScore !== null) {
        return tokenScore;
    }

    const fuzzyScore = similarity(ingredientCompact, foodCompact);

    return fuzzyScore >= MIN_FUZZY_SIMILARITY ? fuzzyScore * 0.9 : 0;
}

/**
 * Liefert nur dann einen Treffer, wenn der beste Kandidat eindeutig ist.
 * Mehrdeutige Zutaten wie "Saft" bleiben bewusst unberücksichtigt.
 */
export function matchFood(ingredientName: string, foods: FoodRecord[]): FoodRecord | null {
    const alias = foodAliasFor(ingredientName);

    if (alias !== null) {
        const aliasedFood = foods.find((food) => (
            (food.nameNormalized || normalizeFoodName(food.nameDe)) === alias
        ));

        if (aliasedFood) {
            return aliasedFood;
        }
    }

    const scored = foods
        .map((food) => ({ food, score: scoreFood(ingredientName, food) }))
        .filter((candidate) => candidate.score > 0)
        .sort((left, right) => right.score - left.score);

    const best = scored[0];

    if (!best || best.score < MIN_SCORE) {
        return null;
    }

    if (best.score >= HIGH_CONFIDENCE_SCORE) {
        const tied = scored.filter((candidate) => (
            Math.abs(candidate.score - best.score) < 0.000001
        ));

        return [...tied]
            .sort((left, right) => (
                left.food.nameNormalized.length - right.food.nameNormalized.length
                || left.food.blsCode.localeCompare(right.food.blsCode)
            ))[0]!.food;
    }

    const second = scored.find((candidate) => candidate.food.blsCode !== best.food.blsCode);

    if (second && best.score - second.score < AMBIGUITY_GAP) {
        return null;
    }

    return best.food;
}
