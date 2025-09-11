// =============================================================================
// SATOSHI QUEST PHASER.JS GAME ENGINE
// =============================================================================
//
// Enterprise-grade Phaser.js implementation for Satoshi's Quest.
// Handles pixel art rendering, character movement, combat, and dungeon generation.
// Integrates with blockchain contracts for permanent state management.
//
// Features:
// - Procedural dungeon generation using BSP algorithm
// - WASD character movement with collision detection
// - Turn-based combat system with visual feedback
// - Treasure chest interactions for NFT loot
// - Real-time blockchain integration via game events
// =============================================================================

import * as Phaser from 'phaser';
import { GameCharacter, Monster, LootItem, DungeonFloor } from '@/lib/types/game';

// =============================================================================
// GAME CONSTANTS
// =============================================================================

export const GAME_CONFIG = {
  TILE_SIZE: 32,
  DUNGEON_WIDTH: 25,
  DUNGEON_HEIGHT: 15,
  PLAYER_SPEED: 100,
  ANIMATION_SPEED: 200,
  COMBAT_RANGE: 1, // Adjacent tiles
} as const;

export const GAME_COLORS = {
  WALL: 0x4a4a4a,
  FLOOR: 0x8b7355,
  DOOR: 0x8b4513,
  PLAYER: 0x00ff00,
  MONSTER: 0xff0000,
  TREASURE: 0xffd700,
  STAIRS: 0x9370db,
} as const;

// =============================================================================
// PHASER GAME SCENES
// =============================================================================

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Create colored rectangles as placeholder sprites
    this.load.image('wall', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
    
    // Load simple colored sprites for now (will be replaced with pixel art later)
    this.createColoredSprite('player', GAME_COLORS.PLAYER);
    this.createColoredSprite('monster', GAME_COLORS.MONSTER);
    this.createColoredSprite('treasure', GAME_COLORS.TREASURE);
    this.createColoredSprite('floor', GAME_COLORS.FLOOR);
    this.createColoredSprite('wall', GAME_COLORS.WALL);
    this.createColoredSprite('stairs', GAME_COLORS.STAIRS);
  }

  create() {
    console.log('🎮 Phaser Boot Scene loaded');
    this.scene.start('DungeonScene');
  }

  private createColoredSprite(key: string, color: number) {
    const graphics = this.add.graphics();
    graphics.fillStyle(color);
    graphics.fillRect(0, 0, GAME_CONFIG.TILE_SIZE, GAME_CONFIG.TILE_SIZE);
    graphics.generateTexture(key, GAME_CONFIG.TILE_SIZE, GAME_CONFIG.TILE_SIZE);
    graphics.destroy();
  }
}

