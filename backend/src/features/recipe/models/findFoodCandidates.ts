import { getDb } from '../../../db/mongo.js';
import type { FoodRecord } from '../services/nutrition/types.js';

const MAX_CANDIDATES = 2000;

function escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default async (prefixes: string[]): Promise<FoodRecord[]> => {
    if (prefixes.length === 0) {
        return [];
    }

    const db = getDb();
    const patterns = prefixes.map((prefix) => new RegExp(escapeRegex(prefix), 'i'));

    return db
        .collection<FoodRecord>('foods')
        .find({ $or: patterns.map((pattern) => ({ nameNormalized: pattern })) })
        .project<FoodRecord>({
            _id: 0,
            blsCode: 1,
            nameDe: 1,
            nameNormalized: 1,
            baseAmount: 1,
            baseUnit: 1,
            nutrients: 1,
        })
        .limit(MAX_CANDIDATES)
        .toArray();
};
