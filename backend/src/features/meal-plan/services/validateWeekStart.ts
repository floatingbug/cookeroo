import { AppError } from '../../../types/errors.js';

const WEEK_START_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validates the ISO date in the path and ensures it is a Monday. Using UTC
 * keeps the result independent from the server timezone.
 */
export default (weekStart: string): void => {
    if (!WEEK_START_PATTERN.test(weekStart)) {
        throw new AppError(400, 'weekStart must use the format YYYY-MM-DD.');
    }

    const date = new Date(`${weekStart}T00:00:00.000Z`);

    if (
        Number.isNaN(date.getTime())
        || date.toISOString().slice(0, 10) !== weekStart
        || date.getUTCDay() !== 1
    ) {
        throw new AppError(400, 'weekStart must be a valid Monday.');
    }
};
