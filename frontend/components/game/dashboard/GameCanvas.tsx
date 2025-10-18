'use client';

import React from 'react';
import PhaserGameScreen from '@/components/game/PhaserGameScreen';
import { Card } from '@/components/ui/card';
import { GameCharacter } from '@/lib/types/game';

interface GameCanvasProps {
  walletAddress: string;
  onGameEnd: (reason: string, character?: GameCharacter) => void;
}

export default function GameCanvas({ walletAddress, onGameEnd }: GameCanvasProps) {
  const handleGameEnd = (reason: string) => {
    const mockCharacter: GameCharacter = {
      id: 'hero-' + Date.now(),
      name: 'Bitcoin Adventurer',
      level: Math.floor(Math.random() * 10) + 1,
      health: 0,
      maxHealth: 100,
      attack: 15 + Math.floor(Math.random() * 10),
      defense: 8 + Math.floor(Math.random() * 5),
      experience: 1250 + Math.floor(Math.random() * 2000),
      experienceToNext: 2500,
      currentFloor: Math.floor(Math.random() * 5) + 1,
      deepestFloor: Math.floor(Math.random() * 8) + 1,
      equipped: [
        {
          id: 'legendary-' + Math.random().toString(36).substr(2, 9),
          name: 'Satoshi\'s Blade',
          type: 'weapon',
          rarity: 'legendary',
          attackBonus: 20,
          description: 'A legendary sword forged from the genesis block itself'
        },
        {
          id: 'rare-' + Math.random().toString(36).substr(2, 9),
          name: 'Blockchain Armor',
          type: 'armor',
          rarity: 'rare',
          defenseBonus: 15,
          description: 'Protective gear enhanced with cryptographic magic'
        }
      ],
      isAlive: false,
      wallet: walletAddress
    };
    onGameEnd(reason, mockCharacter);
  };

  return (
    <Card className="bg-card/80 border-2 border-primary/20 backdrop-blur-sm overflow-hidden h-full">
      <div className="relative w-full h-full min-h-[500px] lg:min-h-[600px] flex items-center justify-center">
        <PhaserGameScreen
          walletAddress={walletAddress}
          onGameEnd={handleGameEnd}
        />
      </div>
    </Card>
  );
}