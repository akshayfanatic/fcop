import { Router } from 'express';
import { serviceRequestController } from '../controllers/service-request.controller.js';
import { requireAuth } from '../middleware/require-auth.js';
import { requireOrgPermission } from '../middleware/require-org-permission.js';

export const serviceRequestRouter = Router();

serviceRequestRouter.post('/', requireAuth(), serviceRequestController.createServiceRequest);

serviceRequestRouter.get(
  '/',
  requireOrgPermission({ serviceRequest: ['read'] }),
  serviceRequestController.getServiceRequests
);
serviceRequestRouter.get(
  '/:id',
  requireOrgPermission({ serviceRequest: ['read'] }),
  serviceRequestController.getServiceRequestById
);
serviceRequestRouter.put(
  '/:id',
  requireOrgPermission({ serviceRequest: ['update'] }),
  serviceRequestController.updateServiceRequestById
);
serviceRequestRouter.delete(
  '/:id',
  requireOrgPermission({ serviceRequest: ['delete'] }),
  serviceRequestController.deleteServiceRequestById
);
