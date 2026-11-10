import openFoodFacts from '../../../utils/openFoodFacts.js';
import type { OffSearchResult } from '../../../utils/openFoodFacts.js';

interface SearchProductsInput {
    searchTerms: string;
    page: number;
    pageSize: number;
}

export default async ({ searchTerms, page, pageSize }: SearchProductsInput): Promise<OffSearchResult> => {
    return openFoodFacts.searchProducts({ searchTerms, page, pageSize });
};
