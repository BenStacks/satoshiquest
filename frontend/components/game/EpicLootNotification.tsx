/**
 * EPIC LOOT NOTIFICATION COMPONENT
 * =============================================================================
 * 
 * Special notification system for rare and mythic loot finds.
 * Creates dramatic, memorable moments when players discover 
 * valuable items like the Ancient Satoshi Coin.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Zap, Sparkles } from 'lucide-react';
import { LootItem } from '@/lib/types/game';
import { getRarityColor, getRarityDisplayName } from '@/lib/utils/rarity-colors';

interface EpicLootNotificationProps {
  loot: LootItem | null;
  onClose: () => void;
  duration?: number; // in milliseconds
}

export default function EpicLootNotification({ 
  loot, 
  onClose, 
  duration = 5000 
}: EpicLootNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (loot && (loot.rarity === 'legendary' || loot.rarity === 'mythic')) {
      setIsVisible(true);
      setIsAnimating(true);
      
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setTimeout(() => {
          setIsVisible(false);
          onClose();
        }, 500); // Allow fade out animation
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [loot, onClose, duration]);

  if (!isVisible || !loot) return null;

  const rarityStyle = getRarityColor(loot.rarity);
  const isAncientCoin = loot.name === 'Ancient Satoshi Coin';

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 transition-opacity duration-500 ${
      isAnimating ? 'opacity-100' : 'opacity-0'
    }`}>
      <Card className={`
        max-w-md w-full mx-4 p-6 text-center 
        ${rarityStyle.bg} ${rarityStyle.border} ${rarityStyle.glow}
        transform transition-all duration-700 ease-out
        ${isAnimating ? 'scale-100 rotate-0' : 'scale-95 rotate-1'}
      `}>
        <div className="space-y-4">
          {/* Epic Header */}
          <div className="space-y-2">
            {isAncientCoin ? (
              <div className="text-6xl animate-bounce">🪙</div>
            ) : (
              <div className="flex justify-center">
                <Star className="w-12 h-12 text-yellow-500 animate-pulse" />
              </div>
            )}
            
            <Badge className={`
              ${rarityStyle.badge} text-white px-3 py-1 text-sm font-bold tracking-wider
              ${loot.rarity === 'mythic' ? 'animate-pulse' : ''}
            `}>
              {getRarityDisplayName(loot.rarity)} FIND!
            </Badge>
          </div>

          {/* Item Name */}
          <h2 className={`text-2xl font-bold ${rarityStyle.text}`}>
            {loot.name}
          </h2>

          {/* Special Message for Ancient Coin */}
          {isAncientCoin && (
            <div className="space-y-2">
              <div className="flex justify-center space-x-1">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                <Zap className="w-5 h-5 text-orange-500" />
                <Sparkles className="w-5 h-5 text-yellow-500" />
              </div>
              <p className="text-sm font-medium text-yellow-800">
                You have discovered a legendary artifact!
              </p>
              <p className="text-xs text-yellow-700">
                This ancient coin can be used to gamble sBTC for resurrection when you die.
              </p>
            </div>
          )}

          {/* Description */}
          <p className={`text-sm ${rarityStyle.text} opacity-80`}>
            {loot.description}
          </p>

          {/* Closing instruction */}
          <p className="text-xs text-gray-600 mt-4">
            Click anywhere to continue...
          </p>
        </div>
      </Card>
    </div>
  );
}
