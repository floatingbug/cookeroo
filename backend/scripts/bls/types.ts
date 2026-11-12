export interface NutrientDefinition {
    code: string;
    nameDe: string;
    nameEn: string;
    unit: string;
    groupDe: string;
    groupEn: string;
    formula: string;
    formulaApplication: string;
}

export interface FoodDocument {
    blsCode: string;
    nameDe: string;
    nameEn: string;
    nameNormalized: string;
    baseAmount: number;
    baseUnit: 'g';
    nutrients: Record<string, number>;
    note: string | null;
    blsVersion: string;
    importedAt: Date;
}

export interface ValueColumn {
    code: string;
    column: number;
}

export interface ColumnMapping {
    valueColumns: ValueColumn[];
    noteColumn: number | null;
}
