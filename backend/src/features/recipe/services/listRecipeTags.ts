import models from '../models/index.js';

interface ListRecipeTagsParams {
    userId: string;
}

export default ({ userId }: ListRecipeTagsParams): Promise<string[]> => {
    return models.findAvailableTags({ userId });
};
