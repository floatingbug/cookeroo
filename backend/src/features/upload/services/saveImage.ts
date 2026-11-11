import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import config from '../../../config/index.js';
import { AppError } from '../../../types/errors.js';

interface SaveImageParams {
    buffer: Buffer;
    mimetype: string;
}

export interface SavedImage {
    url: string;
}

export default async ({ buffer, mimetype }: SaveImageParams): Promise<SavedImage> => {
    const extension = config.uploadsConfig.extensionByMimeType[mimetype];

    if (!extension) {
        throw new AppError(400, 'Only JPEG, PNG and WebP images are allowed.');
    }

    const fileName = `${randomUUID()}.${extension}`;

    await mkdir(config.uploadsConfig.dir, { recursive: true });
    await writeFile(path.join(config.uploadsConfig.dir, fileName), buffer);

    return {
        url: `${config.uploadsConfig.publicBaseUrl}/uploads/${fileName}`,
    };
};
