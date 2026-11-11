import type { Request } from 'express';
import catchAsync from '../../../utils/catchAsync.js';
import { AppError } from '../../../types/errors.js';
import services from '../services/index.js';

type UploadRequest = Request & { files?: Express.Multer.File[] };

export default catchAsync(async (req, res) => {
    const files = (req as UploadRequest).files;
    const file = files?.find((candidate) => candidate.fieldname === 'file');

    if (!file) {
        throw new AppError(400, 'Image file is required.');
    }

    const image = await services.saveImage({
        buffer: file.buffer,
        mimetype: file.mimetype,
    });

    res.status(201).json(image);
});
