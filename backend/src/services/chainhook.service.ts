import { Request, Response } from 'express';
import { logger, loggers } from '@/utils/logger';
import { config } from '@/config/environment';
import { Tombstone } from '@/models/Tombstone';
import { Player } from '@/models/Player';
import { WebSocketService } from './websocket.service';

/**
 * Chainhook Service for processing blockchain events
 * Handles tombstone minting, transfers, resurrections, and other contract events
 * Updated for production deployment with real contract addresses
 */

interface ContractEvent {
  event_type: string;
  data: any;
  contract_identifier: string;
  tx_id: string;
  block_height: number;
  timestamp: number;
}

export class ChainhookService {
  private webhookSecret: string;
  private wsService?: WebSocketService;

  constructor() {
    this.webhookSecret = config.chainhook.webhookSecret;
  }

  /**
   * Set WebSocket service for real-time notifications
   */
  public setWebSocketService(wsService: WebSocketService): void {
    this.wsService = wsService;
  }

  /**
   * Initialize chainhook service
   */
  public async initialize(): Promise<void> {
    try {
      // Register chainhooks for deployed contracts
      await this.registerChainhooks();
      
      logger.info('🔗 Chainhook service initialized with contracts:', {
        tombstone: config.contracts.tombstone,
        resurrection: config.contracts.resurrection,
        core: config.contracts.core,
        loot: config.contracts.loot
      });
      
      if (config.debug.mockEvents) {
        this.startMockEventGenerator();
      }
    } catch (error) {
      logger.error('Failed to initialize chainhook service:', error);
      throw error;
    }
  }

  /**
   * Register chainhooks for our deployed contracts
   */
  private async registerChainhooks(): Promise<void> {
    const contractsToWatch = [
      config.contracts.tombstone,
      config.contracts.resurrection,
      config.contracts.core,
      config.contracts.loot
    ].filter(address => address && address !== '');

    logger.info('📡 Registering chainhooks for contracts:', contractsToWatch);
    
    // In production, this would register with chainhook service
    // For now, log the contracts we're ready to watch
    for (const contractAddress of contractsToWatch) {
      logger.info(`🎯 Ready to watch contract: ${contractAddress}`);
    }
  }

  /**
   * Handle incoming webhook from chainhook service
   */
  public async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      // Verify webhook signature
      if (!this.verifyWebhookSignature(req)) {
        res.status(401).json({ error: 'Invalid signature' });
        return;
      }

      const payload = req.body;
      
      // Process the event based on type
      await this.processEvent(payload);
      
