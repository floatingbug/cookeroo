import type { CellValue } from 'exceljs';

export { normalizeFoodName } from '../../src/utils/normalizeFoodName.js';

const NUMBER_PATTERN = /^[-+]?(?:\d+(?:[.,]\d+)?|\.\d+)(?:[eE][-+]?\d+)?$/;

/**
 * ExcelJS kann in einer Zelle neben Text und Zahlen auch Formelergebnisse,
 * Hyperlinks oder Rich-Text liefern. Für den Import zählt nur der sichtbare
 * Text.
 */
export function cellText(value: CellValue | undefined): string {
    if (value === null || value === undefined) {
        return '';
    }

    if (typeof value === 'string') {
        return value.trim();
    }

    if (typeof value === 'number') {
        return String(value);
    }

    if (value instanceof Date) {
        return value.toISOString();
    }

    if (typeof value === 'object') {
        if ('richText' in value && Array.isArray(value.richText)) {
            return value.richText.map((part) => part.text).join('').trim();
        }

        if ('text' in value && typeof value.text === 'string') {
            return value.text.trim();
        }

        if ('result' in value) {
            return cellText(value.result as CellValue);
        }

        if ('error' in value) {
            return '';
        }
    }

    return '';
}

/**
 * Liest einen Nährwert als Zahl. Textmarker wie "-", "<LOD" oder
 * "<LOD or <LOQ" bedeuten "kein Wert" und ergeben null.
 */
export function parseNumericValue(value: CellValue | undefined): number | null {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? roundNutrient(value) : null;
    }

    if (typeof value === 'string') {
        const text = value.trim();

        if (text === '' || !NUMBER_PATTERN.test(text)) {
            return null;
        }

        const parsed = Number(text.replace(',', '.'));

        return Number.isFinite(parsed) ? roundNutrient(parsed) : null;
    }

    if (value !== null && value !== undefined && typeof value === 'object' && 'result' in value) {
        return parseNumericValue(value.result as CellValue);
    }

    return null;
}

/**
 * Entfernt Float-Rauschen aus den Excel-Werten, z. B.
 * 8.6560000000000006 -> 8.656.
 */
export function roundNutrient(value: number): number {
    return Number(value.toPrecision(12));
}

/**
 * Der Header einer Nährstoffspalte beginnt mit dem Nährstoffcode, z. B.
 * "ENERCC Energie (Kilokalorien) [kcal/100g]".
 */
export function headerCode(header: string): string | null {
    const match = /^(\S+)\s/.exec(header);

    return match?.[1] ?? null;
}
