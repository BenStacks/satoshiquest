import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

import { config } from '@/config/environment';
import { connectDatabase } from '@/config/database';
import { connectRedis } from '@/config/redis';
import { setupSwagger } from '@/config/swagger';
import { logger } from '@/utils/logger';
import { errorHandler } from '@/middleware/errorHandler';
import { requestLogger } from '@/middleware/requestLogger';
import { validateRequest } from '@/middleware/validation';

// Route imports
import healthRoutes from '@/routes/health.routes';
import gameRoutes from '@/routes/game.routes';
import playerRoutes from '@/routes/player.routes';
import tombstoneRoutes from '@/routes/tombstone.routes';
import leaderboardRoutes from '@/routes/leaderboard.routes';
import adminRoutes from '@/routes/admin.routes';

// Service imports
import { ChainhookService } from '@/services/chainhook.service';
import { WebSocketService } from '@/services/websocket.service';
import { GameStateService } from '@/services/gameState.service';

class SatoshiQuestServer {
  public app: express.Application;
  public server: any;
  public io: SocketIOServer;
  private chainhookService: ChainhookService;
  private websocketService: WebSocketService;
  private gameStateService: GameStateService;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: config.cors.origin.split(','),
        credentials: config.cors.credentials,
      },
      pingTimeout: config.websocket.pingTimeout,
      pingInterval: config.websocket.pingInterval,
    });

    this.initializeServices();
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeServices(): void {
    this.chainhookService = new ChainhookService();
    this.websocketService = new WebSocketService(this.io);
    this.gameStateService = new GameStateService();
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS configuration
    this.app.use(cors({
      origin: config.cors.origin.split(','),
      credentials: config.cors.credentials,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    }));

    // Compression and parsing
    this.app.use(compression());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.maxRequests,
      message: {
        error: 'Too many requests from this IP, please try again later.',
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use('/api/', limiter);

    // Logging
    if (config.nodeEnv !== 'test') {
      this.app.use(morgan('combined', {
        stream: {
          write: (message: string) => logger.info(message.trim()),
        },
      }));
    }
    this.app.use(requestLogger);

    // API Documentation (Swagger)
    if (config.apiDocs.enabled) {
      setupSwagger(this.app);
    }
  }

  private initializeRoutes(): void {
    // Health check (no /api prefix for load balancers)
    this.app.use('/health', healthRoutes);

    // API Routes with versioning
    const apiV1 = express.Router();
    
    apiV1.use('/game', gameRoutes);
    apiV1.use('/players', playerRoutes);
    apiV1.use('/tombstones', tombstoneRoutes);
    apiV1.use('/leaderboard', leaderboardRoutes);
    apiV1.use('/admin', adminRoutes);

    this.app.use('/api/v1', apiV1);

    // Webhook endpoints (no rate limiting)
    this.app.post('/webhooks/chainhook', 
      express.raw({ type: 'application/json' }),
      this.chainhookService.handleWebhook.bind(this.chainhookService)
    );

    // Catch all route
    this.app.all('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
        timestamp: new Date().toISOString(),
      });
    });
  }

  private initializeErrorHandling(): void {
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      // Connect to databases
      await connectDatabase();
      await connectRedis();

      // Initialize services
      await this.chainhookService.initialize();
      await this.websocketService.initialize();
      await this.gameStateService.initialize();

      // Start server
      this.server.listen(config.port, () => {
        logger.info(`🚀 Satoshi Quest Backend Server running on port ${config.port}`);
        logger.info(`📚 API Documentation: http://localhost:${config.port}/api-docs`);
        logger.info(`🌐 Environment: ${config.nodeEnv}`);
        logger.info(`🔗 Database: ${config.database.uri}`);
        
        if (config.nodeEnv === 'development') {
          logger.info(`🔧 Debug mode: ${config.debug.enabled}`);
          logger.info(`🧪 Mock events: ${config.debug.mockEvents}`);
        }
      });

      // Graceful shutdown handling
      this.setupGracefulShutdown();

    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  private setupGracefulShutdown(): void {
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);
      
      try {
        // Close server connections
        this.server.close(() => {
          logger.info('HTTP server closed');
        });

        // Close WebSocket connections
        this.io.close(() => {
          logger.info('WebSocket server closed');
        });

        // Close database connections
        // MongoDB and Redis connections will be closed by their respective modules

        logger.info('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('Error during graceful shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  }
}

export default SatoshiQuestServer;
