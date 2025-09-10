/**
 * Core Game Logic for Satoshi's Quest
 * Handles character creation, combat, loot generation, and progression
 * 
 * AI Prompt Used: "Create a TypeScript game engine for a roguelike with character stats,
 * combat system, loot generation, and floor progression. Include methods for character
 * creation, monster generation, combat resolution, and loot drops with rarity system."
 */

import { 
  GameCharacter, 
  LootItem, 
  Monster, 
  DungeonFloor, 
  GameSession,
  LootType,
  LootRarity,
  CombatAction,
  CombatResult,
  DEFAULT_GAME_CONFIG,
  LegacyTombstone
} from '../types/game';

export class GameEngine {
  private config = DEFAULT_GAME_CONFIG;
  private gameSession: GameSession | null = null;

  /**
   * Create a new character for the game
   */
  createCharacter(name: string, wallet?: string): GameCharacter {
    const character: GameCharacter = {
      id: 'char-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      name: name.trim() || 'Anonymous Hero',
      level: 1,
      health: this.config.baseHealthPerLevel,
      maxHealth: this.config.baseHealthPerLevel,
      attack: this.config.baseAttackPerLevel,
      defense: this.config.baseDefensePerLevel,
      experience: 0,
      experienceToNext: 100,
      currentFloor: 1,
      deepestFloor: 1,
      equipped: [],
      isAlive: true,
      wallet
    };

    console.log('🎮 Created new character:', character);
    return character;
  }

  /**
   * Start a new game session
   */
  startGame(character: GameCharacter): GameSession {
    const firstFloor = this.generateFloor(1);
    
    this.gameSession = {
      character,
      currentFloor: firstFloor,
      gameStartTime: Date.now(),
      isInCombat: false,
      combatLog: [`${character.name} enters the depths of Satoshi's dungeon...`],
      inventory: []
    };

    console.log('🎯 Game started:', this.gameSession);
    return this.gameSession;
  }

  /**
   * Generate a dungeon floor with appropriate difficulty
   */
  generateFloor(level: number): DungeonFloor {
    const difficulty = Math.pow(this.config.floorDifficultyScaling, level - 1);
    const monsterCount = Math.min(3 + Math.floor(level / 3), 8);
    const treasureChests = Math.max(1, Math.floor(level / 5) + 1);

    const monsters: Monster[] = [];
    for (let i = 0; i < monsterCount; i++) {
      monsters.push(this.generateMonster(level, difficulty));
    }

    // Generate boss every 5th floor
    let bossMonster: Monster | undefined;
    if (level % 5 === 0) {
      bossMonster = this.generateBossMonster(level, difficulty);
    }

    const floor: DungeonFloor = {
      level,
      description: this.getFloorDescription(level),
      monsters,
      treasureChests,
      bossMonster,
      difficulty
    };

    console.log(`🏰 Generated floor ${level}:`, {
      level,
      difficulty: difficulty.toFixed(2),
      monsterCount,
      treasureChests,
      hasBoss: !!bossMonster
    });

    return floor;
  }

  /**
   * Generate a monster appropriate for the floor level
   */
  private generateMonster(floorLevel: number, difficulty: number): Monster {
    const monsterTypes = [
      'Corrupted Miner', 'Hash Goblin', 'Block Phantom', 'Crypto Wraith',
      'Satoshi Shade', 'Mining Golem', 'Double-Spend Demon', 'Fork Fiend',
      'Consensus Crawler', 'Merkle Mutant'
    ];

    const name = monsterTypes[Math.floor(Math.random() * monsterTypes.length)];
    const level = Math.max(1, floorLevel + Math.floor((Math.random() - 0.5) * 3));
    
    const baseHealth = 15 + (level * 8);
    const baseAttack = 3 + (level * 2);
    const baseDefense = 1 + level;

    const monster: Monster = {
      id: 'monster-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      name,
      level,
      health: Math.floor(baseHealth * difficulty),
      maxHealth: Math.floor(baseHealth * difficulty),
      attack: Math.floor(baseAttack * difficulty),
      defense: Math.floor(baseDefense * difficulty),
      experienceReward: level * 25 + Math.floor(floorLevel * 10),
      lootTable: this.generateLootTable(level, floorLevel)
    };

    return monster;
  }

