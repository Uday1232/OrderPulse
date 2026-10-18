import { redis } from '../config/redis';
import { logger } from '../utils/logger';

export class RedisService {
  /**
   * Retrieve cached data by key
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      if (redis.status !== 'ready') return null;
      const data = await redis.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error) {
      logger.warn(`Redis GET failed for key "${key}":`, {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Set cached data with a TTL in seconds
   */
  static async set(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
    try {
      if (redis.status !== 'ready') return;
      const serialized = JSON.stringify(value);
      await redis.set(key, serialized, 'EX', ttlSeconds);
    } catch (error) {
      logger.warn(`Redis SET failed for key "${key}":`, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Delete a specific cache key
   */
  static async del(key: string): Promise<void> {
    try {
      if (redis.status !== 'ready') return;
      await redis.del(key);
    } catch (error) {
      logger.warn(`Redis DEL failed for key "${key}":`, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Invalidate multiple keys matching a pattern safely using SCAN
   */
  static async invalidatePattern(pattern: string): Promise<void> {
    try {
      if (redis.status !== 'ready') return;
      const stream = redis.scanStream({
        match: pattern,
        count: 100,
      });

      stream.on('data', async (keys: string[]) => {
        if (keys.length > 0) {
          const pipeline = redis.pipeline();
          keys.forEach((k) => pipeline.del(k));
          await pipeline.exec();
        }
      });

      stream.on('error', (err) => {
        logger.error(`Redis SCAN stream error for pattern "${pattern}":`, {
          error: err.message,
        });
      });
    } catch (error) {
      logger.warn(`Redis invalidatePattern failed for pattern "${pattern}":`, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
