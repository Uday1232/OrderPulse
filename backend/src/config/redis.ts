import Redis from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logger';

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 200, 2000);
    logger.warn(`Redis connection retry attempt ${times} in ${delay}ms`);
    return delay;
  },
  reconnectOnError(err) {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      return true;
    }
    return false;
  },
  lazyConnect: true,
});

redis.on('connect', () => {
  logger.info('Connected to Redis server successfully');
});

redis.on('ready', () => {
  logger.info('Redis client is ready to accept commands');
});

redis.on('error', (err) => {
  logger.error('Redis client error:', { error: err.message });
});

redis.on('close', () => {
  logger.warn('Redis client connection closed');
});
