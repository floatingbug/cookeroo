/**
 * Berechnet die Nährwerte bereits gespeicherter Rezepte neu.
 *
 * Ausführung: npm run recalc:nutrition -- [--dry-run]
 */
import config from '../src/config/index.js';
import db from '../src/db/mongo.js';
import calculateNutrition from '../src/features/recipe/services/nutrition/calculateNutrition.js';
import type { RecipeDocument } from '../src/features/recipe/types.js';

const dryRun = process.argv.includes('--dry-run');

async function main(): Promise<void> {
    if (config.env === 'production') {
        throw new Error('Rezept-Neuberechnung läuft nicht in Produktion (NODE_ENV=production).');
    }

    await db.connect();

    const database = db.getDb();
    const recipesCollection = database.collection<RecipeDocument>('recipes');
    const recipes = await recipesCollection.find({}).toArray();

    let withNutrition = 0;
    let withoutNutrition = 0;

    try {
        for (const recipe of recipes) {
            const nutrition = await calculateNutrition({
                ingredients: recipe.ingredients,
                servings: recipe.servings,
            });

            if (nutrition === null) {
                withoutNutrition += 1;
            }
            else {
                withNutrition += 1;
            }

            if (!dryRun) {
                await recipesCollection.updateOne(
                    { _id: recipe._id },
                    { $set: { nutrition } },
                );
            }

            console.log(
                `${dryRun ? 'Dry-Run' : 'Aktualisiert'}: "${recipe.title}" ` +
                `(${nutrition === null ? 'keine Nährwerte' : 'Nährwerte berechnet'})`,
            );
        }

        console.log(
            `${dryRun ? 'Dry-Run beendet' : 'Neuberechnung abgeschlossen'}: ` +
            `${recipes.length} Rezepte, ${withNutrition} mit Nährwerten, ` +
            `${withoutNutrition} ohne Nährwerte.`,
        );
    }
    finally {
        await db._client()?.close();
    }
}

main().catch((err: unknown) => {
    console.error('Neuberechnung fehlgeschlagen:', err);
    process.exitCode = 1;
});
