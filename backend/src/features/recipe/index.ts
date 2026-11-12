import express from 'express';
import controller from './controller/index.js';
import authUser from '../../middlewares/authUser.js';
import { openApiMiddleware } from '../../middlewares/openapi.js';

const router = express.Router();

router.post('/', authUser, ...openApiMiddleware, controller.createRecipe);
router.get('/', authUser, ...openApiMiddleware, controller.listRecipes);
router.get('/:recipeId', authUser, ...openApiMiddleware, controller.getRecipe);
router.delete('/:recipeId', authUser, ...openApiMiddleware, controller.deleteRecipe);

export default router;
