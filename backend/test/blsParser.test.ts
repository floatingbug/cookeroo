import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Row } from 'exceljs';
import {
    cellText,
    headerCode,
    normalizeFoodName,
    parseNumericValue,
} from '../scripts/bls/normalize.js';
import { buildColumnMapping, parseFoodRow } from '../scripts/bls/parseFoods.js';

function mockRow(values: Record<number, unknown>): Row {
    const cellCount = Math.max(0, ...Object.keys(values).map(Number));

    return {
        cellCount,
        getCell: (column: number) => ({ value: values[column] ?? null }),
    } as unknown as Row;
}

test('cellText liest Text, Zahlen und Rich-Text', () => {
    assert.equal(cellText('  Mais roh  '), 'Mais roh');
    assert.equal(cellText(42), '42');
    assert.equal(cellText(null), '');
    assert.equal(
        cellText({ richText: [{ text: 'Mais' }, { text: ' roh' }] } as never),
        'Mais roh',
    );
});

test('parseNumericValue ignoriert Textmarker und rundet Float-Rauschen', () => {
    assert.equal(parseNumericValue(8.6560000000000006), 8.656);
    assert.equal(parseNumericValue('0,5'), 0.5);
    assert.equal(parseNumericValue('1.5E-2'), 0.015);
    assert.equal(parseNumericValue(0), 0);
    assert.equal(parseNumericValue('-'), null);
    assert.equal(parseNumericValue('<LOD'), null);
    assert.equal(parseNumericValue('<LOD or <LOQ'), null);
    assert.equal(parseNumericValue(''), null);
    assert.equal(parseNumericValue(null), null);
});

test('normalizeFoodName vereinheitlicht Umlaute und Sonderzeichen', () => {
    assert.equal(normalizeFoodName('Möhren, roh (geschält)'), 'moehren roh geschaelt');
    assert.equal(normalizeFoodName('Crème fraîche'), 'creme fraiche');
    assert.equal(normalizeFoodName('  Mais   roh  '), 'mais roh');
});

test('headerCode liest den Nährstoffcode aus dem Spaltenkopf', () => {
    assert.equal(headerCode('ENERCC Energie (Kilokalorien) [kcal/100g]'), 'ENERCC');
    assert.equal(headerCode('F18:1CN9 Fettsäure [g/100g]'), 'F18:1CN9');
    assert.equal(headerCode('Hinweis'), null);
});

test('buildColumnMapping findet Wertspalten und ignoriert Herkunft/Referenz', () => {
    const headerRow = mockRow({
        1: 'BLS Code',
        2: 'Lebensmittelbezeichnung',
        3: 'Food name',
        4: 'ENERCC Energie (Kilokalorien) [kcal/100g]',
        5: 'ENERCC Datenherkunft',
        6: 'ENERCC Referenz',
        7: 'SUGAR Zucker [g/100g]',
        8: 'Hinweis',
    });

    const mapping = buildColumnMapping(headerRow, new Set(['ENERCC', 'SUGAR']));

    assert.deepEqual(mapping.valueColumns, [
        { code: 'ENERCC', column: 4 },
        { code: 'SUGAR', column: 7 },
    ]);
    assert.equal(mapping.noteColumn, 8);
});

test('parseFoodRow erzeugt ein Food-Dokument mit Nährwerten pro 100 g', () => {
    const mapping = {
        valueColumns: [
            { code: 'ENERCC', column: 4 },
            { code: 'SUGAR', column: 5 },
        ],
        noteColumn: 6,
    };
    const importedAt = new Date('2026-01-01T00:00:00.000Z');
    const row = mockRow({
        1: 'C341000',
        2: 'Mais roh',
        3: 'Maize raw',
        4: 336,
        5: 7.7,
        6: 'Testhinweis',
    });

    const food = parseFoodRow(row, mapping, importedAt);

    assert.ok(food);
    assert.equal(food.blsCode, 'C341000');
    assert.equal(food.nameDe, 'Mais roh');
    assert.equal(food.nameEn, 'Maize raw');
    assert.equal(food.nameNormalized, 'mais roh');
    assert.equal(food.baseAmount, 100);
    assert.equal(food.baseUnit, 'g');
    assert.deepEqual(food.nutrients, { ENERCC: 336, SUGAR: 7.7 });
    assert.equal(food.note, 'Testhinweis');
    assert.equal(food.blsVersion, '4.0');
    assert.equal(food.importedAt, importedAt);
});

test('parseFoodRow überspringt Zeilen ohne BLS-Code oder Namen', () => {
    const mapping = { valueColumns: [], noteColumn: null };

    assert.equal(parseFoodRow(mockRow({}), mapping, new Date()), null);
    assert.equal(parseFoodRow(mockRow({ 1: 'C341000' }), mapping, new Date()), null);
    assert.equal(parseFoodRow(mockRow({ 2: 'Mais roh' }), mapping, new Date()), null);
});
