import { createClient } from 'redis';
import logger from '../utils/logger';

const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
  password: process.env.REDIS_PASSWORD || undefined,
  database: parseInt(process.env.REDIS_DB || '0'),
});

redisClient.on('connect', () => {
  logger.info('✅ Redis connected successfully');
});

redisClient.on('error', (error) => {
  logger.error('❌ Redis connection error:', error);
});

redisClient.on('ready', () => {
  logger.info('Redis client ready');
});

// Connect to Redis
(async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
  }
})();

// Graceful shutdown
process.on('beforeExit', async () => {
  await redisClient.quit();
  logger.info('Redis disconnected');
});

export default redisClient;
