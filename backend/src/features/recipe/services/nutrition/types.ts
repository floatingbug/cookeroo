export interface FoodRecord {
    blsCode: string;
    nameDe: string;
    nameNormalized: string;
    baseAmount: number;
    baseUnit: string;
    nutrients: Record<string, number>;
}
