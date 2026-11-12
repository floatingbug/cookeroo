import catchAsync from '../../../utils/catchAsync.js';
import services from '../services/index.js';

export default catchAsync(async (req, res) => {
    const tags = await services.listRecipeTags({
        userId: req.user!.id,
    });

    res.json(tags);
});
