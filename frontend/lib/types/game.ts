/**
 * Core game types for Satoshi's Quest
 * Defines the structure for characters, loot, dungeons, and blockchain interactions
 */

export interface GameCharacter {
  id: string;
  name: string;
  level: number;
  health: number;
  maxHealth: number;
  attack: number;
  defense: number;
  experience: number;
  experienceToNext: number;
  currentFloor: number;
  deepestFloor: number;
  equipped: LootItem[];
  isAlive: boolean;
  wallet?: string;
}

export interface LootItem {
  id: string;
  name: string;
  type: LootType;
  rarity: LootRarity;
  attackBonus?: number;
  defenseBonus?: number;
  healthBonus?: number;
  description: string;
  nftId?: string; // On-chain NFT ID when minted
  metadata?: string;
}

export type LootType = 
  | 'weapon' 
  | 'armor' 
  | 'accessory' 
  | 'consumable' 
  | 'ancient-coin'; // Special sBTC resurrection item

export type LootRarity = 
  | 'common' 
  | 'uncommon' 
  | 'rare' 
  | 'epic' 
  | 'legendary' 
  | 'mythic'; // Ancient Satoshi Coins

export interface Monster {
  id: string;
  name: string;
  level: number;
  health: number;
  maxHealth: number;
  attack: number;
  defense: number;
  experienceReward: number;
  lootTable: LootDrop[];
  gridX?: number;
  gridY?: number;
}

export interface LootDrop {
  item: LootItem;
  dropChance: number; // 0-1
}

export interface DungeonFloor {
  level: number;
  description: string;
  monsters: Monster[];
  treasureChests: number;
  bossMonster?: Monster;
  difficulty: number;
}

export interface GameSession {
  character: GameCharacter;
  currentFloor: DungeonFloor;
  gameStartTime: number;
  isInCombat: boolean;
  currentMonster?: Monster;
  combatLog: string[];
  inventory: LootItem[];
}

export interface LegacyTombstone {
  characterName: string;
  finalLevel: number;
  deepestFloor: number;
  totalExperience: number;
  playTime: number;
  deathCause: string;
  finalScore: number;
  equippedItems: LootItem[];
  burnedItems: LootItem[];
  timestamp: number;
  nftId?: string; // Tombstone NFT ID
  txId?: string; // Death transaction ID
}

export interface ResurrectionAttempt {
  characterId: string;
  sbtcAmount: number; // In satoshis
  outcome: 'success' | 'failure' | 'pending';
  randomValue?: number;
  txId?: string;
  timestamp: number;
}

// Game Actions for blockchain integration
export interface GameAction {
  type: 'MINT_LOOT' | 'BURN_LOOT' | 'CREATE_TOMBSTONE' | 'RESURRECT_ATTEMPT';
  payload: any;
  requiresWallet: boolean;
  requiresConfirmation: boolean;
}

// Combat system
export interface CombatAction {
  type: 'ATTACK' | 'DEFEND' | 'USE_ITEM' | 'FLEE';
  target?: 'player' | 'monster';
  item?: LootItem;
}

export interface CombatResult {
  damage: number;
  critical: boolean;
  blocked: boolean;
  message: string;
  healthRemaining: number;
  statusEffect?: string;
}

// Game statistics
export interface GameStats {
  totalPlayTime: number;
  charactersCreated: number;
  deepestFloorReached: number;
  monstersDefeated: number;
  lootFound: number;
  resurrectionAttempts: number;
  successfulResurrections: number;
  totalSbtcSpent: number;
}

// Blockchain state
export interface BlockchainGameState {
  playerAddress: string;
  ownedLoot: LootItem[];
  tombstones: LegacyTombstone[];
  resurrectionHistory: ResurrectionAttempt[];
  totalSbtcBalance: number;
  totalStxBalance: number;
}

export interface GameConfig {
  baseHealthPerLevel: number;
  baseAttackPerLevel: number;
  baseDefensePerLevel: number;
  experienceMultiplier: number;
  lootDropRates: Record<LootRarity, number>;
  floorDifficultyScaling: number;
  resurrectionBaseCost: number; // Base sBTC cost in satoshis
  ancientCoinDropRate: number;
}

// Default game configuration
export const DEFAULT_GAME_CONFIG: GameConfig = {
  baseHealthPerLevel: 20,
  baseAttackPerLevel: 3,
  baseDefensePerLevel: 2,
  experienceMultiplier: 1.5,
  lootDropRates: {
    common: 0.6,
    uncommon: 0.25,
    rare: 0.1,
    epic: 0.04,
    legendary: 0.009,
    mythic: 0.001 // Ancient Satoshi Coins
  },
  floorDifficultyScaling: 1.3,
  resurrectionBaseCost: 1000000, // 0.01 BTC in satoshis
  ancientCoinDropRate: 0.005 // 0.5% chance per treasure chest
};

// UI State types
export interface GameUIState {
  currentScene: 'menu' | 'character-creation' | 'dungeon' | 'combat' | 'inventory' | 'death' | 'resurrection';
  showInventory: boolean;
  showCharacterStats: boolean;
  showGameMenu: boolean;
  notifications: GameNotification[];
  isLoading: boolean;
  error?: string;
}

export interface GameNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: number;
  autoClose?: boolean;
  action?: {
    label: string;
    callback: () => void;
  };
}

// Wallet integration types
export interface WalletState {
  isConnected: boolean;
  address?: string;
  network: 'mainnet' | 'testnet';
  stxBalance: number;
  sbtcBalance: number;
  isLoading: boolean;
  error?: string;
}

export interface GameTransaction {
  id: string;
  type: 'mint-loot' | 'burn-loot' | 'create-tombstone' | 'resurrect';
  status: 'pending' | 'confirmed' | 'failed';
  txId?: string;
  blockHeight?: number;
  timestamp: number;
  description: string;
  data: any;
}
