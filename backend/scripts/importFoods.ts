/**
 * Importiert die BLS-4.0-Lebensmitteldaten aus backend/data in MongoDB.
 *
 * Erzeugt die Collection "foods" (ein Dokument pro Lebensmittel, Nährwerte
 * pro 100 g) und die Collection "nutrients" (Nährstoff-Stammdaten inklusive
 * Einheit und Gruppe).
 *
 * Ausführung: npm run seed:foods (im Ordner backend/)
 */
import path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import ExcelJS from 'exceljs';
import type { Collection, Db, Document } from 'mongodb';
import config from '../src/config/index.js';
import db from '../src/db/mongo.js';
import { parseComponentsSheet } from './bls/parseComponents.js';
import { buildColumnMapping, parseFoodsSheet } from './bls/parseFoods.js';
import type { NutrientDefinition } from './bls/types.js';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const defaultDataDir = path.resolve(scriptDir, '..', 'data', 'BLS_4_0_2025_DE');
const dataFileName = 'BLS_4_0_Daten_2025_DE.xlsx';
const componentsFileName = 'BLS_4_0_Components_DE_EN.xlsx';
const batchSize = 500;

interface Options {
    dataDir: string;
    drop: boolean;
    dryRun: boolean;
}

interface WriteStats {
    inserted: number;
    updated: number;
    unchanged: number;
}

function printHelp(): void {
    console.log(`Verwendung: npm run seed:foods -- [Optionen]

Optionen:
  --data <dir>   Ordner mit den BLS-Excel-Dateien
  --drop         Collection "foods" vor dem Import leeren
  --dry-run      Nur parsen und Statistik ausgeben, keine Datenbank ändern
  --help         Diese Hilfe ausgeben`);
}

function parseArgs(argv: string[]): Options {
    const options: Options = {
        dataDir: defaultDataDir,
        drop: false,
        dryRun: false,
    };

    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index] ?? '';

        if (arg === '--drop') {
            options.drop = true;
            continue;
        }

        if (arg === '--dry-run') {
            options.dryRun = true;
            continue;
        }

        if (arg === '--data') {
            const value = argv[index + 1];

            if (!value) {
                throw new Error('--data erwartet einen Pfad.');
            }

            options.dataDir = path.resolve(value);
            index += 1;
            continue;
        }

        if (arg === '--help' || arg === '-h') {
            printHelp();
            process.exit(0);
        }

        throw new Error(`Unbekannte Option: ${arg}`);
    }

    return options;
}

async function readFirstWorksheet(filePath: string): Promise<ExcelJS.Worksheet> {
    if (!existsSync(filePath)) {
        throw new Error(`Datei nicht gefunden: ${filePath}`);
    }

    const workbook = new ExcelJS.Workbook();

    await workbook.xlsx.readFile(filePath);

    const worksheet = workbook.worksheets[0];

    if (!worksheet) {
        throw new Error(`Keine Tabelle in Datei: ${filePath}`);
    }

    return worksheet;
}

function chunk<T>(items: T[], size: number): T[][] {
    const chunks: T[][] = [];

    for (let index = 0; index < items.length; index += size) {
        chunks.push(items.slice(index, index + size));
    }

    return chunks;
}

async function upsertDocuments(
    collection: Collection<Document>,
    key: string,
    documents: Document[],
): Promise<WriteStats> {
    if (documents.length === 0) {
        return { inserted: 0, updated: 0, unchanged: 0 };
    }

    const result = await collection.bulkWrite(
        documents.map((document) => ({
            updateOne: {
                filter: { [key]: document[key] },
                update: { $set: document },
                upsert: true,
            },
        })),
        { ordered: false },
    );

    return {
        inserted: result.upsertedCount,
        updated: result.modifiedCount,
        unchanged: documents.length - result.upsertedCount - result.modifiedCount,
    };
}

