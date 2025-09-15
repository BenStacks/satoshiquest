import { Router } from 'express';
import { checkDatabaseHealth } from '@/config/database';
import { checkRedisHealth } from '@/config/redis';
import { logger } from '@/utils/logger';

/**
 * Health check routes for monitoring and load balancing
 * @swagger
 * tags:
 *   name: Health
 *   description: System health and monitoring endpoints
 */

const router = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Basic health check
 *     description: Returns basic health status for load balancers
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "healthy"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       503:
 *         description: Service is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', async (req, res) => {
  try {
    const timestamp = new Date().toISOString();
    
    res.status(200).json({
      status: 'healthy',
      timestamp,
    });
  } catch (error) {
    logger.error('Health check failed:', error as Error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * @swagger
 * /health/detailed:
 *   get:
 *     summary: Detailed health check
 *     description: Returns comprehensive health status including all services
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Detailed health information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthCheck'
 *       503:
 *         description: One or more services are unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthCheck'
 */
router.get('/detailed', async (req, res) => {
  try {
    const timestamp = new Date().toISOString();
    const uptime = process.uptime();
    
    // Check database health
    const dbHealth = await checkDatabaseHealth();
    
    // Check Redis health
    const redisHealth = await checkRedisHealth();
    
    // Check blockchain API (basic ping)
    const blockchainHealth = await checkBlockchainHealth();
    
    // Determine overall status
    const allServicesHealthy = 
      dbHealth.status === 'connected' &&
      redisHealth.status === 'connected' &&
      blockchainHealth.status === 'connected';
    
    const overallStatus = allServicesHealthy ? 'healthy' : 
      (dbHealth.status === 'error' || redisHealth.status === 'error') ? 'unhealthy' : 'degraded';
    
    const healthResponse = {
      status: overallStatus,
      timestamp,
      version: process.env.npm_package_version || '1.0.0',
      uptime: Math.floor(uptime),
      services: {
        database: dbHealth,
        redis: redisHealth,
        blockchain: blockchainHealth,
      },
    };
    
    const statusCode = overallStatus === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthResponse);
    
  } catch (error) {
    logger.error('Detailed health check failed:', error as Error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check system failure',
    });
  }
});

/**
 * @swagger
 * /health/ready:
 *   get:
 *     summary: Readiness probe
 *     description: Kubernetes readiness probe endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is ready to accept traffic
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ready:
 *                   type: boolean
 *                   example: true
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       503:
 *         description: Service is not ready
 */
router.get('/ready', async (req, res) => {
  try {
    // Check critical services only
    const dbHealth = await checkDatabaseHealth();
    const isReady = dbHealth.status === 'connected';
    
    if (isReady) {
      res.status(200).json({
        ready: true,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        ready: false,
        timestamp: new Date().toISOString(),
        reason: 'Database not available',
      });
    }
  } catch (error) {
    logger.error('Readiness check failed:', error as Error);
    res.status(503).json({
      ready: false,
      timestamp: new Date().toISOString(),
      reason: 'Readiness check failed',
    });
  }
});

/**
 * @swagger
 * /health/live:
 *   get:
 *     summary: Liveness probe
 *     description: Kubernetes liveness probe endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is alive
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 alive:
 *                   type: boolean
 *                   example: true
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       503:
 *         description: Service is not responding
 */
router.get('/live', (req, res) => {
  // Simple liveness check - if we can respond, we're alive
  res.status(200).json({
    alive: true,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Check blockchain API health
 */
async function checkBlockchainHealth(): Promise<{ status: string; latency?: number; blockHeight?: number }> {
  try {
    // TODO: Implement actual blockchain API health check
    // For now, return a mock healthy status
    const startTime = Date.now();
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const latency = Date.now() - startTime;
    
    return {
      status: 'connected',
      latency,
      blockHeight: 150000, // Mock block height
    };
  } catch (error) {
    logger.error('Blockchain health check failed:', error);
    return { status: 'error' };
  }
}

export default router;
