/**
 * Rarity color system for loot items
 * Provides consistent visual hierarchy for different item rarities
 */

import { LootRarity } from '@/lib/types/game';

export const RARITY_COLORS: Record<LootRarity, { 
  bg: string; 
  border: string; 
  text: string; 
  badge: string;
  glow?: string;
}> = {
  common: {
    bg: 'bg-gray-100',
    border: 'border-gray-300',
    text: 'text-gray-700',
    badge: 'bg-gray-500'
  },
  uncommon: {
    bg: 'bg-green-50',
    border: 'border-green-300',
    text: 'text-green-700',
    badge: 'bg-green-500'
  },
  rare: {
    bg: 'bg-blue-50',
    border: 'border-blue-300',
    text: 'text-blue-700',
    badge: 'bg-blue-500'
  },
  epic: {
    bg: 'bg-purple-50',
    border: 'border-purple-300',
    text: 'text-purple-700',
    badge: 'bg-purple-500'
  },
  legendary: {
    bg: 'bg-orange-50',
    border: 'border-orange-300',
    text: 'text-orange-700',
    badge: 'bg-orange-500'
  },
  mythic: {
    bg: 'bg-gradient-to-br from-yellow-50 to-orange-50',
    border: 'border-yellow-400 border-2',
    text: 'text-yellow-800 font-bold',
    badge: 'bg-gradient-to-r from-yellow-500 to-orange-500',
    glow: 'shadow-lg shadow-yellow-400/50'
  }
};

export const getRarityColor = (rarity: LootRarity) => {
  return RARITY_COLORS[rarity] || RARITY_COLORS.common;
};

export const getRarityDisplayName = (rarity: LootRarity): string => {
  const names: Record<LootRarity, string> = {
    common: 'Common',
    uncommon: 'Uncommon', 
    rare: 'Rare',
    epic: 'Epic',
    legendary: 'Legendary',
    mythic: 'MYTHIC' // All caps for impact
  };
  return names[rarity] || 'Common';
};
