'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import WalletDropdown from '@/components/wallet/WalletDropdown';
import { Bitcoin, LogOut, Home } from 'lucide-react';
import { WalletConnectionResult } from '@/lib/services/wallet-service';

interface GameHeaderProps {
  walletData: WalletConnectionResult;
  onExit: () => void;
}

export default function GameHeader({ walletData, onExit }: GameHeaderProps) {
  const handleDisconnect = () => {
    // Clear session storage when disconnecting
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('satoshiquest_wallet');
    }
    onExit();
  };

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border/50">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between max-w-[2000px] mx-auto">
          {/* Left - Branding */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Bitcoin className="w-8 h-8 text-primary" />
                <div className="absolute -inset-1 bg-primary/20 rounded-full blur-sm -z-10"></div>
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-lg font-bold game-title">Satoshi's Quest</span>
                <span className="text-xs text-muted-foreground">In the Dungeon</span>
              </div>
            </div>
          </div>

          {/* Right - Wallet & Actions */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <WalletDropdown walletData={walletData} onDisconnect={handleDisconnect} />
            <Button
              variant="outline"
              onClick={onExit}
              className="gap-2"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Exit</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}