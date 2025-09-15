import mongoose from 'mongoose';
import { config } from './environment';
import { logger } from '@/utils/logger';

interface DatabaseConnection {
  isConnected: boolean;
  connection?: typeof mongoose;
}

const database: DatabaseConnection = {
  isConnected: false,
};

/**
 * Connect to MongoDB database
 * Implements connection pooling, retry logic, and proper error handling
 */
export async function connectDatabase(): Promise<void> {
  if (database.isConnected) {
    logger.info('📦 Using existing database connection');
    return;
  }

  try {
    const mongoUri = config.nodeEnv === 'test' ? config.database.testUri : config.database.uri;
    
    logger.info(`🔌 Connecting to MongoDB: ${mongoUri.replace(/\/\/.*@/, '//***:***@')}`);

    const connection = await mongoose.connect(mongoUri, {
      maxPoolSize: config.database.maxConnections,
      serverSelectionTimeoutMS: config.database.timeout,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      retryWrites: true,
      retryReads: true,
    });

    database.connection = connection;
    database.isConnected = true;

    logger.info('✅ MongoDB connected successfully');

    // Connection event listeners
    mongoose.connection.on('connected', () => {
      logger.info('📦 MongoDB connection established');
    });

    mongoose.connection.on('error', (error) => {
      logger.error('❌ MongoDB connection error:', error);
      database.isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️  MongoDB disconnected');
      database.isConnected = false;
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        logger.info('📦 MongoDB connection closed through app termination');
        process.exit(0);
      } catch (error) {
        logger.error('Error closing MongoDB connection:', error);
        process.exit(1);
      }
    });

  } catch (error) {
    logger.error('💥 Failed to connect to MongoDB:', error);
    database.isConnected = false;
    throw error;
  }
}

/**
 * Disconnect from MongoDB database
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    if (database.isConnected && database.connection) {
      await mongoose.connection.close();
      database.isConnected = false;
      logger.info('📦 MongoDB disconnected successfully');
    }
  } catch (error) {
    logger.error('Error disconnecting from MongoDB:', error);
    throw error;
  }
}

/**
 * Get database connection status
 */
export function getDatabaseStatus(): DatabaseConnection {
  return {
    isConnected: database.isConnected && mongoose.connection.readyState === 1,
    connection: database.connection,
  };
}

/**
 * Database health check
 */
export async function checkDatabaseHealth(): Promise<{ status: string; latency?: number }> {
  try {
    if (!database.isConnected) {
      return { status: 'disconnected' };
    }

    const startTime = Date.now();
    await mongoose.connection.db.admin().ping();
    const latency = Date.now() - startTime;

    return {
      status: 'connected',
      latency,
    };
  } catch (error) {
    logger.error('Database health check failed:', error);
    return { status: 'error' };
  }
}
