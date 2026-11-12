import type { IngredientUnit } from '../../types.js';

const GRAMS_PER_UNIT: Partial<Record<IngredientUnit, number>> = {
    g: 1,
    kg: 1000,
    ml: 1,
    l: 1000,
};

/**
 * Rechnet eine Zutatenmenge in Gramm um. Für Milliliter wird eine Dichte von
 * etwa 1 g/ml angenommen. Einheiten ohne verlässlichen Grammbezug liefern
 * null.
 */
export function toGrams(quantity: number, unit: IngredientUnit): number | null {
    const factor = GRAMS_PER_UNIT[unit];

    return factor === undefined ? null : quantity * factor;
}
