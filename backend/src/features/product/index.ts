import express from 'express';
import controller from './controller/index.js';
import authUser from '../../middlewares/authUser.js';
import { openApiMiddleware } from '../../middlewares/openapi.js';

const router = express.Router();

router.get('/search', authUser, ...openApiMiddleware, controller.searchProducts);

export default router;
