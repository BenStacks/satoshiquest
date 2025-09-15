import { Router } from 'express';
import { Tombstone } from '@/models/Tombstone';
import { logger } from '@/utils/logger';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Tombstones
 *   description: Tombstone management endpoints
 */

/**
 * @swagger
 * /api/v1/tombstones:
 *   get:
 *     summary: Get tombstones with pagination
 *     tags: [Tombstones]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Tombstones list
 */
router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const tombstones = await Tombstone.find()
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Tombstone.countDocuments();

    res.json({
      success: true,
      data: {
        tombstones,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
        },
      },
    });
  } catch (error) {
    logger.error('Failed to get tombstones:', error);
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/tombstones/{tokenId}:
 *   get:
 *     summary: Get tombstone by token ID
 *     tags: [Tombstones]
 *     parameters:
 *       - in: path
 *         name: tokenId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tombstone data
 */
router.get('/:tokenId', async (req, res, next) => {
  try {
    const { tokenId } = req.params;
    const tombstone = await (Tombstone as any).findByTokenId(tokenId);
    
    if (!tombstone) {
      return res.status(404).json({
        success: false,
        message: 'Tombstone not found',
      });
    }
    
    res.json({
      success: true,
      data: tombstone,
    });
  } catch (error) {
    logger.error('Failed to get tombstone:', error);
    next(error);
  }
});

export default router;
