import path from 'node:path';

/**
 * Configuration for uploaded images.
 *
 * `publicBaseUrl` is used to build absolute image URLs for API responses.
 * In production this must point to the publicly reachable backend origin.
 */
const uploadsConfig = {
    dir: path.resolve(process.env.UPLOAD_DIR || 'uploads'),
    publicBaseUrl: (process.env.PUBLIC_BASE_URL || 'http://localhost:3000').replace(/\/+$/, ''),
    maxFileSizeBytes: parseInt(process.env.UPLOAD_MAX_FILE_SIZE ?? '', 10) || 5 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    extensionByMimeType: {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
    } as Record<string, string>,
};

export type UploadsConfig = typeof uploadsConfig;

export default uploadsConfig;
