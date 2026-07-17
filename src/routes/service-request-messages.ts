import { Router } from 'express';
import { serviceRequestMessageController } from '../controllers/service-request-message.controller.js';
import { requireOrgPermission } from '../middleware/require-org-permission.js';

export const serviceRequestMessageRouter = Router({ mergeParams: true });

serviceRequestMessageRouter.post('/', requireOrgPermission({ serviceRequest: ['read'], serviceRequestMessage: ['create'] }), serviceRequestMessageController.createServiceRequestMessage);

serviceRequestMessageRouter.get('/', requireOrgPermission({ serviceRequest: ['read'], serviceRequestMessage: ['read'] }), serviceRequestMessageController.getServiceRequestMessages);
