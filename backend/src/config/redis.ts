import { createClient, RedisClientType } from 'redis';
import { config } from './environment';
import { logger } from '@/utils/logger';

interface RedisConnection {
  client?: RedisClientType;
  isConnected: boolean;
}

const redis: RedisConnection = {
  isConnected: false,
};

/**
 * Connect to Redis for caching and session management
 * Implements connection retry logic and proper error handling
 */
export async function connectRedis(): Promise<void> {
  if (redis.isConnected && redis.client) {
    logger.info('🔄 Using existing Redis connection');
    return;
  }

  try {
    logger.info(`🔌 Connecting to Redis: ${config.redis.url}`);

    const client = createClient({
      url: config.redis.url,
      password: config.redis.password,
      database: config.redis.db,
      socket: {
        connectTimeout: 10000,
        commandTimeout: 5000,
        reconnectStrategy: (retries) => {
          if (retries > 5) {
            logger.error('❌ Redis max reconnection attempts reached');
            return false;
          }
          const delay = Math.min(retries * 50, 1000);
          logger.warn(`🔄 Redis reconnecting in ${delay}ms (attempt ${retries})`);
          return delay;
        },
      },
    });

    // Error handling
    client.on('error', (error) => {
      logger.error('❌ Redis connection error:', error);
      redis.isConnected = false;
    });

    client.on('connect', () => {
      logger.info('🔄 Redis connecting...');
    });

    client.on('ready', () => {
      logger.info('✅ Redis connected and ready');
      redis.isConnected = true;
    });

    client.on('reconnecting', () => {
      logger.warn('🔄 Redis reconnecting...');
      redis.isConnected = false;
    });

    client.on('end', () => {
      logger.warn('⚠️  Redis connection ended');
      redis.isConnected = false;
    });

    // Connect to Redis
    await client.connect();
    
    redis.client = client;
    redis.isConnected = true;

    logger.info('✅ Redis connected successfully');

    // Graceful shutdown
    process.on('SIGINT', async () => {
      try {
        if (redis.client && redis.isConnected) {
          await redis.client.quit();
          logger.info('🔄 Redis connection closed through app termination');
        }
      } catch (error) {
        logger.error('Error closing Redis connection:', error);
      }
    });

  } catch (error) {
    logger.error('💥 Failed to connect to Redis:', error);
    redis.isConnected = false;
    throw error;
  }
}

/**
 * Disconnect from Redis
 */
export async function disconnectRedis(): Promise<void> {
  try {
    if (redis.client && redis.isConnected) {
      await redis.client.quit();
      redis.isConnected = false;
      logger.info('🔄 Redis disconnected successfully');
    }
  } catch (error) {
    logger.error('Error disconnecting from Redis:', error);
    throw error;
  }
}

/**
 * Get Redis client instance
 */
export function getRedisClient(): RedisClientType | undefined {
  return redis.client;
}

/**
 * Get Redis connection status
 */
export function getRedisStatus(): RedisConnection {
  return {
    isConnected: redis.isConnected && redis.client?.isReady === true,
    client: redis.client,
  };
}

/**
 * Redis health check
 */
export async function checkRedisHealth(): Promise<{ status: string; latency?: number }> {
  try {
    if (!redis.client || !redis.isConnected) {
      return { status: 'disconnected' };
    }

    const startTime = Date.now();
    await redis.client.ping();
    const latency = Date.now() - startTime;

    return {
      status: 'connected',
      latency,
    };
  } catch (error) {
    logger.error('Redis health check failed:', error);
    return { status: 'error' };
  }
}

/**
 * Cache utility functions
 */
export const cache = {
  // Set cache value with TTL
  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    if (!redis.client || !redis.isConnected) {
      throw new Error('Redis client not connected');
    }

    const serializedValue = JSON.stringify(value);
    
    if (ttlSeconds) {
      await redis.client.setEx(key, ttlSeconds, serializedValue);
    } else {
      await redis.client.set(key, serializedValue);
    }
  },

  // Get cache value
  async get<T>(key: string): Promise<T | null> {
    if (!redis.client || !redis.isConnected) {
      throw new Error('Redis client not connected');
    }

    const value = await redis.client.get(key);
    
    if (value === null) {
      return null;
    }

    try {
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error(`Failed to parse cache value for key ${key}:`, error);
      return null;
    }
  },

  // Delete cache value
  async del(key: string): Promise<void> {
    if (!redis.client || !redis.isConnected) {
      throw new Error('Redis client not connected');
    }

    await redis.client.del(key);
  },

  // Check if key exists
  async exists(key: string): Promise<boolean> {
    if (!redis.client || !redis.isConnected) {
      throw new Error('Redis client not connected');
    }

    const result = await redis.client.exists(key);
    return result === 1;
  },

  // Set cache with pattern-based expiry
  async setWithPattern(pattern: string, key: string, value: any, ttlSeconds: number): Promise<void> {
    const fullKey = `${pattern}:${key}`;
    await this.set(fullKey, value, ttlSeconds);
  },

  // Get cache with pattern
  async getWithPattern<T>(pattern: string, key: string): Promise<T | null> {
    const fullKey = `${pattern}:${key}`;
    return this.get<T>(fullKey);
  },

  // Delete all keys matching pattern
  async delPattern(pattern: string): Promise<void> {
    if (!redis.client || !redis.isConnected) {
      throw new Error('Redis client not connected');
    }

    const keys = await redis.client.keys(`${pattern}:*`);
    if (keys.length > 0) {
      await redis.client.del(keys);
    }
  },
};