  /**
   * Generate a boss monster for special floors
   */
  private generateBossMonster(floorLevel: number, difficulty: number): Monster {
    const bossNames = [
      'The Hash Overlord', 'Satoshi\'s Shadow', 'The Double-Spend Dragon',
      'Lord of the Lost Keys', 'The Mining Tyrant', 'Byzantine General',
      'The Blockchain Breaker', 'Merkle Root Guardian'
    ];

    const name = bossNames[Math.floor(Math.random() * bossNames.length)];
    const level = floorLevel + 2;
    
    // Bosses are significantly stronger
    const baseHealth = 40 + (level * 15);
    const baseAttack = 8 + (level * 3);
    const baseDefense = 3 + (level * 2);

    const boss: Monster = {
      id: 'boss-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      name,
      level,
      health: Math.floor(baseHealth * difficulty * 2), // Bosses get 2x health multiplier
      maxHealth: Math.floor(baseHealth * difficulty * 2),
      attack: Math.floor(baseAttack * difficulty * 1.5),
      defense: Math.floor(baseDefense * difficulty * 1.5),
      experienceReward: level * 100 + Math.floor(floorLevel * 50),
      lootTable: this.generateBossLootTable(level, floorLevel)
    };

    return boss;
  }

  /**
   * Generate loot table for regular monsters
   */
  private generateLootTable(monsterLevel: number, floorLevel: number) {
    const lootTable = [];
    
    // Higher level monsters drop better loot
    const rarityBonus = Math.floor(floorLevel / 10);
    
    if (Math.random() < 0.7) { // 70% chance to drop something
      const item = this.generateLootItem(monsterLevel, floorLevel, rarityBonus);
      lootTable.push({
        item,
        dropChance: 0.7
      });
    }

    return lootTable;
  }

  /**
   * Generate enhanced loot table for boss monsters
   */
  private generateBossLootTable(monsterLevel: number, floorLevel: number) {
    const lootTable = [];
    
    // Bosses always drop loot and have better rarity chances
    const rarityBonus = Math.floor(floorLevel / 5) + 1;
    
    // Guaranteed drop
    const guaranteedItem = this.generateLootItem(monsterLevel, floorLevel, rarityBonus);
    lootTable.push({
      item: guaranteedItem,
      dropChance: 1.0
    });

    // Chance for Ancient Satoshi Coin (sBTC resurrection item)
    if (floorLevel >= 10 && Math.random() < this.config.ancientCoinDropRate * 2) { // Doubled chance for bosses
      const ancientCoin = this.generateAncientSatoshiCoin();
      lootTable.push({
        item: ancientCoin,
        dropChance: this.config.ancientCoinDropRate * 2
      });
    }

    return lootTable;
  }

  /**
   * Generate a loot item with appropriate stats and rarity
   */
  generateLootItem(itemLevel: number, floorLevel: number, rarityBonus: number = 0): LootItem {
    const rarity = this.determineLootRarity(rarityBonus);
    const itemType = this.getRandomLootType();
    const itemName = this.generateItemName(itemType, rarity);

    // Calculate item bonuses based on level and rarity
    const rarityMultiplier = this.getRarityMultiplier(rarity);
    const baseBonus = Math.max(1, Math.floor(itemLevel / 3)) * rarityMultiplier;

    let attackBonus = 0;
    let defenseBonus = 0;
    let healthBonus = 0;

    switch (itemType) {
      case 'weapon':
        attackBonus = Math.floor(baseBonus * (1.5 + Math.random() * 0.5));
        break;
      case 'armor':
        defenseBonus = Math.floor(baseBonus * (1.2 + Math.random() * 0.3));
        healthBonus = Math.floor(baseBonus * 5);
        break;
      case 'accessory':
        // Accessories provide balanced bonuses
        attackBonus = Math.floor(baseBonus * 0.7);
        defenseBonus = Math.floor(baseBonus * 0.7);
        healthBonus = Math.floor(baseBonus * 3);
        break;
    }

    const lootItem: LootItem = {
      id: 'loot-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      name: itemName,
      type: itemType,
      rarity,
      attackBonus: attackBonus > 0 ? attackBonus : undefined,
      defenseBonus: defenseBonus > 0 ? defenseBonus : undefined,
      healthBonus: healthBonus > 0 ? healthBonus : undefined,
      description: this.generateItemDescription(itemName, itemType, rarity)
    };

    return lootItem;
  }

