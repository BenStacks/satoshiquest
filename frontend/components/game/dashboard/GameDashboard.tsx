'use client';

import React from 'react';
import GameHeader from './GameHeader';
import GameCanvas from './GameCanvas';
import GameSidebar from './GameSidebar';
import { WalletConnectionResult } from '@/lib/services/wallet-service';
import { GameCharacter } from '@/lib/types/game';

interface GameDashboardProps {
  walletData: WalletConnectionResult;
  onGameEnd: (reason: string, character?: GameCharacter) => void;
  onExit: () => void;
}

export default function GameDashboard({ walletData, onGameEnd, onExit }: GameDashboardProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Game Header */}
      <GameHeader walletData={walletData} onExit={onExit} />

      {/* Main Game Area */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col lg:flex-row gap-6 p-6 max-w-[2000px] mx-auto w-full">
          {/* Game Canvas - Takes majority of space */}
          <div className="flex-1 min-w-0">
            <GameCanvas
              walletAddress={walletData.address}
              onGameEnd={onGameEnd}
            />
          </div>

          {/* Sidebar - Game info and controls */}
          <div className="lg:w-80 xl:w-96 flex-shrink-0">
            <GameSidebar walletData={walletData} />
          </div>
        </div>
      </div>
    </div>
  );
}