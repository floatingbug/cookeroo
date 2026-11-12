/**
 * Vereinheitlicht Lebensmittelnamen für die Zuordnung von Rezeptzutaten zu
 * Foods. Umlaute werden ausgeschrieben, Akzente entfernt und Sonderzeichen zu
 * Leerzeichen zusammengefasst.
 */
export function normalizeFoodName(name: string): string {
    return name
        .toLowerCase()
        .replace(/ä/g, 'ae')
        .replace(/ö/g, 'oe')
        .replace(/ü/g, 'ue')
        .replace(/ß/g, 'ss')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}
