import { Router } from 'express';
import { authRouter } from './auth.js';
import { docsRouter } from './docs.js';
import { healthRouter } from './health.js';
import { leadRouter } from './leads.js';
import { openApiRouter } from './openapi.js';

export const apiRouter = Router();

apiRouter.use('/api/health', healthRouter);
apiRouter.use('/api/docs', docsRouter); // SWAGGER DOCS
apiRouter.use('/api/openapi.json', openApiRouter); // OPENAPISPECS
apiRouter.use('/api/v1/auth', authRouter);
apiRouter.use('/api/v1/leads', leadRouter);
