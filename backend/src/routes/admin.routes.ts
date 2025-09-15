import { Router } from 'express';
import { Player } from '@/models/Player';
import { Tombstone } from '@/models/Tombstone';
import { logger } from '@/utils/logger';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Administrative endpoints
 */

/**
 * @swagger
 * /api/v1/admin/stats:
 *   get:
 *     summary: Get comprehensive system statistics
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: System statistics
 */
router.get('/stats', async (req, res, next) => {
  try {
    const [playerStats, tombstoneStats] = await Promise.all([
      (Player as any).getPlayerStats(),
      (Tombstone as any).getGlobalStats(),
    ]);

    const stats = {
      players: playerStats[0] || {},
      tombstones: tombstoneStats[0] || {},
      system: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version,
        timestamp: new Date().toISOString(),
      },
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Failed to get admin stats:', error);
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/admin/players/top:
 *   get:
 *     summary: Get top players
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Top players
 */
router.get('/players/top', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const topPlayers = await (Player as any).getTopPlayers(limit);
    
    res.json({
      success: true,
      data: topPlayers,
    });
  } catch (error) {
    logger.error('Failed to get top players:', error);
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/admin/tombstones/recent:
 *   get:
 *     summary: Get recent tombstones
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Recent tombstones
 */
router.get('/tombstones/recent', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const recentTombstones = await (Tombstone as any).getRecentTombstones(limit);
    
    res.json({
      success: true,
      data: recentTombstones,
    });
  } catch (error) {
    logger.error('Failed to get recent tombstones:', error);
    next(error);
  }
});

export default router;
