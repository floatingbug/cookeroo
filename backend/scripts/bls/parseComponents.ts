import type { Row, Worksheet } from 'exceljs';
import { cellText } from './normalize.js';
import type { NutrientDefinition } from './types.js';

function parseComponentRow(row: Row): NutrientDefinition | null {
    const code = cellText(row.getCell(2).value);

    if (!code) {
        return null;
    }

    return {
        code,
        nameDe: cellText(row.getCell(3).value),
        nameEn: cellText(row.getCell(4).value),
        unit: cellText(row.getCell(5).value),
        groupDe: cellText(row.getCell(6).value),
        groupEn: cellText(row.getCell(7).value),
        formula: cellText(row.getCell(8).value),
        formulaApplication: cellText(row.getCell(9).value),
    };
}

/**
 * Liest das Components-Sheet: Zeile 1 ist der Header, danach folgt eine
 * Zeile pro Nährstoff.
 */
export function parseComponentsSheet(worksheet: Worksheet): NutrientDefinition[] {
    const definitions: NutrientDefinition[] = [];

    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
        const definition = parseComponentRow(worksheet.getRow(rowNumber));

        if (definition) {
            definitions.push(definition);
        }
    }

    return definitions;
}
