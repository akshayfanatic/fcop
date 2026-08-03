import { Router } from 'express';
import { authRouter } from './auth.js';
import { docsRouter } from './docs.js';
import { healthRouter } from './health.js';
import { invitationRouter } from './invitations.js';
import { leadRouter } from './leads.js';
import { meRouter } from './me.js';
import { openApiRouter } from './openapi.js';
import { projectRouter } from './projects.js';
import { serviceRequestRouter } from './service-requests.js';
import { taskRouter } from './tasks.js';
import { dashboardRouter } from './dashboard.js';

export const apiRouter = Router();

apiRouter.use('/api/health', healthRouter); // Backend health check.
apiRouter.use('/api/docs', docsRouter); // Interactive Swagger documentation.
apiRouter.use('/api/openapi.json', openApiRouter); // Raw OpenAPI contract.
apiRouter.use('/api/v1/auth', authRouter); // Authentication helper flows.
apiRouter.use('/api/v1/invitations', invitationRouter); // Organization invitation management.
apiRouter.use('/api/v1/leads', leadRouter); // Prospective client lead management.
apiRouter.use('/api/v1/me', meRouter); // Current member access context.
apiRouter.use('/api/v1/projects', projectRouter); // Project delivery management.
apiRouter.use('/api/v1/service-requests', serviceRequestRouter); // Service requests and consultation messages.
apiRouter.use('/api/v1/tasks', taskRouter); // Task detail update and delete routes.
apiRouter.use('/api/v1/dashboard', dashboardRouter);
