/**
 * Legt eine kuratierte Sammlung von Testrezepten für den Testnutzer "bob" an.
 *
 * Die Rezepte werden direkt in der recipes-Collection gespeichert und die
 * Nährwerte über denselben Service wie beim Anlegen über die API berechnet.
 * Das Script ist idempotent: Rezepte mit gleichem Titel und Ersteller werden
 * aktualisiert statt dupliziert.
 *
 * Voraussetzungen:
 * - Testnutzer vorhanden: npm run seed:test-user
 * - Foods für Nährwerte vorhanden (optional): npm run seed:foods
 *
 * Ausführung: npm run seed:test-recipes -- [--dry-run]
 */
import config from '../src/config/index.js';
import db from '../src/db/mongo.js';
import calculateNutrition from '../src/features/recipe/services/nutrition/calculateNutrition.js';
import type {
    CreateRecipeInput,
    NewRecipe,
} from '../src/features/recipe/types.js';

const TEST_USER_NAME = 'bob';

const TEST_RECIPES: CreateRecipeInput[] = [
    {
        title: 'Spaghetti Bolognese',
        description: 'Klassische Bolognese mit Rinderhack und langsam geschmorten Tomaten.',
        category: 'Hauptgericht',
        cuisine: 'Italienisch',
        difficulty: 'medium',
        prepTime: 15,
        cookTime: 40,
        restTime: null,
        servings: 4,
        servingUnit: 'Portion',
        tags: ['Pasta', 'Klassiker', 'Familie'],
        ingredients: [
            { name: 'Spaghetti', quantity: 400, unit: 'g', note: null, isOptional: false },
            { name: 'Rinderhackfleisch', quantity: 500, unit: 'g', note: null, isOptional: false },
            { name: 'Zwiebeln', quantity: 1, unit: 'piece', note: 'fein gewürfelt', isOptional: false },
            { name: 'Knoblauch', quantity: 2, unit: 'piece', note: null, isOptional: false },
            { name: 'Passierte Tomaten', quantity: 400, unit: 'g', note: null, isOptional: false },
            { name: 'Olivenöl', quantity: 2, unit: 'tbsp', note: null, isOptional: false },
            { name: 'Salz', quantity: 1, unit: 'tsp', note: null, isOptional: false },
            { name: 'Pfeffer', quantity: 1, unit: 'tsp', note: null, isOptional: false },
        ],
        instructions: [
            { step: 1, description: 'Zwiebeln und Knoblauch schälen und fein hacken.', duration: 5, imageUrl: null },
            { step: 2, description: 'Olivenöl erhitzen und das Hackfleisch darin krümelig braten.', duration: 10, imageUrl: null },
            { step: 3, description: 'Zwiebeln und Knoblauch dazugeben, mit passierten Tomaten ablöschen und 25 Minuten köcheln lassen.', duration: 25, imageUrl: null },
            { step: 4, description: 'Spaghetti nach Packungsangabe kochen, mit der Sauce vermengen und abschmecken.', duration: 12, imageUrl: null },
        ],
    },
    {
        title: 'Cremige Tomatensuppe',
        description: 'Schnelle Tomatensuppe mit Sahne und frischem Knoblauch.',
        category: 'Vorspeise',
        cuisine: 'Italienisch',
        difficulty: 'easy',
        prepTime: 10,
        cookTime: 25,
        restTime: null,
        servings: 4,
        servingUnit: 'Portion',
        tags: ['Suppe', 'Vegetarisch', 'Schnell'],
        ingredients: [
            { name: 'Tomaten', quantity: 800, unit: 'g', note: 'reif', isOptional: false },
            { name: 'Zwiebeln', quantity: 1, unit: 'piece', note: null, isOptional: false },
            { name: 'Knoblauch', quantity: 2, unit: 'piece', note: null, isOptional: false },
            { name: 'Gemüsebrühe', quantity: 500, unit: 'ml', note: null, isOptional: false },
            { name: 'Sahne', quantity: 200, unit: 'ml', note: null, isOptional: false },
            { name: 'Olivenöl', quantity: 2, unit: 'tbsp', note: null, isOptional: false },
            { name: 'Salz', quantity: 1, unit: 'tsp', note: null, isOptional: false },
            { name: 'Pfeffer', quantity: 1, unit: 'tsp', note: null, isOptional: false },
        ],
        instructions: [
            { step: 1, description: 'Zwiebeln und Knoblauch hacken und im Olivenöl glasig dünsten.', duration: 5, imageUrl: null },
            { step: 2, description: 'Tomaten würfeln, dazugeben und mit Gemüsebrühe 15 Minuten köcheln lassen.', duration: 15, imageUrl: null },
            { step: 3, description: 'Suppe pürieren, Sahne einrühren und mit Salz und Pfeffer abschmecken.', duration: 5, imageUrl: null },
        ],
    },
    {
        title: 'Kartoffelsalat mit Gurke',
        description: 'Warmer Kartoffelsalat mit Gurke und einer leichten Essig-Öl-Marinade.',
        category: 'Beilage',
        cuisine: 'Deutsch',
        difficulty: 'easy',
        prepTime: 20,
        cookTime: 25,
        restTime: 60,
        servings: 4,
        servingUnit: 'Portion',
        tags: ['Salat', 'Beilage', 'Party'],
        ingredients: [
            { name: 'Kartoffeln', quantity: 1, unit: 'kg', note: 'festkochend', isOptional: false },
            { name: 'Zwiebeln', quantity: 1, unit: 'piece', note: 'fein gewürfelt', isOptional: false },
            { name: 'Gurke', quantity: 1, unit: 'piece', note: null, isOptional: false },
            { name: 'Essig', quantity: 3, unit: 'tbsp', note: null, isOptional: false },
            { name: 'Öl', quantity: 4, unit: 'tbsp', note: null, isOptional: false },
            { name: 'Senf', quantity: 1, unit: 'tsp', note: null, isOptional: false },
            { name: 'Salz', quantity: 1, unit: 'tsp', note: null, isOptional: false },
            { name: 'Pfeffer', quantity: 1, unit: 'tsp', note: null, isOptional: false },
        ],
        instructions: [
            { step: 1, description: 'Kartoffeln in Salzwasser garen, abgießen und etwas abkühlen lassen.', duration: 25, imageUrl: null },
            { step: 2, description: 'Gurke in dünne Scheiben schneiden und mit Zwiebeln mischen.', duration: 10, imageUrl: null },
            { step: 3, description: 'Essig, Öl, Senf, Salz und Pfeffer verrühren, alles vermengen und 1 Stunde ziehen lassen.', duration: 60, imageUrl: null },
        ],
    },
    {
        title: 'Hähnchen-Curry mit Reis',
        description: 'Mildes Curry mit Hähnchenbrust, Kokosmilch und duftendem Basmatireis.',
        category: 'Hauptgericht',
        cuisine: 'Indisch',
        difficulty: 'medium',
        prepTime: 15,
        cookTime: 30,
        restTime: null,
        servings: 4,
        servingUnit: 'Portion',
        tags: ['Curry', 'Reis', 'Hähnchen'],
        ingredients: [
            { name: 'Hähnchenbrust', quantity: 600, unit: 'g', note: 'in Streifen geschnitten', isOptional: false },
            { name: 'Reis', quantity: 300, unit: 'g', note: 'Basmati', isOptional: false },
            { name: 'Kokosmilch', quantity: 400, unit: 'ml', note: null, isOptional: false },
            { name: 'Zwiebeln', quantity: 1, unit: 'piece', note: null, isOptional: false },
            { name: 'Knoblauch', quantity: 2, unit: 'piece', note: null, isOptional: false },
            { name: 'Ingwer', quantity: 20, unit: 'g', note: 'frisch', isOptional: true },
            { name: 'Currypulver', quantity: 2, unit: 'tsp', note: null, isOptional: false },
            { name: 'Öl', quantity: 2, unit: 'tbsp', note: null, isOptional: false },
            { name: 'Salz', quantity: 1, unit: 'tsp', note: null, isOptional: false },
        ],
        instructions: [
            { step: 1, description: 'Reis nach Packungsangabe garen.', duration: 15, imageUrl: null },
            { step: 2, description: 'Zwiebeln, Knoblauch und Ingwer hacken und im Öl andünsten.', duration: 5, imageUrl: null },
            { step: 3, description: 'Hähnchen anbraten, Currypulver zugeben und mit Kokosmilch ablöschen.', duration: 15, imageUrl: null },
            { step: 4, description: 'Curry 10 Minuten köcheln lassen, abschmecken und mit dem Reis servieren.', duration: 10, imageUrl: null },
        ],
    },
    {
        title: 'Gemüsepfanne mit Reis',
        description: 'Bunte Gemüsepfanne mit Sojasauce, ideal für ein schnelles Abendessen.',
        category: 'Hauptgericht',
        cuisine: 'Asiatisch',
        difficulty: 'easy',
        prepTime: 15,
        cookTime: 20,
        restTime: null,
        servings: 2,
        servingUnit: 'Portion',
        tags: ['Vegetarisch', 'Vegan', 'Schnell'],
        ingredients: [
            { name: 'Reis', quantity: 200, unit: 'g', note: null, isOptional: false },
            { name: 'Paprika', quantity: 2, unit: 'piece', note: 'bunt', isOptional: false },
            { name: 'Zucchini', quantity: 1, unit: 'piece', note: null, isOptional: false },
            { name: 'Karotten', quantity: 2, unit: 'piece', note: null, isOptional: false },
            { name: 'Sojasauce', quantity: 3, unit: 'tbsp', note: null, isOptional: false },
            { name: 'Öl', quantity: 2, unit: 'tbsp', note: null, isOptional: false },
            { name: 'Knoblauch', quantity: 2, unit: 'piece', note: null, isOptional: false },
            { name: 'Salz', quantity: 1, unit: 'tsp', note: null, isOptional: false },
        ],
        instructions: [
            { step: 1, description: 'Reis garen und beiseitestellen.', duration: 15, imageUrl: null },
            { step: 2, description: 'Gemüse putzen und in mundgerechte Stücke schneiden.', duration: 10, imageUrl: null },
            { step: 3, description: 'Gemüse im heißen Öl anbraten, Knoblauch zugeben und mit Sojasauce ablöschen.', duration: 10, imageUrl: null },
            { step: 4, description: 'Reis unterheben, abschmecken und direkt servieren.', duration: 2, imageUrl: null },
        ],
    },
    {
        title: 'Pfannkuchen',
        description: 'Dünne, goldbraune Pfannkuchen mit Milch und Butter – ein Klassiker für die ganze Familie.',
        category: 'Frühstück',
        cuisine: 'Deutsch',
        difficulty: 'easy',
        prepTime: 10,
        cookTime: 20,
        restTime: 15,
        servings: 4,
        servingUnit: 'Portion',
        tags: ['Frühstück', 'Süß', 'Familie'],
        ingredients: [
            { name: 'Mehl', quantity: 250, unit: 'g', note: null, isOptional: false },
            { name: 'Milch', quantity: 500, unit: 'ml', note: null, isOptional: false },
            { name: 'Eier', quantity: 3, unit: 'piece', note: null, isOptional: false },
            { name: 'Zucker', quantity: 2, unit: 'tbsp', note: null, isOptional: false },
            { name: 'Salz', quantity: 1, unit: 'tsp', note: null, isOptional: false },
            { name: 'Butter', quantity: 2, unit: 'tbsp', note: 'zum Braten', isOptional: false },
        ],
        instructions: [
            { step: 1, description: 'Mehl, Milch, Eier, Zucker und Salz zu einem glatten Teig verrühren.', duration: 5, imageUrl: null },
            { step: 2, description: 'Teig 15 Minuten ruhen lassen.', duration: 15, imageUrl: null },
            { step: 3, description: 'Etwas Butter in einer Pfanne erhitzen und nacheinander dünne Pfannkuchen ausbacken.', duration: 20, imageUrl: null },
        ],
    },
    {
        title: 'Rührei mit Schnittlauch',
        description: 'Cremiges Rührei mit Butter und frischem Schnittlauch.',
        category: 'Frühstück',
        cuisine: 'Deutsch',
        difficulty: 'easy',
        prepTime: 5,
        cookTime: 10,
        restTime: null,
        servings: 2,
        servingUnit: 'Portion',
        tags: ['Frühstück', 'Schnell', 'Vegetarisch'],
        ingredients: [
            { name: 'Eier', quantity: 4, unit: 'piece', note: null, isOptional: false },
            { name: 'Butter', quantity: 1, unit: 'tbsp', note: null, isOptional: false },
            { name: 'Milch', quantity: 50, unit: 'ml', note: null, isOptional: false },
            { name: 'Schnittlauch', quantity: 1, unit: 'tbsp', note: 'gehackt', isOptional: true },
            { name: 'Salz', quantity: 1, unit: 'tsp', note: null, isOptional: false },
            { name: 'Pfeffer', quantity: 1, unit: 'tsp', note: null, isOptional: false },
        ],
        instructions: [
            { step: 1, description: 'Eier mit Milch, Salz und Pfeffer verquirlen.', duration: 2, imageUrl: null },
            { step: 2, description: 'Butter in einer Pfanne schmelzen und die Eiermasse bei niedriger Hitze stocken lassen.', duration: 8, imageUrl: null },
            { step: 3, description: 'Rührei mit Schnittlauch bestreuen und servieren.', duration: 1, imageUrl: null },
        ],
    },
    {
        title: 'Ofengemüse mit Kartoffeln',
        description: 'Knuspriges Ofengemüse mit Rosmarin – einfach auf dem Blech zubereitet.',
        category: 'Hauptgericht',
        cuisine: 'Mediterran',
        difficulty: 'easy',
        prepTime: 20,
        cookTime: 40,
        restTime: null,
        servings: 3,
        servingUnit: 'Portion',
        tags: ['Vegan', 'Vegetarisch', 'Ofen'],
        ingredients: [
            { name: 'Kartoffeln', quantity: 800, unit: 'g', note: null, isOptional: false },
            { name: 'Karotten', quantity: 3, unit: 'piece', note: null, isOptional: false },
            { name: 'Zucchini', quantity: 1, unit: 'piece', note: null, isOptional: false },
            { name: 'Paprika', quantity: 2, unit: 'piece', note: null, isOptional: false },
            { name: 'Olivenöl', quantity: 4, unit: 'tbsp', note: null, isOptional: false },
            { name: 'Rosmarin', quantity: 2, unit: 'tsp', note: 'gehackt', isOptional: true },
            { name: 'Salz', quantity: 1, unit: 'tsp', note: null, isOptional: false },
            { name: 'Pfeffer', quantity: 1, unit: 'tsp', note: null, isOptional: false },
        ],
        instructions: [
            { step: 1, description: 'Backofen auf 200 °C Ober-/Unterhitze vorheizen.', duration: 10, imageUrl: null },
            { step: 2, description: 'Kartoffeln und Gemüse waschen, schneiden und mit Öl, Salz, Pfeffer und Rosmarin mischen.', duration: 15, imageUrl: null },
            { step: 3, description: 'Alles auf einem Backblech verteilen und 40 Minuten goldbraun backen.', duration: 40, imageUrl: null },
        ],
    },
    {
        title: 'Linsensuppe',
        description: 'Herzhafte Linsensuppe mit Wurzelgemüse und einem Spritzer Essig.',
        category: 'Suppe',
        cuisine: 'Deutsch',
        difficulty: 'medium',
        prepTime: 15,
        cookTime: 45,
        restTime: null,
        servings: 4,
        servingUnit: 'Portion',
        tags: ['Suppe', 'Herbst', 'Vegetarisch'],
        ingredients: [
            { name: 'Linsen', quantity: 250, unit: 'g', note: 'getrocknet', isOptional: false },
            { name: 'Kartoffeln', quantity: 300, unit: 'g', note: null, isOptional: false },
            { name: 'Karotten', quantity: 2, unit: 'piece', note: null, isOptional: false },
            { name: 'Zwiebeln', quantity: 1, unit: 'piece', note: null, isOptional: false },
            { name: 'Sellerie', quantity: 100, unit: 'g', note: null, isOptional: true },
            { name: 'Gemüsebrühe', quantity: 1, unit: 'l', note: null, isOptional: false },
            { name: 'Essig', quantity: 2, unit: 'tbsp', note: null, isOptional: false },
            { name: 'Salz', quantity: 1, unit: 'tsp', note: null, isOptional: false },
            { name: 'Pfeffer', quantity: 1, unit: 'tsp', note: null, isOptional: false },
        ],
        instructions: [
            { step: 1, description: 'Linsen abspülen, Gemüse und Kartoffeln klein würfeln.', duration: 10, imageUrl: null },
            { step: 2, description: 'Zwiebeln andünsten, Gemüse kurz mitbraten und mit Gemüsebrühe auffüllen.', duration: 10, imageUrl: null },
            { step: 3, description: 'Linsen und Kartoffeln zugeben und 35 Minuten köcheln lassen.', duration: 35, imageUrl: null },
            { step: 4, description: 'Mit Essig, Salz und Pfeffer abschmecken.', duration: 2, imageUrl: null },
        ],
    },
    {
        title: 'Milchreis mit Zimt',
        description: 'Cremiger Milchreis mit einer Prise Salz und Zimt.',
        category: 'Dessert',
        cuisine: 'Deutsch',
        difficulty: 'easy',
        prepTime: 5,
        cookTime: 35,
        restTime: 10,
        servings: 4,
        servingUnit: 'Portion',
        tags: ['Dessert', 'Süß', 'Reis'],
        ingredients: [
            { name: 'Milchreis', quantity: 250, unit: 'g', note: null, isOptional: false },
            { name: 'Milch', quantity: 1, unit: 'l', note: null, isOptional: false },
            { name: 'Zucker', quantity: 4, unit: 'tbsp', note: null, isOptional: false },
            { name: 'Salz', quantity: 1, unit: 'tsp', note: null, isOptional: false },
            { name: 'Butter', quantity: 1, unit: 'tbsp', note: null, isOptional: false },
            { name: 'Zimt', quantity: 1, unit: 'tsp', note: 'zum Servieren', isOptional: true },
        ],
        instructions: [
            { step: 1, description: 'Milch mit Zucker und Salz aufkochen.', duration: 5, imageUrl: null },
            { step: 2, description: 'Milchreis einrühren und bei niedriger Hitze 30 Minuten quellen lassen, dabei regelmäßig umrühren.', duration: 30, imageUrl: null },
            { step: 3, description: 'Butter unterrühren, kurz ziehen lassen und mit Zimt bestreut servieren.', duration: 10, imageUrl: null },
        ],
    },
    {
        title: 'Bruschetta mit Tomaten',
        description: 'Geröstetes Baguette mit Tomaten, Knoblauch und Basilikum.',
        category: 'Vorspeise',
        cuisine: 'Italienisch',
        difficulty: 'easy',
        prepTime: 10,
        cookTime: 5,
        restTime: null,
        servings: 4,
        servingUnit: 'Portion',
        tags: ['Vorspeise', 'Vegetarisch', 'Schnell'],
        ingredients: [
            { name: 'Baguette', quantity: 1, unit: 'piece', note: null, isOptional: false },
            { name: 'Tomaten', quantity: 400, unit: 'g', note: 'reif', isOptional: false },
            { name: 'Knoblauch', quantity: 10, unit: 'g', note: null, isOptional: false },
            { name: 'Olivenöl', quantity: 30, unit: 'ml', note: null, isOptional: false },
            { name: 'Basilikum', quantity: 5, unit: 'g', note: 'frisch', isOptional: true },
            { name: 'Salz', quantity: 5, unit: 'g', note: null, isOptional: false },
            { name: 'Pfeffer', quantity: 2, unit: 'g', note: null, isOptional: false },
        ],
        instructions: [
            { step: 1, description: 'Baguette in Scheiben schneiden und kurz im Ofen oder in der Pfanne rösten.', duration: 5, imageUrl: null },
            { step: 2, description: 'Tomaten würfeln, mit Knoblauch, Olivenöl, Basilikum, Salz und Pfeffer mischen.', duration: 5, imageUrl: null },
            { step: 3, description: 'Tomatenmischung auf dem gerösteten Brot verteilen und servieren.', duration: 2, imageUrl: null },
        ],
    },
    {
        title: 'Familien-Rindergulasch',
        description: 'Privates Familienrezept: würziges Gulasch mit Rindfleisch und Kartoffeln.',
        category: 'Hauptgericht',
        cuisine: 'Deutsch',
        difficulty: 'medium',
        prepTime: 20,
        cookTime: 90,
        restTime: null,
        servings: 4,
        servingUnit: 'Portion',
        tags: ['Fleisch', 'Sonntag', 'Familie'],
        isPublic: false,
        ingredients: [
            { name: 'Rindfleisch', quantity: 800, unit: 'g', note: 'gulaschgeschnitten', isOptional: false },
            { name: 'Zwiebeln', quantity: 2, unit: 'piece', note: null, isOptional: false },
            { name: 'Karotten', quantity: 2, unit: 'piece', note: null, isOptional: false },
            { name: 'Kartoffeln', quantity: 500, unit: 'g', note: null, isOptional: false },
            { name: 'Tomatenmark', quantity: 2, unit: 'tbsp', note: null, isOptional: false },
            { name: 'Gemüsebrühe', quantity: 500, unit: 'ml', note: null, isOptional: false },
            { name: 'Öl', quantity: 3, unit: 'tbsp', note: null, isOptional: false },
            { name: 'Salz', quantity: 1, unit: 'tsp', note: null, isOptional: false },
            { name: 'Pfeffer', quantity: 1, unit: 'tsp', note: null, isOptional: false },
        ],
        instructions: [
            { step: 1, description: 'Fleisch trocken tupfen, Zwiebeln und Gemüse grob würfeln.', duration: 10, imageUrl: null },
            { step: 2, description: 'Fleisch im heißen Öl kräftig anbraten und herausnehmen.', duration: 8, imageUrl: null },
            { step: 3, description: 'Zwiebeln und Gemüse anbraten, Tomatenmark zugeben und mit Brühe ablöschen.', duration: 5, imageUrl: null },
            { step: 4, description: 'Fleisch zurückgeben, abdecken und 90 Minuten schmoren lassen.', duration: 90, imageUrl: null },
        ],
    },
];

