import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import { config } from './environment';

/**
 * Swagger API Documentation Configuration
 * Professional OpenAPI 3.0 specification for all endpoints
 */

const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Satoshi Quest Backend API',
      version: '1.0.0',
      description: `
        Enterprise-grade backend API for Satoshi's Quest - A blockchain-based RPG game on Stacks.
        
        ## Features
        - Real-time blockchain event processing via chainhooks
        - WebSocket support for multiplayer functionality
        - Comprehensive game state management
        - MongoDB integration for persistent data
        - Redis caching for optimal performance
        - JWT authentication and authorization
        - Rate limiting and security middleware
        
        ## Authentication
        Most endpoints require JWT authentication. Include the token in the Authorization header:
        \`Authorization: Bearer <your-jwt-token>\`
        
        ## Rate Limiting
        API requests are rate limited to prevent abuse. Check response headers for rate limit status.
        
        ## WebSocket Events
        Connect to \`/socket.io\` for real-time game events and multiplayer functionality.
      `,
      contact: {
        name: 'Satoshi Quest Team',
        email: 'dev@satoshiquest.app',
        url: 'https://satoshiquest.app',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: config.nodeEnv === 'production' 
          ? 'https://api.satoshiquest.app' 
          : `http://localhost:${config.port}`,
        description: config.nodeEnv === 'production' ? 'Production server' : 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token for authentication',
        },
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API key for webhook endpoints',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          required: ['success', 'message', 'timestamp'],
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Error message description',
            },
            error: {
              type: 'string',
              example: 'VALIDATION_ERROR',
            },
            details: {
              type: 'object',
              description: 'Additional error details',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-01T00:00:00.000Z',
            },
          },
        },
        Success: {
          type: 'object',
          required: ['success', 'timestamp'],
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              description: 'Response data',
            },
            message: {
              type: 'string',
              example: 'Operation completed successfully',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-01T00:00:00.000Z',
            },
          },
        },
        Player: {
          type: 'object',
          required: ['id', 'address', 'createdAt'],
          properties: {
            id: {
              type: 'string',
              description: 'Player unique identifier',
              example: '507f1f77bcf86cd799439011',
            },
            address: {
              type: 'string',
              description: 'Stacks wallet address',
              example: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
            },
            username: {
              type: 'string',
              description: 'Player username',
              example: 'SatoshiWarrior',
            },
            totalScore: {
              type: 'number',
              description: 'Total accumulated score',
              example: 15000,
            },
            gamesPlayed: {
              type: 'number',
              description: 'Number of games played',
              example: 42,
            },
            achievements: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'List of achievement IDs',
              example: ['first_death', 'level_10', 'dragon_slayer'],
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-01T00:00:00.000Z',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-01T00:00:00.000Z',
            },
          },
        },
        Tombstone: {
          type: 'object',
          required: ['id', 'tokenId', 'owner', 'metadata'],
          properties: {
            id: {
              type: 'string',
              description: 'Database record ID',
              example: '507f1f77bcf86cd799439011',
            },
            tokenId: {
              type: 'number',
              description: 'NFT token ID on blockchain',
              example: 42,
            },
            owner: {
              type: 'string',
              description: 'Current owner address',
              example: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
            },
            metadata: {
              type: 'object',
              required: ['characterName', 'finalLevel', 'deathCause'],
              properties: {
                characterName: {
                  type: 'string',
                  example: 'SatoshiHero',
                },
                finalLevel: {
                  type: 'number',
                  example: 15,
                },
                finalScore: {
                  type: 'number',
                  example: 8000,
                },
                deepestFloor: {
                  type: 'number',
                  example: 8,
                },
                deathCause: {
                  type: 'string',
                  example: 'Dragon attack',
                },
                totalExperience: {
                  type: 'number',
                  example: 2000,
                },
                playTime: {
                  type: 'number',
                  description: 'Play time in seconds',
                  example: 7200,
                },
                burnedItemsCount: {
                  type: 'number',
                  example: 5,
                },
              },
            },
            txId: {
              type: 'string',
              description: 'Transaction ID of minting',
              example: '0x1234567890abcdef',
            },
            blockHeight: {
              type: 'number',
              description: 'Block height when minted',
              example: 150000,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-01T00:00:00.000Z',
            },
          },
        },
        GameStats: {
          type: 'object',
          properties: {
            totalTombstones: {
              type: 'number',
              description: 'Total tombstones minted',
              example: 1337,
            },
            highestLevel: {
              type: 'number',
              description: 'Highest level achieved globally',
              example: 99,
            },
            deepestFloor: {
              type: 'number',
              description: 'Deepest floor reached globally',
              example: 50,
            },
            highestScore: {
              type: 'number',
              description: 'Highest score achieved globally',
              example: 999999,
            },
            activePlayers: {
              type: 'number',
              description: 'Currently active players',
              example: 42,
            },
          },
        },
        HealthCheck: {
          type: 'object',
          required: ['status', 'timestamp'],
          properties: {
            status: {
              type: 'string',
              enum: ['healthy', 'degraded', 'unhealthy'],
              example: 'healthy',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-01T00:00:00.000Z',
            },
            version: {
              type: 'string',
              example: '1.0.0',
            },
            uptime: {
              type: 'number',
              description: 'Uptime in seconds',
              example: 86400,
            },
            services: {
              type: 'object',
              properties: {
                database: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      enum: ['connected', 'disconnected', 'error'],
                    },
                    latency: {
                      type: 'number',
                      description: 'Connection latency in ms',
                    },
                  },
                },
                redis: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      enum: ['connected', 'disconnected', 'error'],
                    },
                    latency: {
                      type: 'number',
                      description: 'Connection latency in ms',
                    },
                  },
                },
                blockchain: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      enum: ['connected', 'disconnected', 'error'],
                    },
                    latency: {
                      type: 'number',
                      description: 'API response latency in ms',
                    },
                    blockHeight: {
                      type: 'number',
                      description: 'Current block height',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Health',
        description: 'System health and monitoring endpoints',
      },
      {
        name: 'Players',
        description: 'Player management and statistics',
      },
      {
        name: 'Game',
        description: 'Game state and mechanics',
      },
      {
        name: 'Tombstones',
        description: 'Tombstone NFT management',
      },
      {
        name: 'Leaderboard',
        description: 'Rankings and achievements',
      },
      {
        name: 'Admin',
        description: 'Administrative functions (requires admin privileges)',
      },
    ],
  },
  apis: [
    './src/routes/*.ts', // Include all route files
    './src/controllers/*.ts', // Include controller files for additional documentation
  ],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

/**
 * Setup Swagger documentation middleware
 */
export function setupSwagger(app: Express): void {
  // Swagger JSON endpoint
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCssUrl: 'https://cdn.jsdelivr.net/npm/swagger-ui-themes@3.0.1/themes/3.x/theme-material.css',
    customSiteTitle: 'Satoshi Quest API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'list',
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      tryItOutEnabled: true,
    },
  }));

  console.log(`📚 Swagger documentation available at http://localhost:${config.port}/api-docs`);
}

export { swaggerSpec };
