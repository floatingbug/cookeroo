import express from 'express';
import controller from './controller/index.js';
import authUser from '../../middlewares/authUser.js';
import { openApiMiddleware } from '../../middlewares/openapi.js';

const router = express.Router();

router.get('/shared', authUser, ...openApiMiddleware, controller.listSharedMealPlans);
router.post('/invites', authUser, ...openApiMiddleware, controller.createMealPlanInvite);
router.get('/invites/:token', ...openApiMiddleware, controller.previewMealPlanInvite);
router.post(
    '/invites/:token/accept',
    authUser,
    ...openApiMiddleware,
    controller.acceptMealPlanInvite,
);
router.get('/members', authUser, ...openApiMiddleware, controller.listMealPlanMembers);
router.patch(
    '/members/:memberId',
    authUser,
    ...openApiMiddleware,
    controller.updateMealPlanMember,
);
router.delete(
    '/members/:memberId',
    authUser,
    ...openApiMiddleware,
    controller.removeMealPlanMember,
);
router.get('/:weekStart', authUser, ...openApiMiddleware, controller.getMealPlan);
router.put('/:weekStart', authUser, ...openApiMiddleware, controller.saveMealPlan);

export default router;
