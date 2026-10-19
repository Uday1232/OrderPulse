import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const createPrismaClient = () =>
  new PrismaClient({
    log: [
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'warn' },
    ],
  });

type AppPrismaClient = ReturnType<typeof createPrismaClient>;

declare global {
  // eslint-disable-next-line no-var
  var __prisma: AppPrismaClient | undefined;
}

export const prisma = global.__prisma ?? createPrismaClient();

prisma.$on('error', (e) => {
  logger.error('Prisma Error:', e);
});

prisma.$on('warn', (e) => {
  logger.warn('Prisma Warning:', e);
});

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}
