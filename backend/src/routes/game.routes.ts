import { Router } from 'express';
import { GameController } from '@/controllers/game.controller';
import { validateRequest, gameValidationSchemas } from '@/middleware/validation';

const router = Router();
const gameController = new GameController();

/**
 * @swagger
 * tags:
 *   name: Game
 *   description: Game state and player management
 */

// Global stats and leaderboards
router.get('/stats', gameController.getGlobalStats.bind(gameController));
router.get('/leaderboard/:type', gameController.getLeaderboard.bind(gameController));

// Player management
router.get('/player/:address', gameController.getPlayerData.bind(gameController));
router.post(
  '/player/:address/update',
  gameValidationSchemas.updatePlayerState,
  validateRequest,
  gameController.updatePlayerState.bind(gameController)
);
router.post(
  '/player/:address/death',
  gameValidationSchemas.playerDeath,
  validateRequest,
  gameController.handlePlayerDeath.bind(gameController)
);

// Tombstone management
router.get('/tombstones', gameController.getTombstones.bind(gameController));
router.get('/tombstone/:tokenId', gameController.getTombstoneByTokenId.bind(gameController));

export default router;
