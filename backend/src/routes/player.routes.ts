import { Router } from 'express';
import { Player } from '@/models/Player';
import { logger } from '@/utils/logger';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Players
 *   description: Player management endpoints
 */

/**
 * @swagger
 * /api/v1/players/{address}:
 *   get:
 *     summary: Get player by address
 *     tags: [Players]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Player wallet address
 *     responses:
 *       200:
 *         description: Player data
 *       404:
 *         description: Player not found
 */
router.get('/:address', async (req, res, next) => {
  try {
    const { address } = req.params;
    const player = await (Player as any).findByAddress(address);
    
    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found',
      });
    }
    
    res.json({
      success: true,
      data: player,
    });
  } catch (error) {
    logger.error('Failed to get player:', error);
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/players/{address}/tombstones:
 *   get:
 *     summary: Get player tombstones
 *     tags: [Players]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Player tombstones
 */
router.get('/:address/tombstones', async (req, res, next) => {
  try {
    const { address } = req.params;
    const { Tombstone } = await import('@/models/Tombstone');
    const tombstones = await (Tombstone as any).findByAddress(address);
    
    res.json({
      success: true,
      data: tombstones,
    });
  } catch (error) {
    logger.error('Failed to get player tombstones:', error);
    next(error);
  }
});

export default router;
