import { Router } from 'express';
import { siteSettingController } from '../controllers/site-setting.controller.js';
import { requireOrgPermission } from '../middleware/require-org-permission.js';

export const siteSettingRouter = Router();

siteSettingRouter.get('/', siteSettingController.getSiteSetting);
siteSettingRouter.put('/', requireOrgPermission({ siteSetting: ['update'] }), siteSettingController.updateSiteSetting);
