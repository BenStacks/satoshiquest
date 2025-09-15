import request from 'supertest';
import { Player } from '@/models/Player';
import { Tombstone } from '@/models/Tombstone';
import SatoshiQuestServer from '@/app';
import { setupTestDatabase, teardownTestDatabase, clearDatabase, mockPlayerData, mockTombstoneData } from './setup';

describe('Game API Endpoints', () => {
  let app: SatoshiQuestServer;
  let server: any;

  beforeAll(async () => {
    await setupTestDatabase();
    app = new SatoshiQuestServer();
    server = app.app;
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  describe('GET /api/v1/game/stats', () => {
    it('should return global game statistics', async () => {
      // Create test data
      const player = new Player(mockPlayerData);
      await player.save();

      const tombstone = new Tombstone(mockTombstoneData);
      await tombstone.save();

      const response = await request(server)
        .get('/api/v1/game/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });

  describe('GET /api/v1/game/leaderboard/:type', () => {
    beforeEach(async () => {
      // Create test players
      const players = [
        { ...mockPlayerData, walletAddress: 'SP1111', totalScore: 1000 },
        { ...mockPlayerData, walletAddress: 'SP2222', totalScore: 2000 },
        { ...mockPlayerData, walletAddress: 'SP3333', totalScore: 1500 },
      ];

      await Player.insertMany(players);
    });

    it('should return score leaderboard', async () => {
      const response = await request(server)
        .get('/api/v1/game/leaderboard/score')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should return level leaderboard', async () => {
      const response = await request(server)
        .get('/api/v1/game/leaderboard/level')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/v1/game/player/:address', () => {
    it('should return player data for existing player', async () => {
      const player = new Player(mockPlayerData);
      await player.save();

      const response = await request(server)
        .get(`/api/v1/game/player/${mockPlayerData.walletAddress}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.walletAddress).toBe(mockPlayerData.walletAddress);
    });

    it('should return 404 for non-existent player', async () => {
      const response = await request(server)
        .get('/api/v1/game/player/SP9999999999999999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Player not found');
    });
  });

  describe('POST /api/v1/game/player/:address/update', () => {
    it('should update existing player state', async () => {
      const player = new Player(mockPlayerData);
      await player.save();

      const updateData = {
        level: 6,
        score: 2000,
        position: { x: 150, y: 250 },
        health: 90,
      };

      const response = await request(server)
        .post(`/api/v1/game/player/${mockPlayerData.walletAddress}/update`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.currentLevel).toBe(updateData.level);
      expect(response.body.data.currentScore).toBe(updateData.score);
    });

    it('should create new player if not exists', async () => {
      const newAddress = 'SP9999999999999999';
      const updateData = {
        level: 1,
        score: 100,
        position: { x: 0, y: 0 },
        health: 100,
      };

      const response = await request(server)
        .post(`/api/v1/game/player/${newAddress}/update`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.walletAddress).toBe(newAddress);
    });

    it('should validate input data', async () => {
      const invalidData = {
        level: -1, // Invalid negative level
        score: 'invalid', // Invalid string score
        health: 150, // Invalid health > 100
      };

      const response = await request(server)
        .post(`/api/v1/game/player/${mockPlayerData.walletAddress}/update`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('POST /api/v1/game/player/:address/death', () => {
    beforeEach(async () => {
      const player = new Player(mockPlayerData);
      await player.save();
    });

    it('should handle player death and create tombstone', async () => {
      const deathData = {
        finalScore: 1500,
        finalLevel: 5,
        deathPosition: { x: 100, y: 200 },
        killedBy: 'dragon',
      };

      const response = await request(server)
        .post(`/api/v1/game/player/${mockPlayerData.walletAddress}/death`)
        .send(deathData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.player).toBeDefined();
      expect(response.body.data.tombstone).toBeDefined();
      expect(response.body.data.player.currentHealth).toBe(0);
      expect(response.body.data.tombstone.finalScore).toBe(deathData.finalScore);
    });

    it('should validate death data', async () => {
      const invalidData = {
        finalScore: -100, // Invalid negative score
        finalLevel: 0, // Invalid zero level
        deathPosition: 'invalid', // Invalid position format
      };

      const response = await request(server)
        .post(`/api/v1/game/player/${mockPlayerData.walletAddress}/death`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/game/tombstones', () => {
    beforeEach(async () => {
      const tombstones = [
        { ...mockTombstoneData, tokenId: 'tomb-1', finalScore: 1000 },
        { ...mockTombstoneData, tokenId: 'tomb-2', finalScore: 2000 },
        { ...mockTombstoneData, tokenId: 'tomb-3', finalScore: 1500 },
      ];

      await Tombstone.insertMany(tombstones);
    });

    it('should return paginated tombstones', async () => {
      const response = await request(server)
        .get('/api/v1/game/tombstones?page=1&limit=2')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tombstones).toHaveLength(2);
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.current).toBe(1);
      expect(response.body.data.pagination.total).toBe(3);
    });

    it('should sort tombstones by creation date by default', async () => {
      const response = await request(server)
        .get('/api/v1/game/tombstones')
        .expect(200);

      expect(response.body.success).toBe(true);
      const tombstones = response.body.data.tombstones;
      expect(tombstones[0].tokenId).toBe('tomb-3'); // Most recent
    });
  });

  describe('GET /api/v1/game/tombstone/:tokenId', () => {
    it('should return tombstone by token ID', async () => {
      const tombstone = new Tombstone(mockTombstoneData);
      await tombstone.save();

      const response = await request(server)
        .get(`/api/v1/game/tombstone/${mockTombstoneData.tokenId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tokenId).toBe(mockTombstoneData.tokenId);
    });

    it('should return 404 for non-existent tombstone', async () => {
      const response = await request(server)
        .get('/api/v1/game/tombstone/non-existent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Tombstone not found');
    });
  });
});

export { };