  /**
   * Generate the ultra-rare Ancient Satoshi Coin for sBTC resurrection
   */
  private generateAncientSatoshiCoin(): LootItem {
    return {
      id: 'ancient-coin-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      name: 'Ancient Satoshi Coin',
      type: 'ancient-coin',
      rarity: 'mythic',
      description: 'A legendary coin bearing the mark of Satoshi himself. When activated upon death, it offers a chance at resurrection... for a price. The coin whispers of second chances, but demands true Bitcoin as tribute.',
      metadata: 'sbtc-resurrection-item'
    };
  }

  /**
   * Determine loot rarity based on chance and bonuses
   */
  private determineLootRarity(rarityBonus: number): LootRarity {
    const roll = Math.random();
    const rates = this.config.lootDropRates;

    // Apply rarity bonus by slightly increasing chances of higher rarities
    const bonusMultiplier = 1 + (rarityBonus * 0.1);

    if (roll < rates.legendary * bonusMultiplier) return 'legendary';
    if (roll < (rates.legendary + rates.epic) * bonusMultiplier) return 'epic';
    if (roll < (rates.legendary + rates.epic + rates.rare) * bonusMultiplier) return 'rare';
    if (roll < (rates.legendary + rates.epic + rates.rare + rates.uncommon)) return 'uncommon';
    return 'common';
  }

  /**
   * Get random loot type (excluding special items)
   */
  private getRandomLootType(): LootType {
    const types: LootType[] = ['weapon', 'armor', 'accessory'];
    return types[Math.floor(Math.random() * types.length)];
  }

  /**
   * Get multiplier based on rarity
   */
  private getRarityMultiplier(rarity: LootRarity): number {
    const multipliers = {
      common: 1,
      uncommon: 1.5,
      rare: 2.2,
      epic: 3.5,
      legendary: 5.5,
      mythic: 10
    };
    return multipliers[rarity];
  }

  /**
   * Generate item name based on type and rarity
   */
  private generateItemName(type: LootType, rarity: LootRarity): string {
    const prefixes = {
      common: ['Basic', 'Simple', 'Worn'],
      uncommon: ['Sturdy', 'Enhanced', 'Improved'],
      rare: ['Superior', 'Masterwork', 'Enchanted'],
      epic: ['Legendary', 'Heroic', 'Divine'],
      legendary: ['Satoshi\'s', 'Ancient', 'Godlike'],
      mythic: ['Primordial', 'Creator\'s', 'Genesis']
    };

    const weaponNames = ['Sword', 'Axe', 'Mace', 'Dagger', 'Staff', 'Bow'];
    const armorNames = ['Chestplate', 'Shield', 'Helmet', 'Gauntlets', 'Boots'];
    const accessoryNames = ['Ring', 'Amulet', 'Cloak', 'Belt', 'Bracers'];

    let baseName: string;
    switch (type) {
      case 'weapon':
        baseName = weaponNames[Math.floor(Math.random() * weaponNames.length)];
        break;
      case 'armor':
        baseName = armorNames[Math.floor(Math.random() * armorNames.length)];
        break;
      case 'accessory':
        baseName = accessoryNames[Math.floor(Math.random() * accessoryNames.length)];
        break;
      default:
        baseName = 'Item';
    }

    const prefix = prefixes[rarity][Math.floor(Math.random() * prefixes[rarity].length)];
    return `${prefix} ${baseName}`;
  }

