import { createClient } from '@clickhouse/client';
import logger from '../utils/logger';

// ClickHouse client configuration
const clickhouseHost = process.env.CLICKHOUSE_HOST || 'localhost';
const clickhousePort = process.env.CLICKHOUSE_PORT || '8123';
const clickhouseUrl = `http://${clickhouseHost}:${clickhousePort}`;

const clickhouseClient = createClient({
  host: clickhouseUrl,
  database: process.env.CLICKHOUSE_DATABASE || 'default',
  username: process.env.CLICKHOUSE_USERNAME || 'default',
  password: process.env.CLICKHOUSE_PASSWORD || '',
});

// Connection test (non-blocking with timeout)
const testClickHouseConnection = async () => {
  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Connection timeout')), 5000)
    );
    await Promise.race([clickhouseClient.ping(), timeoutPromise]);
    logger.info(`✅ ClickHouse connected successfully at ${process.env.CLICKHOUSE_HOST}:${process.env.CLICKHOUSE_PORT}`);
  } catch (error: any) {
    logger.warn(`⚠️ ClickHouse connection warning (non-critical): ${error.message}`);
  }
};

// Run connection test asynchronously without blocking startup
testClickHouseConnection();

// Graceful shutdown
process.on('beforeExit', async () => {
  try {
    await clickhouseClient.close();
    logger.info('ClickHouse disconnected');
  } catch (error) {
    logger.error('Error closing ClickHouse connection:', error);
  }
});

export default clickhouseClient;
