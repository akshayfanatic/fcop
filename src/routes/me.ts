import { Router } from 'express';
import { meController } from '../controllers/me.controller.js';
import { parseAvatarUpload } from '../middleware/avatar-upload.js';
import { requireAuth } from '../middleware/require-auth.js';

export const meRouter = Router();

meRouter.get('/', requireAuth(), meController.getMe);
meRouter.put('/avatar', requireAuth(), parseAvatarUpload, meController.updateAvatar);
meRouter.delete('/avatar', requireAuth(), meController.deleteAvatar);