  /**
   * Generate item description
   */
  private generateItemDescription(name: string, type: LootType, rarity: LootRarity): string {
    const descriptions = {
      weapon: [
        'A deadly blade forged in the fires of the blockchain.',
        'This weapon has tasted the blood of many crypto creatures.',
        'Crackling with digital energy, it seeks its next victim.'
      ],
      armor: [
        'Sturdy protection against the dangers of the deep dungeons.',
        'This armor has saved many heroes from an early grave.',
        'Enchanted with protective blockchain magic.'
      ],
      accessory: [
        'A mystical item that enhances the wearer\'s abilities.',
        'This artifact pulses with ancient Bitcoin energy.',
        'Blessed by the spirits of early adopters.'
      ]
    };

    const typeDescriptions = descriptions[type as keyof typeof descriptions] || descriptions.accessory;
    return typeDescriptions[Math.floor(Math.random() * typeDescriptions.length)];
  }

  /**
   * Get floor description based on level
   */
  private getFloorDescription(level: number): string {
    const descriptions = [
      `Floor ${level}: The entrance caverns, filled with the echoes of mining rigs.`,
      `Floor ${level}: Deeper corridors where failed transactions go to die.`,
      `Floor ${level}: The halls of lost keys, littered with forgotten wallets.`,
      `Floor ${level}: Ancient chambers where the first blocks were mined.`,
      `Floor ${level}: The depths where Satoshi's secrets are hidden.`,
      `Floor ${level}: Primordial vaults that predate the genesis block.`,
      `Floor ${level}: The core of the blockchain itself, reality becomes uncertain.`,
      `Floor ${level}: Beyond comprehension, where code becomes consciousness.`
    ];

    const index = Math.min(level - 1, descriptions.length - 1);
    return descriptions[index];
  }

  /**
   * Perform combat action and return result
   */
  performCombat(action: CombatAction): CombatResult {
    if (!this.gameSession || !this.gameSession.currentMonster) {
      throw new Error('No active combat session');
    }

    const { character } = this.gameSession;
    const monster = this.gameSession.currentMonster;

    let result: CombatResult;

    switch (action.type) {
      case 'ATTACK':
        result = this.resolveAttack(character, monster);
        break;
      case 'DEFEND':
        result = this.resolveDefend(character, monster);
        break;
      case 'USE_ITEM':
        if (action.item) {
          result = this.useItem(character, action.item);
        } else {
          throw new Error('No item specified for USE_ITEM action');
        }
        break;
      case 'FLEE':
        result = this.attemptFlee(character, monster);
        break;
      default:
        throw new Error('Unknown combat action');
    }

    // Add to combat log
    this.gameSession.combatLog.push(result.message);

    // Check if monster died
    if (monster.health <= 0) {
      this.handleMonsterDeath(monster);
    }

    // Check if character died
    if (character.health <= 0) {
      this.handleCharacterDeath();
    }

    return result;
  }

  /**
   * Resolve attack action
   */
  private resolveAttack(character: GameCharacter, monster: Monster): CombatResult {
    // Calculate character's total attack (base + equipment bonuses)
    const totalAttack = character.attack + this.calculateEquipmentBonus(character, 'attack');
    const totalDefense = character.defense + this.calculateEquipmentBonus(character, 'defense');

    // Calculate damage to monster
    const damage = Math.max(1, totalAttack - monster.defense + Math.floor(Math.random() * 5));
    const critical = Math.random() < 0.1; // 10% crit chance
    const finalDamage = critical ? Math.floor(damage * 1.5) : damage;

    monster.health = Math.max(0, monster.health - finalDamage);

    let message = `${character.name} attacks ${monster.name} for ${finalDamage} damage!`;
    if (critical) message += ' Critical hit!';

    // Monster counter-attack if still alive
    if (monster.health > 0) {
      const monsterDamage = Math.max(1, monster.attack - totalDefense + Math.floor(Math.random() * 3));
      character.health = Math.max(0, character.health - monsterDamage);
      message += ` ${monster.name} strikes back for ${monsterDamage} damage!`;
    }

    return {
      damage: finalDamage,
      critical,
      blocked: false,
      message,
      healthRemaining: monster.health
    };
  }

