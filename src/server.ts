import { createServer } from 'node:http';
import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { initializeChatServer } from './lib/chat/index.js';

const server = createServer(app);

initializeChatServer(server);

server.listen(env.port, () => {
  logger.info({ port: env.port }, `Server running on http://localhost:${env.port}`);
});
