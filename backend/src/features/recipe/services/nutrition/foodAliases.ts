import { normalizeFoodName } from '../../../../utils/normalizeFoodName.js';

/**
 * Generische Zutatennamen haben in BLS viele ähnliche Varianten. Diese
 * Zuordnung liefert einen konkreten, vertretbaren Standardtreffer.
 */
const FOOD_ALIASES: Record<string, string> = {
    mehl: 'weizen mehl type 405',
    milch: 'vollmilch frisch 3 5 fett pasteurisiert',
    zucker: 'zucker weiss raffinadezucker weisszucker',
    butter: 'butter mild gesaeuert',
    salz: 'speisesalz siedesalz tafelsalz',
    zwiebel: 'speisezwiebel roh',
    zwiebeln: 'speisezwiebel roh',
    ei: 'huehnerei roh',
    eier: 'huehnerei roh',
    wasser: 'trinkwasser',
    tomate: 'tomate roh',
    tomaten: 'tomate roh',
    kartoffel: 'kartoffel geschaelt roh',
    kartoffeln: 'kartoffel geschaelt roh',
    reis: 'reis poliert roh',
    nudel: 'teigwaren eifrei roh',
    nudeln: 'teigwaren eifrei roh',
    spaghetti: 'teigwaren eifrei roh',
};

export function foodAliasFor(ingredientName: string): string | null {
    return FOOD_ALIASES[normalizeFoodName(ingredientName)] ?? null;
}