  /**
   * Resolve defend action
   */
  private resolveDefend(character: GameCharacter, monster: Monster): CombatResult {
    const totalDefense = character.defense + this.calculateEquipmentBonus(character, 'defense');
    
    // Defending reduces incoming damage and provides small heal
    const defendBonus = Math.floor(totalDefense * 0.5);
    const healAmount = Math.floor(character.maxHealth * 0.05);
    character.health = Math.min(character.maxHealth, character.health + healAmount);

    // Monster attack with reduced damage
    const monsterDamage = Math.max(1, monster.attack - (totalDefense + defendBonus));
    character.health = Math.max(0, character.health - monsterDamage);

    const message = `${character.name} defends, reducing damage and recovering ${healAmount} health. ${monster.name} attacks for ${monsterDamage} damage!`;

    return {
      damage: 0,
      critical: false,
      blocked: true,
      message,
      healthRemaining: character.health
    };
  }

  /**
   * Use an item during combat
   */
  private useItem(character: GameCharacter, item: LootItem): CombatResult {
    // For now, we'll implement health potions
    // In a full implementation, we'd have various consumable items
    const healAmount = 20; // Fixed heal for demo
    character.health = Math.min(character.maxHealth, character.health + healAmount);

    const message = `${character.name} uses ${item.name} and recovers ${healAmount} health!`;

    return {
      damage: 0,
      critical: false,
      blocked: false,
      message,
      healthRemaining: character.health
    };
  }

  /**
   * Attempt to flee from combat
   */
  private attemptFlee(character: GameCharacter, monster: Monster): CombatResult {
    const fleeChance = 0.7; // 70% base flee chance
    const success = Math.random() < fleeChance;

    if (success) {
      this.gameSession!.isInCombat = false;
      this.gameSession!.currentMonster = undefined;
      
      return {
        damage: 0,
        critical: false,
        blocked: false,
        message: `${character.name} successfully escapes from ${monster.name}!`,
        healthRemaining: character.health
      };
    } else {
      // Failed flee, monster gets free attack
      const damage = Math.max(1, monster.attack);
      character.health = Math.max(0, character.health - damage);
      
      return {
        damage,
        critical: false,
        blocked: false,
        message: `${character.name} fails to escape! ${monster.name} attacks for ${damage} damage!`,
        healthRemaining: character.health
      };
    }
  }

  /**
   * Calculate equipment bonus for a specific stat
   */
  private calculateEquipmentBonus(character: GameCharacter, stat: 'attack' | 'defense' | 'health'): number {
    return character.equipped.reduce((total, item) => {
      switch (stat) {
        case 'attack':
          return total + (item.attackBonus || 0);
        case 'defense':
          return total + (item.defenseBonus || 0);
        case 'health':
          return total + (item.healthBonus || 0);
        default:
          return total;
      }
    }, 0);
  }

  /**
   * Handle monster death - award experience and loot
   */
  private handleMonsterDeath(monster: Monster): void {
    if (!this.gameSession) return;

    const { character } = this.gameSession;
    
    // Award experience
    character.experience += monster.experienceReward;
    this.gameSession.combatLog.push(`${character.name} gains ${monster.experienceReward} experience!`);

    // Check for level up
    this.checkLevelUp(character);

    // Roll for loot drops
    monster.lootTable.forEach(({ item, dropChance }) => {
      if (Math.random() < dropChance) {
        this.gameSession!.inventory.push(item);
        this.gameSession!.combatLog.push(`${character.name} found ${item.name}!`);
      }
    });

    // End combat
    this.gameSession.isInCombat = false;
    this.gameSession.currentMonster = undefined;
  }

