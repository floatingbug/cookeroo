import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSearchPrefixes, matchFood } from '../src/features/recipe/services/nutrition/matchFood.js';
import { toGrams } from '../src/features/recipe/services/nutrition/units.js';
import type { FoodRecord } from '../src/features/recipe/services/nutrition/types.js';

function food(overrides: Partial<FoodRecord>): FoodRecord {
    return {
        blsCode: 'TEST',
        nameDe: 'Testlebensmittel',
        nameNormalized: 'testlebensmittel',
        baseAmount: 100,
        baseUnit: 'g',
        nutrients: {},
        ...overrides,
    };
}

test('toGrams rechnet unterstützte Einheiten um', () => {
    assert.equal(toGrams(200, 'g'), 200);
    assert.equal(toGrams(0.1, 'kg'), 100);
    assert.equal(toGrams(250, 'ml'), 250);
    assert.equal(toGrams(1.5, 'l'), 1500);
});

test('toGrams gibt für Einheiten ohne Grammbezug null zurück', () => {
    assert.equal(toGrams(1, 'piece'), null);
    assert.equal(toGrams(1, 'tbsp'), null);
    assert.equal(toGrams(1, 'tsp'), null);
});

test('buildSearchPrefixes erzeugt kurze Präfixe für alle relevanten Wörter', () => {
    const prefixes = buildSearchPrefixes(['Haferflocken', 'Frische Tomaten', 'Ei', '200 g Mehl']);

    assert.ok(prefixes.includes('hafer'));
    assert.ok(prefixes.includes('frisc'));
    assert.ok(prefixes.includes('tomat'));
    assert.ok(prefixes.includes('mehl'));
    assert.equal(prefixes.includes('ei'), false);
    assert.equal(prefixes.includes('200'), false);
});

test('matchFood findet exakte und kompakte Namen', () => {
    const foods = [
        food({ blsCode: 'A', nameDe: 'Testmehl', nameNormalized: 'testmehl' }),
        food({ blsCode: 'B', nameDe: 'Hafer Flocken', nameNormalized: 'hafer flocken' }),
        food({ blsCode: 'C', nameDe: 'Haferflocken-Nussplätzchen', nameNormalized: 'haferflocken nussplaetzchen' }),
    ];

    assert.equal(matchFood('Testmehl', foods)?.blsCode, 'A');
    assert.equal(matchFood('Haferflocken', foods)?.blsCode, 'B');
});

test('matchFood nutzt Aliasse für generische Zutaten', () => {
    const foods = [
        food({
            blsCode: 'ZUCKER_WEISS',
            nameDe: 'Zucker weiß (Raffinadezucker/Weißzucker)',
            nameNormalized: 'zucker weiss raffinadezucker weisszucker',
        }),
        food({
            blsCode: 'ZUCKER_BRAUN',
            nameDe: 'Zucker braun (Kandisfarin/Rohzucker)',
            nameNormalized: 'zucker braun kandisfarin rohzucker',
        }),
        food({
            blsCode: 'MEHL',
            nameDe: 'Weizen Mehl, Type 405',
            nameNormalized: 'weizen mehl type 405',
        }),
        food({
            blsCode: 'EI',
            nameDe: 'Hühnerei roh',
            nameNormalized: 'huehnerei roh',
        }),
    ];

    assert.equal(matchFood('Zucker', foods)?.blsCode, 'ZUCKER_WEISS');
    assert.equal(matchFood('Mehl', foods)?.blsCode, 'MEHL');
    assert.equal(matchFood('Ei', foods)?.blsCode, 'EI');
});

test('matchFood wählt bei gleicher Confidence deterministisch', () => {
    const foods = [
        food({
            blsCode: 'TOMATE_KONSERVE',
            nameDe: 'Tomate geschält, Konserve',
            nameNormalized: 'tomate geschaelt konserve',
        }),
        food({
            blsCode: 'TOMATE_ROH',
            nameDe: 'Tomate roh',
            nameNormalized: 'tomate roh',
        }),
    ];

    assert.equal(matchFood('Tomate', foods)?.blsCode, 'TOMATE_ROH');
});

test('matchFood findet eindeutige spezifischere und zusammengesetzte Namen', () => {
    const foods = [
        food({ blsCode: 'TOMATE', nameDe: 'Tomate roh', nameNormalized: 'tomate roh' }),
        food({ blsCode: 'KETCHUP', nameDe: 'Tomatenketchup', nameNormalized: 'tomatenketchup' }),
        food({ blsCode: 'ZWIEBEL', nameDe: 'Speisezwiebel roh', nameNormalized: 'speisezwiebel roh' }),
    ];

    assert.equal(matchFood('Tomate', foods)?.blsCode, 'TOMATE');
    assert.equal(matchFood('Zwiebel', foods)?.blsCode, 'ZWIEBEL');
});

test('matchFood verwirft mehrdeutige Treffer ohne Alias', () => {
    const foods = [
        food({ blsCode: 'APFEL', nameDe: 'Apfelsaft', nameNormalized: 'apfelsaft' }),
        food({ blsCode: 'ORANGE', nameDe: 'Orangensaft', nameNormalized: 'orangensaft' }),
    ];

    assert.equal(matchFood('Saft', foods), null);
});

test('matchFood liefert ohne passenden Kandidaten null', () => {
    const foods = [food({})];

    assert.equal(matchFood('Unbekannte Zutat', foods), null);
});
