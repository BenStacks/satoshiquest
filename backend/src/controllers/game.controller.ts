import { Request, Response, NextFunction } from 'express';
import { GameStateService } from '@/services/gameState.service';
import { WebSocketService } from '@/services/websocket.service';
import { logger } from '@/utils/logger';
import { Player } from '@/models/Player';
import { Tombstone } from '@/models/Tombstone';
import { validationResult } from 'express-validator';

const gameStateService = new GameStateService();
let wsService: WebSocketService;

export class GameController {
  private wsService?: WebSocketService;

  constructor() {
    // WebSocket service will be injected during initialization
  }

  /**
   * Set WebSocket service instance
   */
  public setWebSocketService(wsService: WebSocketService): void {
    this.wsService = wsService;
  }

  /**
   * @swagger
   * /api/v1/game/stats:
   *   get:
   *     summary: Get global game statistics
   *     tags: [Game]
   *     responses:
   *       200:
   *         description: Global statistics
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   */
  public async getGlobalStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await gameStateService.getGlobalStats();
      
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Failed to get global stats:', error);
      next(error);
    }
  }

  /**
   * @swagger
   * /api/v1/game/leaderboard/{type}:
   *   get:
   *     summary: Get leaderboard by type
   *     tags: [Game]
   *     parameters:
   *       - in: path
   *         name: type
   *         required: true
   *         schema:
   *           type: string
   *           enum: [score, level, tombstones]
   *         description: Leaderboard type
   *     responses:
   *       200:
   *         description: Leaderboard data
   */
  public async getLeaderboard(req: Request, res: Response, next: NextFunction) {
    try {
      const { type } = req.params;
      const leaderboard = await gameStateService.getLeaderboard(type);
      
      res.json({
        success: true,
        data: leaderboard,
      });
    } catch (error) {
      logger.error('Failed to get leaderboard:', error);
      next(error);
    }
  }

  /**
   * @swagger
   * /api/v1/game/player/{address}:
   *   get:
   *     summary: Get player data
   *     tags: [Game]
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
   */
  public async getPlayerData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { address } = req.params;
      const player = await (Player as any).findByAddress(address);
      
      if (!player) {
        res.status(404).json({
          success: false,
          message: 'Player not found',
        });
        return;
      }
      
      res.json({
        success: true,
        data: player,
      });
    } catch (error) {
      logger.error('Failed to get player data:', error);
      next(error);
    }
  }

  /**
   * @swagger
   * /api/v1/game/player/{address}/update:
   *   post:
   *     summary: Update player game state
   *     tags: [Game]
   *     parameters:
   *       - in: path
   *         name: address
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               level:
   *                 type: number
   *               score:
   *                 type: number
   *               position:
   *                 type: object
   *                 properties:
   *                   x:
   *                     type: number
   *                   y:
   *                     type: number
   *               health:
   *                 type: number
   *     responses:
   *       200:
   *         description: Player updated successfully
   */
  public async updatePlayerState(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
        return;
      }

      const { address } = req.params;
      const updateData = req.body;

      let player = await (Player as any).findByAddress(address);
      
      if (!player) {
        // Create new player if doesn't exist
        player = new Player({
          walletAddress: address,
          currentLevel: updateData.level || 1,
          currentScore: updateData.score || 0,
          currentPosition: updateData.position || { x: 0, y: 0 },
          currentHealth: updateData.health || 100,
        });
      } else {
        // Update existing player
        if (updateData.level) player.currentLevel = updateData.level;
        if (updateData.score) player.currentScore = updateData.score;
        if (updateData.position) player.currentPosition = updateData.position;
        if (updateData.health !== undefined) player.currentHealth = updateData.health;
      }

      await player.save();

      // Broadcast update to connected clients if WebSocket service is available
      if (this.wsService) {
        this.wsService.broadcast('playerUpdate', {
          address,
          data: updateData,
        });
      }

      res.json({
        success: true,
        data: player,
      });
    } catch (error) {
      logger.error('Failed to update player state:', error);
      next(error);
    }
  }

  /**
   * @swagger
   * /api/v1/game/player/{address}/death:
   *   post:
   *     summary: Handle player death
   *     tags: [Game]
   *     parameters:
   *       - in: path
   *         name: address
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               finalScore:
   *                 type: number
   *               finalLevel:
   *                 type: number
   *               deathPosition:
   *                 type: object
   *               killedBy:
   *                 type: string
   *     responses:
   *       200:
   *         description: Death processed successfully
   */
  public async handlePlayerDeath(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
        return;
      }

      const { address } = req.params;
      const { finalScore, finalLevel, deathPosition, killedBy } = req.body;

      const player = await (Player as any).findByAddress(address);
      
      if (!player) {
        res.status(404).json({
          success: false,
          message: 'Player not found',
        });
        return;
      }

      // Update player stats
      player.currentHealth = 0;
      player.deathCount = (player.deathCount || 0) + 1;
      player.highestLevel = Math.max(player.highestLevel, finalLevel);
      player.totalScore = (player.totalScore || 0) + finalScore;
      player.lastDeathAt = new Date();

      await player.save();

      // Create tombstone (this will be minted on-chain later)
      const tombstone = new Tombstone({
        playerAddress: address,
        tokenId: null, // Will be set when minted
        finalScore,
        finalLevel,
        deathPosition,
        killedBy,
        epitaph: `Here lies a brave soul who reached level ${finalLevel}`,
        createdAt: new Date(),
      });

      await tombstone.save();

      // Broadcast death event if WebSocket service is available
      if (this.wsService) {
        this.wsService.broadcast('playerDeath', {
          address,
          finalScore,
          finalLevel,
          tombstoneId: tombstone._id,
        });
      }

      // Update leaderboards
      await gameStateService.updateLeaderboards();

      res.json({
        success: true,
        data: {
          player: player.toJSON(),
          tombstone: tombstone.toJSON(),
        },
      });
    } catch (error) {
      logger.error('Failed to handle player death:', error);
      next(error);
    }
  }

  /**
   * @swagger
   * /api/v1/game/tombstones:
   *   get:
   *     summary: Get tombstones with pagination
   *     tags: [Game]
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
   *       - in: query
   *         name: sortBy
   *         schema:
   *           type: string
   *           enum: [finalScore, finalLevel, createdAt]
   *           default: createdAt
   *     responses:
   *       200:
   *         description: Tombstones list
   */
  public async getTombstones(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const sortBy = req.query.sortBy as string || 'createdAt';

      const tombstones = await Tombstone.find()
        .sort({ [sortBy]: -1 })
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
  }

  /**
   * @swagger
   * /api/v1/game/tombstone/{tokenId}:
   *   get:
   *     summary: Get tombstone by token ID
   *     tags: [Game]
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
  public async getTombstoneByTokenId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tokenId } = req.params;
      const tombstone = await (Tombstone as any).findByTokenId(tokenId);
      
      if (!tombstone) {
        res.status(404).json({
          success: false,
          message: 'Tombstone not found',
        });
        return;
      }
      
      res.json({
        success: true,
        data: tombstone,
      });
    } catch (error) {
      logger.error('Failed to get tombstone:', error);
      next(error);
    }
  }

  /**
   * Initialize game controller
   */
  public async initialize(): Promise<void> {
    try {
      await gameStateService.initialize();
      logger.info('🎮 Game controller initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize game controller:', error);
      throw error;
    }
  }
}