const dryRun = process.argv.includes('--dry-run');

async function main(): Promise<void> {
    if (config.env === 'production') {
        throw new Error('Testrezepte werden nicht in Produktion (NODE_ENV=production) angelegt.');
    }

    console.log(`Ziel-Datenbank: ${config.mongoUri}/${config.dbName}`);

    await db.connect();

    try {
        const database = db.getDb();

        const user = await database.collection('users').findOne({ name: TEST_USER_NAME });

        if (!user) {
            console.error(
                `Testnutzer "${TEST_USER_NAME}" nicht gefunden. ` +
                'Führe zuerst "npm run seed:test-user" aus.',
            );
            process.exitCode = 1;

            return;
        }

        const foodCount = await database.collection('foods').countDocuments();

        if (foodCount === 0) {
            console.warn(
                'Die foods-Collection ist leer. Die Rezepte werden angelegt, ' +
                'aber ohne Nährwerte bleiben. Führe ggf. "npm run seed:foods" aus.',
            );
        }

        const recipesCollection = database.collection('recipes');
        const now = new Date();

        let created = 0;
        let updated = 0;
        const withoutNutrition: string[] = [];

        for (const input of TEST_RECIPES) {
            const nutrition = await calculateNutrition({
                ingredients: input.ingredients,
                servings: input.servings,
            });

            if (nutrition === null) {
                withoutNutrition.push(input.title);
            }

            const isPublic = input.isPublic !== false;

            const recipe: NewRecipe = {
                title: input.title,
                description: input.description ?? null,
                imageUrl: input.imageUrl ?? null,
                category: input.category ?? null,
                cuisine: input.cuisine ?? null,
                difficulty: input.difficulty ?? null,
                prepTime: input.prepTime,
                cookTime: input.cookTime,
                restTime: input.restTime ?? null,
                servings: input.servings,
                servingUnit: input.servingUnit ?? null,
                tags: input.tags ?? [],
                ingredients: input.ingredients,
                instructions: input.instructions,
                nutrition,
                createdAt: now,
                updatedAt: now,
                createdBy: user._id,
                isPublic,
                status: isPublic ? 'public' : 'private',
            };

            const { createdAt: _createdAt, ...rest } = recipe;

            if (dryRun) {
                console.log(`Dry-Run: "${recipe.title}" (${recipe.status})`);

                continue;
            }

            const result = await recipesCollection.updateOne(
                { title: recipe.title, createdBy: user._id },
                {
                    $set: { ...rest, updatedAt: now },
                    $setOnInsert: { createdAt: now },
                },
                { upsert: true },
            );

            if (result.upsertedCount > 0) {
                created += 1;
                console.log(`Angelegt: "${recipe.title}"`);
            }
            else {
                updated += 1;
                console.log(`Aktualisiert: "${recipe.title}"`);
            }
        }

        if (dryRun) {
            console.log(
                `Dry-Run beendet: ${TEST_RECIPES.length} Rezepte geprüft. Es wurde nichts geschrieben.`,
            );
        }
        else {
            console.log(
                `Fertig: ${created} Rezepte angelegt, ${updated} aktualisiert.`,
            );
        }

        if (withoutNutrition.length > 0) {
            console.log(
                `Ohne Nährwerte (${withoutNutrition.length}): ${withoutNutrition.join(', ')}`,
            );
        }
    }
    finally {
        await db._client()?.close();
    }
}

main().catch((err: unknown) => {
    console.error('Seeding der Testrezepte fehlgeschlagen:', err);
    process.exitCode = 1;
});
