import catchAsync from '../../../utils/catchAsync.js';
import services from '../services/index.js';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 12;

export default catchAsync(async (req, res) => {
    const searchTerms = String(req.query.q);
    const page = req.query.page ? parseInt(String(req.query.page), 10) : DEFAULT_PAGE;
    const pageSize = req.query.pageSize ? parseInt(String(req.query.pageSize), 10) : DEFAULT_PAGE_SIZE;

    const result = await services.searchProducts({ searchTerms, page, pageSize });

    res.json(result);
});
