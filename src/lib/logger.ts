import pino, { type Logger } from 'pino';

function createLogger(): Logger {
  const level = process.env.LOG_LEVEL ?? 'info';

  if (process.env.NODE_ENV === 'development') {
    return pino({
      level,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname'
        }
      }
    });
  }

  return pino({
    level
  });
}

export const logger = createLogger();
