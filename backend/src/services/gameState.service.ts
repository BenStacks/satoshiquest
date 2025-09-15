import { logger } from '@/utils/logger';
import { cache } from '@/config/redis';
import { Tombstone } from '@/models/Tombstone';
import { Player } from '@/models/Player';

/**
 * Game State Service for managing cached game data and statistics
 */

export class GameStateService {
  private updateInterval: number;
  private statsUpdateTimer?: NodeJS.Timeout;

  constructor() {
    this.updateInterval = 60000; // 1 minute default
  }

  /**
   * Initialize game state service
   */
  public async initialize(): Promise<void> {
    try {
      await this.updateGlobalStats();
      await this.updateLeaderboards();
      
      this.startPeriodicUpdates();
      
      logger.info('🎮 Game state service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize game state service:', error);
      throw error;
    }
  }

  /**
   * Start periodic updates of cached data
   */
  private startPeriodicUpdates(): void {
    this.statsUpdateTimer = setInterval(async () => {
      try {
        await this.updateGlobalStats();
        await this.updateLeaderboards();
      } catch (error) {
        logger.error('Periodic stats update failed:', error);
      }
    }, this.updateInterval);
  }

  /**
   * Update global game statistics
   */
  public async updateGlobalStats(): Promise<void> {
    try {
      // Get tombstone stats
      const tombstoneStats = await (Tombstone as any).getGlobalStats();
      
      // Get player stats  
      const playerStats = await (Player as any).getPlayerStats();
      
      // Combine stats
      const globalStats = {
        ...tombstoneStats,
        ...playerStats,
        lastUpdated: new Date().toISOString(),
      };

      // Cache the stats
      await cache.set('global_stats', globalStats, 300); // 5 minutes TTL
      
      logger.debug('Global stats updated successfully');
    } catch (error) {
      logger.error('Failed to update global stats:', error);
      throw error;
    }
  }

  /**
   * Update leaderboards
   */
  public async updateLeaderboards(): Promise<void> {
    try {
      // Update different leaderboard types
      await Promise.all([
        this.updateScoreLeaderboard(),
        this.updateLevelLeaderboard(),
        this.updateTombstoneLeaderboard(),
      ]);
      
      logger.debug('Leaderboards updated successfully');
    } catch (error) {
      logger.error('Failed to update leaderboards:', error);
      throw error;
    }
  }

  /**
   * Update score leaderboard
   */
  private async updateScoreLeaderboard(): Promise<void> {
    const leaderboard = await (Player as any).getLeaderboard(100, 'totalScore');
    await cache.set('leaderboard:score', leaderboard, 300);
  }

  /**
   * Update level leaderboard
   */
  private async updateLevelLeaderboard(): Promise<void> {
    const leaderboard = await (Player as any).getLeaderboard(100, 'highestLevel');
    await cache.set('leaderboard:level', leaderboard, 300);
  }

  /**
   * Update tombstone leaderboard
   */
  private async updateTombstoneLeaderboard(): Promise<void> {
    const leaderboard = await (Tombstone as any).getLeaderboard(100, 'finalScore');
    await cache.set('leaderboard:tombstones', leaderboard, 300);
  }

  /**
   * Get cached global stats
   */
  public async getGlobalStats(): Promise<any> {
    try {
      let stats = await cache.get('global_stats');
      
      if (!stats) {
        await this.updateGlobalStats();
        stats = await cache.get('global_stats');
      }
      
      return stats;
    } catch (error) {
      logger.error('Failed to get global stats:', error);
      throw error;
    }
  }

  /**
   * Get cached leaderboard
   */
  public async getLeaderboard(type: string = 'score'): Promise<any> {
    try {
      let leaderboard = await cache.get(`leaderboard:${type}`);
      
      if (!leaderboard) {
        await this.updateLeaderboards();
        leaderboard = await cache.get(`leaderboard:${type}`);
      }
      
      return leaderboard || [];
    } catch (error) {
      logger.error('Failed to get leaderboard:', error);
      throw error;
    }
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    if (this.statsUpdateTimer) {
      clearInterval(this.statsUpdateTimer);
    }
  }
}