      res.status(200).json({ success: true });
      
    } catch (error) {
      logger.error('Webhook processing failed:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }

  /**
   * Process blockchain events
   */
  private async processEvent(payload: ContractEvent): Promise<void> {
    try {
      const { event_type, contract_identifier, data } = payload;
      
      logger.info('📡 Processing blockchain event:', {
        event_type,
        contract_identifier,
        txId: payload.tx_id,
        blockHeight: payload.block_height
      });

      // Route events based on contract and event type
      if (contract_identifier === config.contracts.tombstone) {
        await this.processTombstoneEvent(event_type, payload);
      } else if (contract_identifier === config.contracts.resurrection) {
        await this.processResurrectionEvent(event_type, payload);
      } else if (contract_identifier === config.contracts.core) {
        await this.processCoreEvent(event_type, payload);
      } else if (contract_identifier === config.contracts.loot) {
        await this.processLootEvent(event_type, payload);
      } else {
        logger.warn('Unknown contract event received:', contract_identifier);
      }
      
    } catch (error) {
      logger.error('Event processing failed:', error);
      throw error;
    }
  }

  /**
   * Process tombstone contract events
   */
  private async processTombstoneEvent(eventType: string, payload: ContractEvent): Promise<void> {
    switch (eventType) {
      case 'tombstone_minted':
      case 'nft_mint_event':
        await this.handleTombstoneMinted(payload);
        break;
      case 'tombstone_transferred':
      case 'nft_transfer_event':
        await this.handleTombstoneTransferred(payload);
        break;
      default:
        logger.info('Unknown tombstone event:', eventType);
    }
  }

  /**
   * Process resurrection contract events
   */
  private async processResurrectionEvent(eventType: string, payload: ContractEvent): Promise<void> {
    switch (eventType) {
      case 'character_resurrected':
      case 'player_resurrected':
        await this.handlePlayerResurrected(payload);
        break;
      case 'resurrection_failed':
        await this.handleResurrectionFailed(payload);
        break;
      default:
        logger.info('Unknown resurrection event:', eventType);
    }
  }

  /**
   * Process core contract events
   */
  private async processCoreEvent(eventType: string, payload: ContractEvent): Promise<void> {
    switch (eventType) {
      case 'character_created':
        await this.handleCharacterCreated(payload);
        break;
      case 'character_died':
        await this.handleCharacterDied(payload);
        break;
      case 'level_up':
        await this.handleLevelUp(payload);
        break;
      default:
        logger.info('Unknown core event:', eventType);
    }
  }

  /**
   * Process loot contract events
   */
  private async processLootEvent(eventType: string, payload: ContractEvent): Promise<void> {
    switch (eventType) {
      case 'loot_minted':
      case 'nft_mint_event':
        await this.handleLootMinted(payload);
        break;
      case 'loot_burned':
      case 'nft_burn_event':
        await this.handleLootBurned(payload);
        break;
      default:
        logger.info('Unknown loot event:', eventType);
    }
  }

  /**
   * Handle tombstone minting event
   */
  private async handleTombstoneMinted(payload: any): Promise<void> {
    try {
      const { 
        token_id, 
        owner, 
        metadata, 
        tx_id, 
        block_height, 
        contract_address,
        timestamp 
      } = payload.data;

      // Create tombstone record
      const tombstone = new Tombstone({
        tokenId: token_id,
        owner: owner.toUpperCase(),
        metadata: {
          characterName: metadata.character_name,
          finalLevel: metadata.final_level,
          finalScore: metadata.final_score,
          deepestFloor: metadata.deepest_floor,
          deathCause: metadata.death_cause,
          totalExperience: metadata.total_experience,
          playTime: metadata.play_time,
          burnedItemsCount: metadata.burned_items_count,
          deathBlock: metadata.death_block,
          mintBlock: block_height,
          ownerAtDeath: metadata.owner_at_death?.toUpperCase() || owner.toUpperCase(),
        },
        txId: tx_id,
        blockHeight: block_height,
        contractAddress: contract_address.toUpperCase(),
        mintedAt: new Date(timestamp),
      });

      await tombstone.save();

      // Update player statistics
      await this.updatePlayerStats(owner, {
        tombstoneCount: 1,
        score: metadata.final_score,
        level: metadata.final_level,
        floor: metadata.deepest_floor,
        playTime: metadata.play_time,
      });

      loggers.blockchainEvent('tombstone_minted', tx_id, block_height, contract_address, {
        tokenId: token_id,
        characterName: metadata.character_name,
        owner,
      });

      logger.info('Tombstone minted successfully', {
        tokenId: token_id,
        characterName: metadata.character_name,
        owner,
      });

    } catch (error) {
      logger.error('Failed to handle tombstone minting:', error);
      throw error;
    }
  }

  /**
   * Handle tombstone transfer event
   */
  private async handleTombstoneTransferred(payload: any): Promise<void> {
    try {
      const { 
        token_id, 
        from, 
        to, 
        tx_id, 
        block_height, 
        timestamp 
      } = payload.data;

      // Find and update tombstone
      const tombstone = await (Tombstone as any).findByTokenId(token_id);
      if (!tombstone) {
        logger.warn('Tombstone not found for transfer:', token_id);
        return;
      }

      // Add transfer to history
      await tombstone.addTransfer({
        from: from.toUpperCase(),
        to: to.toUpperCase(),
        txId: tx_id,
        blockHeight: block_height,
        timestamp: new Date(timestamp),
      });

      loggers.blockchainEvent('tombstone_transferred', tx_id, block_height, '', {
        tokenId: token_id,
        from,
        to,
      });

      logger.info('Tombstone transferred successfully', {
        tokenId: token_id,
        from,
        to,
      });

    } catch (error) {
      logger.error('Failed to handle tombstone transfer:', error);
      throw error;
    }
  }

  /**
   * Handle resurrection failure events
   */
  private async handleResurrectionFailed(payload: ContractEvent): Promise<void> {
    try {
      const { character_id, player_address, sbtc_amount, reason } = payload.data;

      logger.info('❌ Resurrection failed:', {
        characterId: character_id,
        playerAddress: player_address,
        sbtcAmount: sbtc_amount,
        reason
      });

      // Broadcast to frontend
      if (this.wsService) {
        this.wsService.broadcastPlayerResurrected({
          type: 'resurrection_failed',
          characterId: character_id,
          playerAddress: player_address,
          sbtcAmount: sbtc_amount,
          reason,
          txId: payload.tx_id
        });
      }

    } catch (error) {
      logger.error('Failed to handle resurrection failure:', error);
      throw error;
    }
  }

  /**
   * Handle character creation events
   */
  private async handleCharacterCreated(payload: ContractEvent): Promise<void> {
    try {
      const { character_id, character_name, player_address } = payload.data;

      // Update player record
      await this.updatePlayerStats(player_address, {
        // Character creation doesn't add stats, just tracks activity
      });

      logger.info('👤 Character created:', {
        characterId: character_id,
        characterName: character_name,
        playerAddress: player_address
      });

      // Broadcast to frontend
      if (this.wsService) {
        this.wsService.sendPersonalNotification(player_address, {
          type: 'character_created',
          characterId: character_id,
          characterName: character_name,
          txId: payload.tx_id
        });
      }

    } catch (error) {
      logger.error('Failed to handle character creation:', error);
      throw error;
    }
  }

  /**
   * Handle character death events
   */
  private async handleCharacterDied(payload: ContractEvent): Promise<void> {
    try {
      const { character_id, character_name, player_address, final_level, final_score } = payload.data;

      // Update player death statistics
      await this.updatePlayerStats(player_address, {
        score: final_score,
        level: final_level
      });

      logger.info('💀 Character died:', {
        characterId: character_id,
        characterName: character_name,
        playerAddress: player_address,
        finalLevel: final_level,
        finalScore: final_score
      });

      // Broadcast to frontend
      if (this.wsService) {
        this.wsService.sendPersonalNotification(player_address, {
          type: 'character_died',
          characterId: character_id,
          characterName: character_name,
          finalLevel: final_level,
          finalScore: final_score,
          txId: payload.tx_id
        });
      }

    } catch (error) {
      logger.error('Failed to handle character death:', error);
      throw error;
    }
  }

  /**
   * Handle level up events
   */
  private async handleLevelUp(payload: ContractEvent): Promise<void> {
    try {
      const { character_id, character_name, player_address, new_level, old_level } = payload.data;

      logger.info('📈 Character leveled up:', {
        characterId: character_id,
        characterName: character_name,
        playerAddress: player_address,
        newLevel: new_level,
        oldLevel: old_level
      });

      // Broadcast to frontend for celebration
      if (this.wsService) {
        this.wsService.sendPersonalNotification(player_address, {
          type: 'level_up',
          characterId: character_id,
          characterName: character_name,
          newLevel: new_level,
          oldLevel: old_level,
          txId: payload.tx_id
        });
      }

    } catch (error) {
      logger.error('Failed to handle level up:', error);
      throw error;
    }
  }

  /**
   * Handle loot minting events
   */
  private async handleLootMinted(payload: ContractEvent): Promise<void> {
    try {
      const { token_id, owner, item_type, rarity, character_id } = payload.data;

      logger.info('🎁 Loot minted:', {
        tokenId: token_id,
        owner,
        itemType: item_type,
        rarity,
        characterId: character_id
      });

      // Broadcast to frontend
      if (this.wsService) {
        this.wsService.sendPersonalNotification(owner, {
          type: 'loot_minted',
          tokenId: token_id,
          itemType: item_type,
          rarity,
          characterId: character_id,
          txId: payload.tx_id
        });
      }

    } catch (error) {
      logger.error('Failed to handle loot minting:', error);
      throw error;
    }
  }

  /**
   * Handle loot burning events (on character death)
   */
  private async handleLootBurned(payload: ContractEvent): Promise<void> {
    try {
      const { token_ids, owner, character_id, character_name } = payload.data;

      logger.info('🔥 Loot burned on character death:', {
        tokenIds: token_ids,
        owner,
        characterId: character_id,
        characterName: character_name
      });

      // Broadcast to frontend
      if (this.wsService) {
        this.wsService.sendPersonalNotification(owner, {
          type: 'loot_burned',
          tokenIds: token_ids,
          characterId: character_id,
          characterName: character_name,
          txId: payload.tx_id
        });
      }

    } catch (error) {
      logger.error('Failed to handle loot burning:', error);
      throw error;
    }
  }
  private async handlePlayerResurrected(payload: any): Promise<void> {
    try {
      const { 
        player_address, 
        character_name, 
        cost_sbtc, 
        tx_id, 
        block_height, 
        timestamp 
      } = payload.data;

      // Update player resurrection count
      await this.updatePlayerStats(player_address, {
        resurrectionCount: 1,
      });

      loggers.blockchainEvent('player_resurrected', tx_id, block_height, '', {
        playerAddress: player_address,
        characterName: character_name,
        costSbtc: cost_sbtc,
      });

      logger.info('Player resurrected successfully', {
        playerAddress: player_address,
        characterName: character_name,
        costSbtc: cost_sbtc,
      });

    } catch (error) {
      logger.error('Failed to handle player resurrection:', error);
      throw error;
    }
  }

  /**
   * Update player statistics
   */
  private async updatePlayerStats(address: string, updates: {
    tombstoneCount?: number;
    resurrectionCount?: number;
    score?: number;
    level?: number;
    floor?: number;
    playTime?: number;
  }): Promise<void> {
    try {
      let player = await (Player as any).findByAddress(address);
      
      if (!player) {
        // Create new player record
        player = new Player({
          address: address.toUpperCase(),
          totalScore: updates.score || 0,
          highestLevel: updates.level || 0,
          deepestFloor: updates.floor || 0,
          gamesPlayed: 1,
          totalPlayTime: updates.playTime || 0,
          tombstoneCount: updates.tombstoneCount || 0,
          resurrectionCount: updates.resurrectionCount || 0,
        });
      } else {
        // Update existing player
        if (updates.tombstoneCount) {
          player.tombstoneCount += updates.tombstoneCount;
        }
        
        if (updates.resurrectionCount) {
          player.resurrectionCount += updates.resurrectionCount;
        }
        
        if (updates.score) {
          player.totalScore += updates.score;
          player.gamesPlayed += 1;
        }
        
        if (updates.level && updates.level > player.highestLevel) {
          player.highestLevel = updates.level;
        }
        
        if (updates.floor && updates.floor > player.deepestFloor) {
          player.deepestFloor = updates.floor;
        }
        
        if (updates.playTime) {
          player.totalPlayTime += updates.playTime;
        }
        
        player.lastActiveAt = new Date();
      }

      await player.save();
      
    } catch (error) {
      logger.error('Failed to update player stats:', error);
      throw error;
    }
  }

  /**
   * Verify webhook signature
   */
  private verifyWebhookSignature(req: Request): boolean {
    // TODO: Implement proper signature verification
    // For development, always return true
    if (config.nodeEnv === 'development') {
      return true;
    }
    
    const signature = req.headers['x-webhook-signature'] as string;
    return !!signature && signature === this.webhookSecret;
  }

  /**
   * Start mock event generator for development
   */
  private startMockEventGenerator(): void {
    if (config.nodeEnv !== 'development') {
      return;
    }

    logger.info('🧪 Starting mock event generator for development');

    // Generate mock tombstone minting events
    setInterval(() => {
      const mockEvent = {
        event_type: 'tombstone_minted',
        data: {
          token_id: Math.floor(Math.random() * 10000) + 1,
          owner: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
          metadata: {
            character_name: `TestHero${Math.floor(Math.random() * 100)}`,
            final_level: Math.floor(Math.random() * 50) + 1,
            final_score: Math.floor(Math.random() * 10000) + 100,
            deepest_floor: Math.floor(Math.random() * 25) + 1,
            death_cause: 'Mock monster attack',
            total_experience: Math.floor(Math.random() * 5000) + 100,
            play_time: Math.floor(Math.random() * 7200) + 300,
            burned_items_count: Math.floor(Math.random() * 10),
            death_block: 150000 + Math.floor(Math.random() * 1000),
            owner_at_death: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
          },
          tx_id: `0x${Math.random().toString(16).substr(2, 64).padEnd(64, '0')}`,
          block_height: 150000 + Math.floor(Math.random() * 1000),
          contract_address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.satoshi-quest-tombstone',
          timestamp: Date.now(),
        },
      };

      this.processEvent(mockEvent).catch(error => {
        logger.error('Mock event processing failed:', error);
      });

    }, 30000); // Generate mock event every 30 seconds
  }
}