async function ensureIndexes(database: Db): Promise<void> {
    await database
        .collection('foods')
        .createIndex({ blsCode: 1 }, { unique: true, name: 'uniq_foods_bls_code' });

    await database
        .collection('foods')
        .createIndex({ nameNormalized: 1 }, { name: 'idx_foods_name_normalized' });

    await database
        .collection('nutrients')
        .createIndex({ code: 1 }, { unique: true, name: 'uniq_nutrients_code' });
}

function formatStats(stats: WriteStats): string {
    return `${stats.inserted} neu, ${stats.updated} aktualisiert, ${stats.unchanged} unverändert`;
}

async function main(): Promise<void> {
    const options = parseArgs(process.argv.slice(2));
    const dataFile = path.join(options.dataDir, dataFileName);
    const componentsFile = path.join(options.dataDir, componentsFileName);

    console.log(`BLS-Import aus: ${options.dataDir}`);

    if (config.env === 'production') {
        throw new Error('Import-Script läuft nicht in Produktion (NODE_ENV=production).');
    }

    const [dataSheet, componentsSheet] = await Promise.all([
        readFirstWorksheet(dataFile),
        readFirstWorksheet(componentsFile),
    ]);

    const definitions = parseComponentsSheet(componentsSheet);

    if (definitions.length === 0) {
        throw new Error('Keine Nährstoff-Definitionen gefunden.');
    }

    const nutrientCodes = new Set(definitions.map((definition: NutrientDefinition) => definition.code));
    const mapping = buildColumnMapping(dataSheet.getRow(1), nutrientCodes);

    if (mapping.valueColumns.length === 0) {
        throw new Error('Keine Nährstoffspalten im Daten-Sheet gefunden.');
    }

    const importedAt = new Date();
    const { foods, skippedRows } = parseFoodsSheet(dataSheet, mapping, importedAt);
    const sample = foods[0];

    console.log(`Nährstoffe: ${definitions.length}, Wertspalten: ${mapping.valueColumns.length}`);
    console.log(`Lebensmittel: ${foods.length} gelesen, ${skippedRows} Zeilen übersprungen`);

    if (sample) {
        const nutrientCount = Object.keys(sample.nutrients).length;

        console.log(
            `Beispiel: ${sample.blsCode} "${sample.nameDe}" mit ${nutrientCount} Nährwerten ` +
            `(ENERCC: ${sample.nutrients.ENERCC ?? '-'} kcal, SUGAR: ${sample.nutrients.SUGAR ?? '-'} g)`,
        );
    }

    if (options.dryRun) {
        console.log('Dry-Run: keine Datenbankänderung.');
        return;
    }

    await db.connect();

    const database = db.getDb();

    try {
        await ensureIndexes(database);

        const foodsCollection = database.collection('foods');

        if (options.drop) {
            const deleted = await foodsCollection.deleteMany({});

            console.log(`--drop: ${deleted.deletedCount} bestehende Lebensmittel gelöscht.`);
        }

        const nutrientStats = await upsertDocuments(
            database.collection('nutrients'),
            'code',
            definitions as unknown as Document[],
        );

        console.log(`Nährstoffe geschrieben: ${formatStats(nutrientStats)}`);

        const total: WriteStats = { inserted: 0, updated: 0, unchanged: 0 };
        const batches = chunk(foods as unknown as Document[], batchSize);

        for (let index = 0; index < batches.length; index += 1) {
            const stats = await upsertDocuments(foodsCollection, 'blsCode', batches[index] ?? []);

            total.inserted += stats.inserted;
            total.updated += stats.updated;
            total.unchanged += stats.unchanged;

            const processed = Math.min((index + 1) * batchSize, foods.length);

            if (processed % 1000 === 0 || processed === foods.length) {
                console.log(`  ${processed}/${foods.length} Lebensmittel geschrieben`);
            }
        }

        console.log(`Lebensmittel geschrieben: ${formatStats(total)}`);
        console.log('Import abgeschlossen.');
    }
    finally {
        await db._client()?.close();
    }
}

main().catch((err: unknown) => {
    console.error('Import fehlgeschlagen:', err);
    process.exitCode = 1;
});
