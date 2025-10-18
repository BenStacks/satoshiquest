'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Heart,
  Zap,
  Target,
  TrendingUp,
  Coins,
  Bitcoin,
  Sword,
  Shield,
  Star,
  MapPin,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { WalletConnectionResult, walletService } from '@/lib/services/wallet-service';

interface GameSidebarProps {
  walletData: WalletConnectionResult;
}

export default function GameSidebar({ walletData }: GameSidebarProps) {
  const [stxBalance, setStxBalance] = useState<string>('Loading...');
  const [sbtcBalance, setSbtcBalance] = useState<string>('Loading...');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadBalances();
  }, []);

  const loadBalances = async () => {
    try {
      setIsRefreshing(true);
      const stxBal = await walletService.getStxBalance();
      setStxBalance(walletService.formatBalance(stxBal, 'STX'));
      const sbtcBal = await walletService.getSbtcBalance();
      setSbtcBalance(walletService.formatBalance(sbtcBal, 'SBTC'));
    } catch (error) {
      console.error('Failed to load balances:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Character Stats */}
      <Card className="bg-card/80 border border-blue-500/30 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Sword className="w-4 h-4 text-blue-500" />
              Character
            </CardTitle>
            <Badge variant="outline" className="text-xs">Level 1</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pb-4">
          {/* Health */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-red-500" />
                <span className="font-medium">Health</span>
              </div>
              <span className="font-mono text-green-500">100/100</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>

          {/* Floor */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-purple-500" />
              <span className="font-medium">Current Floor</span>
            </div>
            <span className="font-mono font-bold">1</span>
          </div>

          {/* Attack */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-orange-500" />
              <span className="font-medium">Attack</span>
            </div>
            <span className="font-mono">10</span>
          </div>

          {/* Defense */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-blue-500" />
              <span className="font-medium">Defense</span>
            </div>
            <span className="font-mono">5</span>
          </div>

          <Separator />

          {/* XP */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-yellow-500" />
                <span className="font-medium">Experience</span>
              </div>
              <span className="font-mono text-xs">0/100</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-yellow-500 rounded-full" style={{ width: '0%' }}></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wallet Balances */}
      <Card className="bg-card/80 border border-primary/30 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Coins className="w-4 h-4 text-primary" />
              Wallet
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadBalances}
              disabled={isRefreshing}
              className="h-7 w-7 p-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pb-4">
          <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                <span className="text-xs font-semibold text-orange-800 dark:text-orange-300">STX</span>
              </div>
              <Badge variant="outline" className="text-[10px] h-5">Stacks</Badge>
            </div>
            <div className="font-mono text-sm font-bold text-orange-900 dark:text-orange-200">
              {isRefreshing ? '...' : stxBalance}
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <Bitcoin className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400" />
                <span className="text-xs font-semibold text-yellow-800 dark:text-yellow-300">sBTC</span>
              </div>
              <Badge variant="outline" className="text-[10px] h-5">Bitcoin</Badge>
            </div>
            <div className="font-mono text-sm font-bold text-yellow-900 dark:text-yellow-200">
              {isRefreshing ? '...' : sbtcBalance}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Controls Guide */}
      <Card className="bg-card/80 border border-purple-500/30 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Target className="w-4 h-4 text-purple-500" />
            Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pb-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Movement</span>
            <Badge variant="secondary" className="text-[10px] font-mono">WASD</Badge>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Attack</span>
            <Badge variant="secondary" className="text-[10px]">Move into enemy</Badge>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Collect Loot</span>
            <Badge variant="secondary" className="text-[10px]">Move into treasure</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Pro Tips */}
      <Card className="bg-card/80 border border-yellow-500/30 backdrop-blur-sm flex-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-500" />
            Pro Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5 pb-4">
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2.5">
            <p className="text-[11px] leading-relaxed">
              <strong className="text-yellow-600 dark:text-yellow-400">Ancient Satoshi Coins</strong> enable resurrection attempts with real Bitcoin. Ultra-rare!
            </p>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2.5">
            <p className="text-[11px] leading-relaxed">
              <strong className="text-blue-600 dark:text-blue-400">Legendary items</strong> are extremely valuable. Protect them at all costs!
            </p>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2.5">
            <p className="text-[11px] leading-relaxed">
              <strong className="text-red-600 dark:text-red-400">Death is permanent.</strong> All equipped items will be burned forever.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}