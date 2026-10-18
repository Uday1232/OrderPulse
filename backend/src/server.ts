import http from 'http';
import app from './app';
import { env } from './config/env';
import { prisma } from './config/db';
import { redis } from './config/redis';
import { initializeSocketServer } from './socket/socket.server';
import { logger } from './utils/logger';

const server = http.createServer(app);

// Initialize Socket.IO
const allowedOrigins = env.CORS_ORIGIN.split(',').map((origin) => origin.trim());
initializeSocketServer(server, allowedOrigins);

async function startServer(): Promise<void> {
  try {
    // 1. Connect Redis (if not yet connected)
    try {
      await redis.connect();
      logger.info('Connected to Redis');
    } catch (redisErr) {
      logger.warn('Initial Redis connection warning (will auto-retry):', {
        error: redisErr instanceof Error ? redisErr.message : String(redisErr),
      });
    }

    // 2. Connect and verify Prisma database
    await prisma.$connect();
    logger.info('Connected to PostgreSQL Database via Prisma');

    // 3. Start HTTP server
    server.listen(env.PORT, () => {
      logger.info(`Restaurant Order Management System API running on port ${env.PORT}`);
      logger.info(`Environment: ${env.NODE_ENV}`);
      logger.info(`Health check available at http://localhost:${env.PORT}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown handling
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);

  server.close(async () => {
    logger.info('HTTP server closed.');

    try {
      await prisma.$disconnect();
      logger.info('Prisma disconnected.');
    } catch (err) {
      logger.error('Error disconnecting Prisma:', err);
    }

    try {
      redis.disconnect();
      logger.info('Redis disconnected.');
    } catch (err) {
      logger.error('Error disconnecting Redis:', err);
    }

    process.exit(0);
  });

  // Force close after 10s if graceful shutdown hangs
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();
