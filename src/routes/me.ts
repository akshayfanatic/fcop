import { Router } from 'express';
import { meController } from '../controllers/me.controller.js';
import { requireAuth } from '../middleware/require-auth.js';

export const meRouter = Router();

meRouter.get('/', requireAuth(), meController.getMe);
