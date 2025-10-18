'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import GameDashboard from '@/components/game/dashboard/GameDashboard';
import { WalletConnectionResult, walletService } from '@/lib/services/wallet-service';
import { GameCharacter } from '@/lib/types/game';

export default function GamePage() {
  const router = useRouter();
  const [walletData, setWalletData] = useState<WalletConnectionResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    try {
      // First check session storage for wallet data
      if (typeof window !== 'undefined') {
        const storedWallet = sessionStorage.getItem('satoshiquest_wallet');
        if (storedWallet) {
          const wallet = JSON.parse(storedWallet) as WalletConnectionResult;
          setWalletData(wallet);
          setIsLoading(false);
          return;
        }
      }

      // Fallback to wallet service if session storage is empty
      const wallet = await walletService.getCurrentWalletData();
      if (!wallet) {
        router.push('/');
        return;
      }
      setWalletData(wallet);

      // Store in session storage for future use
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('satoshiquest_wallet', JSON.stringify(wallet));
      }
    } catch (error) {
      console.error('Wallet check failed:', error);
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGameEnd = (reason: string, character?: GameCharacter) => {
    if (reason === 'death' && character) {
      router.push(`/game/death?characterId=${character.id}`);
    }
  };

  const handleExitGame = () => {
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading game...</p>
        </div>
      </div>
    );
  }

  if (!walletData) {
    return null;
  }

  return (
    <GameDashboard
      walletData={walletData}
      onGameEnd={handleGameEnd}
      onExit={handleExitGame}
    />
  );
}