  /**
   * Check if character should level up
   */
  private checkLevelUp(character: GameCharacter): void {
    while (character.experience >= character.experienceToNext) {
      character.experience -= character.experienceToNext;
      character.level++;
      
      // Increase stats
      const healthIncrease = this.config.baseHealthPerLevel;
      const attackIncrease = this.config.baseAttackPerLevel;
      const defenseIncrease = this.config.baseDefensePerLevel;
      
      character.maxHealth += healthIncrease;
      character.health += healthIncrease; // Level up heals you
      character.attack += attackIncrease;
      character.defense += defenseIncrease;
      
      // Calculate next level requirement
      character.experienceToNext = Math.floor(100 * Math.pow(this.config.experienceMultiplier, character.level - 1));
      
      this.gameSession!.combatLog.push(`🎉 ${character.name} reached level ${character.level}!`);
      console.log(`🆙 Character leveled up:`, {
        level: character.level,
        health: character.health,
        attack: character.attack,
        defense: character.defense,
        nextLevelExp: character.experienceToNext
      });
    }
  }

  /**
   * Handle character death - this is where blockchain integration happens!
   */
  private handleCharacterDeath(): void {
    if (!this.gameSession) return;

    const { character } = this.gameSession;
    character.isAlive = false;
    
    this.gameSession.combatLog.push(`💀 ${character.name} has fallen...`);
    
    console.log('💀 Character death event:', {
      character: character.name,
      level: character.level,
      floor: character.currentFloor,
      equippedItems: character.equipped.length,
      wallet: character.wallet
    });

    // This will trigger the blockchain death process in the UI
  }

  /**
   * Create a legacy tombstone from a dead character
   */
  createLegacyTombstone(character: GameCharacter, deathCause: string): LegacyTombstone {
    const playTime = this.gameSession ? Date.now() - this.gameSession.gameStartTime : 0;
    const finalScore = this.calculateFinalScore(character, playTime);

    const tombstone: LegacyTombstone = {
      characterName: character.name,
      finalLevel: character.level,
      deepestFloor: character.deepestFloor,
      totalExperience: character.experience,
      playTime,
      deathCause,
      finalScore,
      equippedItems: [...character.equipped],
      burnedItems: [...character.equipped], // All equipped items are burned
      timestamp: Date.now()
    };

    console.log('🪦 Legacy tombstone created:', tombstone);
    return tombstone;
  }

  /**
   * Calculate final score for leaderboard
   */
  private calculateFinalScore(character: GameCharacter, playTime: number): number {
    const baseScore = character.level * 1000;
    const floorBonus = character.deepestFloor * 500;
    const expBonus = character.experience;
    const timeBonus = Math.max(0, 10000 - Math.floor(playTime / 1000)); // Bonus for faster completion
    const equipmentBonus = character.equipped.length * 200;

    return baseScore + floorBonus + expBonus + timeBonus + equipmentBonus;
  }

  /**
   * Get current game session
   */
  getCurrentSession(): GameSession | null {
    return this.gameSession;
  }

  /**
   * Advance to next floor
   */
  advanceFloor(): DungeonFloor {
    if (!this.gameSession) throw new Error('No active game session');

    const { character } = this.gameSession;
    character.currentFloor++;
    character.deepestFloor = Math.max(character.deepestFloor, character.currentFloor);

    const nextFloor = this.generateFloor(character.currentFloor);
    this.gameSession.currentFloor = nextFloor;

    this.gameSession.combatLog.push(`🔽 ${character.name} descends to floor ${character.currentFloor}...`);
    
    return nextFloor;
  }

  /**
   * Start combat with a monster
   */
  startCombat(monster: Monster): void {
    if (!this.gameSession) throw new Error('No active game session');

    this.gameSession.isInCombat = true;
    this.gameSession.currentMonster = { ...monster }; // Create a copy
    
    this.gameSession.combatLog.push(`⚔️ ${this.gameSession.character.name} encounters ${monster.name}!`);
  }

  /**
   * Equip an item to character
   */
  equipItem(character: GameCharacter, item: LootItem): boolean {
    // For simplicity, allow unlimited equipment in this demo
    // In a full game, you'd have equipment slots
    character.equipped.push(item);
    
    // Apply health bonus immediately
    if (item.healthBonus) {
      character.maxHealth += item.healthBonus;
      character.health = Math.min(character.health + item.healthBonus, character.maxHealth);
    }

    console.log(`⚙️ ${character.name} equipped ${item.name}`);
    return true;
  }
}

// Export singleton instance
export const gameEngine = new GameEngine();
export default gameEngine;
