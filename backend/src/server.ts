import 'dotenv/config';
import SatoshiQuestServer from './app';
import { logger } from '@/utils/logger';

/**
 * Satoshi Quest Backend Server Entry Point
 * 
 * Enterprise-grade backend service for handling:
 * - Real-time blockchain events via chainhooks
 * - WebSocket connections for multiplayer functionality
 * - RESTful API for game state management
 * - MongoDB integration for persistent data storage
 * - Redis caching for performance optimization
 */

async function bootstrap(): Promise<void> {
  try {
    logger.info('🎮 Starting Satoshi Quest Backend Server...');
    logger.info('⚡ Initializing enterprise-grade gaming infrastructure');
    
    const server = new SatoshiQuestServer();
    await server.start();
    
  } catch (error) {
    logger.error('💥 Failed to start server:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown, promise: Promise<any>) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start the server
bootstrap();
