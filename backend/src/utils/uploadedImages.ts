import { unlink } from 'node:fs/promises';
import path from 'node:path';
import config from '../config/index.js';

const UPLOAD_PATH_PREFIX = '/uploads/';
const FILE_NAME_PATTERN = /^[A-Za-z0-9_-]+\.(?:jpg|jpeg|png|webp)$/;

/**
 * Ermittelt den Dateinamen eines von uns ausgelieferten Upload-Bildes.
 * Liefert null für externe URLs und unsichere Pfade.
 */
export function getUploadFileName(url: string): string | null {
    let pathname: string;

    try {
        pathname = new URL(url).pathname;
    }
    catch {
        return null;
    }

    if (!pathname.startsWith(UPLOAD_PATH_PREFIX)) {
        return null;
    }

    const fileName = pathname.slice(UPLOAD_PATH_PREFIX.length);

    return FILE_NAME_PATTERN.test(fileName) ? fileName : null;
}

/**
 * Löscht eine Datei aus dem Upload-Verzeichnis. Fehlende Dateien werden
 * ignoriert, damit ein bereits aufgeräumter Upload keinen Fehler auslöst.
 */
export async function deleteUploadedFile(fileName: string): Promise<void> {
    if (!FILE_NAME_PATTERN.test(fileName)) {
        return;
    }

    try {
        await unlink(path.join(config.uploadsConfig.dir, fileName));
    }
    catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
            throw error;
        }
    }
}
