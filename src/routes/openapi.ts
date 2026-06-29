import { Router } from 'express';
import { env } from '../config/env.js';
import { createOpenApiDocument } from '../openapi/spec.js';

export const openApiRouter = Router();

openApiRouter.get('/', (_req, res) => {
  res.json(createOpenApiDocument(env.betterAuthUrl));
});
