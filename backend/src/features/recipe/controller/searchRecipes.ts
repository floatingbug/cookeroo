import catchAsync from '../../../utils/catchAsync.js';
import services from '../services/index.js';

function tagsOf(value: unknown): string[] {
    if (Array.isArray(value)) {
        return value.filter((tag): tag is string => typeof tag === 'string');
    }

    return typeof value === 'string' ? [value] : [];
}

export default catchAsync(async (req, res) => {
    const rawOffset = req.query.offset;
    const offset = typeof rawOffset === 'string' ? Number.parseInt(rawOffset, 10) : 0;

    const result = await services.searchRecipes({
        userId: req.user!.id,
        query: typeof req.query.q === 'string' ? req.query.q : '',
        tags: tagsOf(req.query.tags),
        offset: Number.isInteger(offset) && offset >= 0 ? offset : 0,
    });

    res.json(result);
});