export class DungeonScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Sprite;
  private dungeon!: number[][];
  private monsters: Phaser.GameObjects.Sprite[] = [];
  private treasures: Phaser.GameObjects.Sprite[] = [];
  private playerGridX = 0;
  private playerGridY = 0;
  private currentFloor = 1;
  private isMoving = false;
  private inCombat = false;
  
  // Game state callbacks
  private onCombatStart?: (monster: Monster) => void;
  private onTreasureFound?: (loot: LootItem) => void;
  private onFloorAdvance?: (floor: number) => void;
  private onPlayerDeath?: () => void;

  // Character stats (synced with blockchain)
  private character: GameCharacter | null = null;

  constructor() {
    super({ key: 'DungeonScene' });
  }

  create() {
    console.log('🏰 Dungeon Scene created');
    
    // Generate initial dungeon
    this.generateDungeon();
    this.renderDungeon();
    this.spawnPlayer();
    this.spawnEntities();
    this.setupInput();
    
    // Setup camera
    this.cameras.main.setZoom(1.5);
    this.cameras.main.startFollow(this.player);
  }

  // =============================================================================
  // DUNGEON GENERATION (BSP ALGORITHM)
  // =============================================================================

  private generateDungeon() {
    const width = GAME_CONFIG.DUNGEON_WIDTH;
    const height = GAME_CONFIG.DUNGEON_HEIGHT;
    
    // Initialize with walls
    this.dungeon = Array(height).fill(null).map(() => Array(width).fill(1));
    
    // Create rooms using simplified BSP
    const rooms = this.generateRooms();
    
    // Carve out rooms
    rooms.forEach(room => {
      for (let y = room.y; y < room.y + room.height; y++) {
        for (let x = room.x; x < room.x + room.width; x++) {
          if (x >= 0 && x < width && y >= 0 && y < height) {
            this.dungeon[y][x] = 0; // Floor
          }
        }
      }
    });
    
    // Connect rooms with corridors
    this.connectRooms(rooms);
    
    // Place stairs in the last room
    const lastRoom = rooms[rooms.length - 1];
    const stairX = lastRoom.x + Math.floor(lastRoom.width / 2);
    const stairY = lastRoom.y + Math.floor(lastRoom.height / 2);
    this.dungeon[stairY][stairX] = 3; // Stairs
    
    console.log('🗺️ Dungeon generated with', rooms.length, 'rooms');
  }

  private generateRooms(): Array<{x: number, y: number, width: number, height: number}> {
    const rooms: Array<{x: number, y: number, width: number, height: number}> = [];
    const numRooms = 3 + Math.floor(Math.random() * 3); // 3-5 rooms
    
    for (let i = 0; i < numRooms; i++) {
      const width = 4 + Math.floor(Math.random() * 4); // 4-7 tiles
      const height = 4 + Math.floor(Math.random() * 4);
      const x = 2 + Math.floor(Math.random() * (GAME_CONFIG.DUNGEON_WIDTH - width - 4));
      const y = 2 + Math.floor(Math.random() * (GAME_CONFIG.DUNGEON_HEIGHT - height - 4));
      
      // Check if room overlaps with existing rooms
      const overlaps = rooms.some(room => 
        x < room.x + room.width + 1 && x + width + 1 > room.x &&
        y < room.y + room.height + 1 && y + height + 1 > room.y
      );
      
      if (!overlaps) {
        rooms.push({ x, y, width, height });
      }
    }
    
    return rooms;
  }

  private connectRooms(rooms: Array<{x: number, y: number, width: number, height: number}>) {
    for (let i = 0; i < rooms.length - 1; i++) {
      const roomA = rooms[i];
      const roomB = rooms[i + 1];
      
      const centerA = {
        x: roomA.x + Math.floor(roomA.width / 2),
        y: roomA.y + Math.floor(roomA.height / 2)
      };
      
      const centerB = {
        x: roomB.x + Math.floor(roomB.width / 2),
        y: roomB.y + Math.floor(roomB.height / 2)
      };
      
      // Create L-shaped corridor
      this.carveCorridor(centerA.x, centerA.y, centerB.x, centerA.y);
      this.carveCorridor(centerB.x, centerA.y, centerB.x, centerB.y);
    }
  }

  private carveCorridor(x1: number, y1: number, x2: number, y2: number) {
    const dx = x2 > x1 ? 1 : -1;
    const dy = y2 > y1 ? 1 : -1;
    
    // Horizontal corridor
    for (let x = x1; x !== x2; x += dx) {
      if (x >= 0 && x < GAME_CONFIG.DUNGEON_WIDTH && y1 >= 0 && y1 < GAME_CONFIG.DUNGEON_HEIGHT) {
        this.dungeon[y1][x] = 0;
      }
    }
    
    // Vertical corridor
    for (let y = y1; y !== y2; y += dy) {
      if (x2 >= 0 && x2 < GAME_CONFIG.DUNGEON_WIDTH && y >= 0 && y < GAME_CONFIG.DUNGEON_HEIGHT) {
        this.dungeon[y][x2] = 0;
      }
    }
  }

  // =============================================================================
  // RENDERING
  // =============================================================================

  private renderDungeon() {
    for (let y = 0; y < this.dungeon.length; y++) {
      for (let x = 0; x < this.dungeon[y].length; x++) {
        const tileType = this.dungeon[y][x];
        const worldX = x * GAME_CONFIG.TILE_SIZE;
        const worldY = y * GAME_CONFIG.TILE_SIZE;
        
        switch (tileType) {
          case 0: // Floor
            this.add.sprite(worldX, worldY, 'floor').setOrigin(0);
            break;
          case 1: // Wall
            this.add.sprite(worldX, worldY, 'wall').setOrigin(0);
            break;
          case 3: // Stairs
            this.add.sprite(worldX, worldY, 'floor').setOrigin(0);
            this.add.sprite(worldX, worldY, 'stairs').setOrigin(0);
            break;
        }
      }
    }
  }

  // =============================================================================
  // PLAYER MANAGEMENT
  // =============================================================================

  private spawnPlayer() {
    // Find first floor tile for spawn
    let spawnX = 0, spawnY = 0;
    
    for (let y = 0; y < this.dungeon.length; y++) {
      for (let x = 0; x < this.dungeon[y].length; x++) {
        if (this.dungeon[y][x] === 0) {
          spawnX = x;
          spawnY = y;
          break;
        }
      }
      if (spawnX > 0) break;
    }
    
    this.playerGridX = spawnX;
    this.playerGridY = spawnY;
    
    this.player = this.add.sprite(
      spawnX * GAME_CONFIG.TILE_SIZE,
      spawnY * GAME_CONFIG.TILE_SIZE,
      'player'
    ).setOrigin(0);
    
    console.log('🚶 Player spawned at', spawnX, spawnY);
  }

  private spawnEntities() {
    // Clear existing entities
    this.monsters.forEach(m => m.destroy());
    this.treasures.forEach(t => t.destroy());
    this.monsters = [];
    this.treasures = [];
    
    // Spawn monsters and treasures on floor tiles
    const floorTiles = [];
    for (let y = 0; y < this.dungeon.length; y++) {
      for (let x = 0; x < this.dungeon[y].length; x++) {
        if (this.dungeon[y][x] === 0 && (x !== this.playerGridX || y !== this.playerGridY)) {
          floorTiles.push({ x, y });
        }
      }
    }
    
    // Spawn 2-4 monsters
    const numMonsters = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numMonsters && floorTiles.length > 0; i++) {
      const tileIndex = Math.floor(Math.random() * floorTiles.length);
      const tile = floorTiles.splice(tileIndex, 1)[0];
      
      const monster = this.add.sprite(
        tile.x * GAME_CONFIG.TILE_SIZE,
        tile.y * GAME_CONFIG.TILE_SIZE,
        'monster'
      ).setOrigin(0);
      
      monster.setData('gridX', tile.x);
      monster.setData('gridY', tile.y);
      monster.setData('stats', this.generateMonsterStats());
      
      this.monsters.push(monster);
    }
    
    // Spawn 1-2 treasure chests
    const numTreasures = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < numTreasures && floorTiles.length > 0; i++) {
      const tileIndex = Math.floor(Math.random() * floorTiles.length);
      const tile = floorTiles.splice(tileIndex, 1)[0];
      
      const treasure = this.add.sprite(
        tile.x * GAME_CONFIG.TILE_SIZE,
        tile.y * GAME_CONFIG.TILE_SIZE,
        'treasure'
      ).setOrigin(0);
      
      treasure.setData('gridX', tile.x);
      treasure.setData('gridY', tile.y);
      treasure.setData('loot', this.generateLoot());
      
      this.treasures.push(treasure);
    }
    
    console.log('👹 Spawned', numMonsters, 'monsters and', numTreasures, 'treasures');
  }

  // =============================================================================
  // INPUT HANDLING
  // =============================================================================

  private setupInput() {
    const cursors = this.input.keyboard?.createCursorKeys();
    const wasd = this.input.keyboard?.addKeys('W,S,A,D');
    
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (this.isMoving || this.inCombat) return;
      
      let deltaX = 0, deltaY = 0;
      
      switch (event.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          deltaY = -1;
          break;
        case 's':
        case 'arrowdown':
          deltaY = 1;
          break;
        case 'a':
        case 'arrowleft':
          deltaX = -1;
          break;
        case 'd':
        case 'arrowright':
          deltaX = 1;
          break;
      }
      
      if (deltaX !== 0 || deltaY !== 0) {
        this.attemptMove(deltaX, deltaY);
      }
    });
  }

  private attemptMove(deltaX: number, deltaY: number) {
    const newX = this.playerGridX + deltaX;
    const newY = this.playerGridY + deltaY;
    
    // Check bounds
    if (newX < 0 || newX >= GAME_CONFIG.DUNGEON_WIDTH || 
        newY < 0 || newY >= GAME_CONFIG.DUNGEON_HEIGHT) {
      return;
    }
    
    // Check for walls
    if (this.dungeon[newY][newX] === 1) {
      return;
    }
    
    // Check for monsters (initiate combat)
    const monster = this.monsters.find(m => 
      m.getData('gridX') === newX && m.getData('gridY') === newY
    );
    
    if (monster) {
      this.initiateCombat(monster);
      return;
    }
    
    // Check for treasures
    const treasure = this.treasures.find(t => 
      t.getData('gridX') === newX && t.getData('gridY') === newY
    );
    
    if (treasure) {
      this.collectTreasure(treasure);
    }
    
    // Check for stairs
    if (this.dungeon[newY][newX] === 3) {
      this.advanceFloor();
      return;
    }
    
    // Move player
    this.movePlayer(newX, newY);
  }

  private movePlayer(newX: number, newY: number) {
    this.isMoving = true;
    this.playerGridX = newX;
    this.playerGridY = newY;
    
    const targetX = newX * GAME_CONFIG.TILE_SIZE;
    const targetY = newY * GAME_CONFIG.TILE_SIZE;
    
    this.tweens.add({
      targets: this.player,
      x: targetX,
      y: targetY,
      duration: GAME_CONFIG.ANIMATION_SPEED,
      ease: 'Power2',
      onComplete: () => {
        this.isMoving = false;
      }
    });
  }

  // =============================================================================
  // GAME MECHANICS
  // =============================================================================

  private generateMonsterStats() {
    const baseLevel = this.currentFloor;
    const levelVariance = Math.floor(Math.random() * 3) - 1; // -1 to +1
    const level = Math.max(1, baseLevel + levelVariance);
    
    return {
      id: `monster_${Date.now()}_${Math.random()}`,
      level,
      name: `Floor ${this.currentFloor} Monster`,
      health: 20 + (level * 10),
      maxHealth: 20 + (level * 10),
      attack: 5 + (level * 3),
      defense: 2 + level,
      experienceReward: level * 20,
      lootTable: [], // Simplified for now
    };
  }

  private generateLoot(): LootItem {
    // Ultra-rare chance for Ancient Satoshi Coin (0.1% chance, only on floor 5+)
    if (this.currentFloor >= 5 && Math.random() < 0.001) {
      return {
        id: `ancient_satoshi_coin_${Date.now()}`,
        name: 'Ancient Satoshi Coin',
        type: 'consumable',
        rarity: 'mythic',
        attackBonus: 0,
        defenseBonus: 0,
        healthBonus: 0,
        description: '🪙 A legendary artifact from the dawn of Bitcoin. Rumored to grant resurrection at the cost of great risk. One-time use only.',
      };
    }

    const rarities: Array<{ rarity: any, weight: number }> = [
      { rarity: 'common', weight: 50 },
      { rarity: 'uncommon', weight: 30 },
      { rarity: 'rare', weight: 15 },
      { rarity: 'epic', weight: 4 },
      { rarity: 'legendary', weight: 1 },
    ];
    
    let totalWeight = rarities.reduce((sum, r) => sum + r.weight, 0);
    let random = Math.random() * totalWeight;
    
    let selectedRarity = 'common';
    for (const rarity of rarities) {
      random -= rarity.weight;
      if (random <= 0) {
        selectedRarity = rarity.rarity;
        break;
      }
    }
    
    const itemTypes = ['weapon', 'armor', 'accessory'];
    const itemType = itemTypes[Math.floor(Math.random() * itemTypes.length)];
    
    return {
      id: `loot_${Date.now()}_${Math.random()}`,
      name: `${selectedRarity} ${itemType}`,
      type: itemType as any,
      rarity: selectedRarity as any,
      attackBonus: itemType === 'weapon' ? 3 + this.currentFloor : 0,
      defenseBonus: itemType === 'armor' ? 2 + this.currentFloor : 0,
      healthBonus: itemType === 'accessory' ? 5 + this.currentFloor : 0,
      description: `A ${selectedRarity} ${itemType} found on floor ${this.currentFloor}`,
    };
  }

  private initiateCombat(monster: Phaser.GameObjects.Sprite) {
    console.log('⚔️ Combat initiated!');
    this.inCombat = true;
    
    const monsterStats = monster.getData('stats');
    // Add grid position to monster stats for combat resolution
    monsterStats.gridX = monster.getData('gridX');
    monsterStats.gridY = monster.getData('gridY');
    
    this.onCombatStart?.(monsterStats);
  }

  private collectTreasure(treasure: Phaser.GameObjects.Sprite) {
    console.log('💰 Treasure collected!');
    
    const loot = treasure.getData('loot');
    this.onTreasureFound?.(loot);
    
    // Remove treasure from scene
    const index = this.treasures.indexOf(treasure);
    if (index > -1) {
      this.treasures.splice(index, 1);
    }
    treasure.destroy();
    
    // TODO: Here we would call the blockchain to mint the NFT
    console.log('🪙 Would mint NFT for:', loot);
  }

  private advanceFloor() {
    console.log('📈 Advancing to next floor!');
    this.currentFloor++;
    
    // Generate new dungeon
    this.generateDungeon();
    
    // Clear scene
    this.children.removeAll();
    
    // Re-render
    this.renderDungeon();
    this.spawnPlayer();
    this.spawnEntities();
    
    this.onFloorAdvance?.(this.currentFloor);
  }

  // =============================================================================
  // PUBLIC API FOR BLOCKCHAIN INTEGRATION
  // =============================================================================

  public setCharacter(character: GameCharacter) {
    this.character = character;
  }

  public setCallbacks(callbacks: {
    onCombatStart?: (monster: Monster) => void;
    onTreasureFound?: (loot: LootItem) => void;
    onFloorAdvance?: (floor: number) => void;
    onPlayerDeath?: () => void;
  }) {
    this.onCombatStart = callbacks.onCombatStart;
    this.onTreasureFound = callbacks.onTreasureFound;
    this.onFloorAdvance = callbacks.onFloorAdvance;
    this.onPlayerDeath = callbacks.onPlayerDeath;
  }

  public endCombat(playerWon: boolean, monsterGridX?: number, monsterGridY?: number) {
    this.inCombat = false;
    
    if (playerWon && monsterGridX !== undefined && monsterGridY !== undefined) {
      // Find and remove defeated monster
      const monsterIndex = this.monsters.findIndex(m => 
        m.getData('gridX') === monsterGridX && m.getData('gridY') === monsterGridY
      );
      
      if (monsterIndex > -1) {
        const monster = this.monsters[monsterIndex];
        this.monsters.splice(monsterIndex, 1);
        monster.destroy();
      }
      
      console.log('✅ Monster defeated!');
    } else {
      console.log('💀 Player defeated!');
      this.onPlayerDeath?.();
    }
  }

  public getCurrentFloor(): number {
    return this.currentFloor;
  }

  public getPlayerPosition(): { x: number, y: number } {
    return { x: this.playerGridX, y: this.playerGridY };
  }
}

// =============================================================================
// PHASER GAME CONFIGURATION
// =============================================================================

export const createPhaserGame = (parent: string | HTMLElement) => {
  // Calculate responsive dimensions
  const parentElement = typeof parent === 'string' ? document.getElementById(parent) : parent;
  const containerWidth = parentElement?.clientWidth || 800;
  const containerHeight = parentElement?.clientHeight || 600;
  
  // Maintain 4:3 aspect ratio while fitting container
  let gameWidth = Math.min(containerWidth, 800);
  let gameHeight = Math.min(containerHeight, 600);
  
  const aspectRatio = 4/3;
  if (gameWidth / gameHeight > aspectRatio) {
    gameWidth = gameHeight * aspectRatio;
  } else {
    gameHeight = gameWidth / aspectRatio;
  }

  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: gameWidth,
    height: gameHeight,
    parent,
    backgroundColor: '#2c1810',
    scene: [BootScene, DungeonScene],
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false
      }
    },
    input: {
      keyboard: true
    },
    render: {
      pixelArt: true,
      antialias: false
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: gameWidth,
      height: gameHeight
    }
  };

  return new Phaser.Game(config);
};

export default createPhaserGame;
