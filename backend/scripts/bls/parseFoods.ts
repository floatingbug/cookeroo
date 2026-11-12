import type { Row, Worksheet } from 'exceljs';
import { cellText, headerCode, normalizeFoodName, parseNumericValue } from './normalize.js';
import type { ColumnMapping, FoodDocument } from './types.js';

const FIXED_COLUMNS = 3;
const NOTE_HEADER = 'Hinweis';
const BLS_VERSION = '4.0';

export function buildColumnMapping(headerRow: Row, nutrientCodes: Set<string>): ColumnMapping {
    const valueColumns: ColumnMapping['valueColumns'] = [];
    let noteColumn: number | null = null;

    for (let column = 1; column <= headerRow.cellCount; column += 1) {
        const header = cellText(headerRow.getCell(column).value);

        if (!header) {
            continue;
        }

        if (header === NOTE_HEADER) {
            noteColumn = column;
            continue;
        }

        if (column <= FIXED_COLUMNS) {
            continue;
        }

        const code = headerCode(header);

        if (!code || !nutrientCodes.has(code)) {
            continue;
        }

        // Jeder Nährstoff hat drei Spalten: Wert, Datenherkunft, Referenz.
        if (header.includes('Datenherkunft') || header.includes('Referenz')) {
            continue;
        }

        valueColumns.push({ code, column });
    }

    return { valueColumns, noteColumn };
}

export function parseFoodRow(
    row: Row,
    mapping: ColumnMapping,
    importedAt: Date,
): FoodDocument | null {
    const blsCode = cellText(row.getCell(1).value);
    const nameDe = cellText(row.getCell(2).value);

    if (!blsCode || !nameDe) {
        return null;
    }

    const nutrients: Record<string, number> = {};

    for (const { code, column } of mapping.valueColumns) {
        const value = parseNumericValue(row.getCell(column).value);

        if (value !== null) {
            nutrients[code] = value;
        }
    }

    const note = mapping.noteColumn === null
        ? ''
        : cellText(row.getCell(mapping.noteColumn).value);

    return {
        blsCode,
        nameDe,
        nameEn: cellText(row.getCell(3).value),
        nameNormalized: normalizeFoodName(nameDe),
        baseAmount: 100,
        baseUnit: 'g',
        nutrients,
        note: note === '' ? null : note,
        blsVersion: BLS_VERSION,
        importedAt,
    };
}

/**
 * Liest das Daten-Sheet: Zeile 1 ist der Header, danach folgt ein
 * Lebensmittel pro Zeile.
 */
export function parseFoodsSheet(
    worksheet: Worksheet,
    mapping: ColumnMapping,
    importedAt: Date,
): { foods: FoodDocument[]; skippedRows: number } {
    const foods: FoodDocument[] = [];
    let skippedRows = 0;

    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
        const food = parseFoodRow(worksheet.getRow(rowNumber), mapping, importedAt);

        if (food) {
            foods.push(food);
        }
        else {
            skippedRows += 1;
        }
    }

    return { foods, skippedRows };
}
