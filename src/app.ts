import cors from 'cors';
import express from 'express';
import { toNodeHandler } from 'better-auth/node';
import { env } from './config/env.js';
import { auth } from './lib/auth/auth.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFoundHandler } from './middleware/not-found-handler.js';
import { requestLogger } from './middleware/request-logger.js';
import { apiRouter } from './routes/index.js';
import { stripeWebhookRouter } from './routes/stripe-webhooks.js';

export const app = express(); // intialized app

const authHandler = toNodeHandler(auth);

app.use(
  cors({
    origin: env.corsOrigins,
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['set-auth-token'],
    credentials: true
  })
);

app.use(requestLogger);

app.all('/api/auth/*', async (req, res) => {
  await authHandler(req, res);
});

// Mount Stripe webhooks before JSON parsing so signature verification receives the original request body.
app.use('/api/v1/stripe/webhooks', stripeWebhookRouter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);
