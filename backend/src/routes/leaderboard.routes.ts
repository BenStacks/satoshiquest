import { Router } from 'express';
import { Player } from '@/models/Player';
import { Tombstone } from '@/models/Tombstone';
import { logger } from '@/utils/logger';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Leaderboard
 *   description: Leaderboard endpoints
 */

/**
 * @swagger
 * /api/v1/leaderboard/players:
 *   get:
 *     summary: Get player leaderboard
 *     tags: [Leaderboard]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [totalScore, highestLevel]
 *           default: totalScore
 *     responses:
 *       200:
 *         description: Player leaderboard
 */
router.get('/players', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const sortBy = req.query.sortBy as string || 'totalScore';
    
    const leaderboard = await (Player as any).getLeaderboard(limit, sortBy);
    
    res.json({
      success: true,
      data: leaderboard,
    });
  } catch (error) {
    logger.error('Failed to get player leaderboard:', error);
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/leaderboard/tombstones:
 *   get:
 *     summary: Get tombstone leaderboard
 *     tags: [Leaderboard]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [finalScore, finalLevel]
 *           default: finalScore
 *     responses:
 *       200:
 *         description: Tombstone leaderboard
 */
router.get('/tombstones', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const sortBy = req.query.sortBy as string || 'finalScore';
    
    const leaderboard = await (Tombstone as any).getLeaderboard(limit, sortBy);
    
    res.json({
      success: true,
      data: leaderboard,
    });
  } catch (error) {
    logger.error('Failed to get tombstone leaderboard:', error);
    next(error);
  }
});

export default router;
