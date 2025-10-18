'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Skull,
  Coins,
  Zap,
  ArrowRight,
  Bitcoin,
  Timer,
  TrendingUp,
  Package,
  AlertTriangle,
  Trophy,
  Flame
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GameCharacter } from '@/lib/types/game';
import { walletService } from '@/lib/services/wallet-service';
import { diaOracleService } from '@/lib/services/dia-oracle';

interface DeathScreenProps {
  character: GameCharacter;
  deathCause: string;
  onResurrection?: () => void;
  onCreateTombstone?: () => void;
  onNewGame?: () => void;
}

export default function DeathScreen({
  character,
  deathCause,
  onResurrection,
  onCreateTombstone,
  onNewGame
}: DeathScreenProps) {
  const [showResurrection, setShowResurrection] = useState(false);
  const [resurrectionCost, setResurrectionCost] = useState<{
    sbtcAmount: number;
    usdValue: number;
    costMultiplier: number;
  } | null>(null);
  const [isCalculatingCost, setIsCalculatingCost] = useState(false);
  const [isAttemptingResurrection, setIsAttemptingResurrection] = useState(false);
  const [resurrectionResult, setResurrectionResult] = useState<{
    success: boolean;
    message: string;
    txId?: string;
  } | null>(null);
  const [sbtcBalance, setSbtcBalance] = useState<string>('0');
  const [countdown, setCountdown] = useState(10);

  const hasAncientCoin = character.equipped.some(item => item.type === 'ancient-coin');
  const ancientCoin = character.equipped.find(item => item.type === 'ancient-coin');

  useEffect(() => {
    loadWalletData();

    if (hasAncientCoin) {
      calculateResurrectionCost();

      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSkipResurrection();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [hasAncientCoin]);

  const loadWalletData = async () => {
    try {
      const balance = await walletService.getSbtcBalance();
      setSbtcBalance(walletService.formatBalance(balance, 'SBTC'));
    } catch (error) {
      console.error('Failed to load sBTC balance:', error);
    }
  };

  const calculateResurrectionCost = async () => {
    try {
      setIsCalculatingCost(true);
      const cost = await diaOracleService.calculateResurrectionCost(character.currentFloor, 10);
      setResurrectionCost(cost);
      setShowResurrection(true);
    } catch (error) {
      console.error('Failed to calculate resurrection cost:', error);
    } finally {
      setIsCalculatingCost(false);
    }
  };

  const attemptResurrection = async () => {
    if (!resurrectionCost || !ancientCoin) return;

    try {
      setIsAttemptingResurrection(true);

      console.log('🎲 Attempting sBTC resurrection...', {
        cost: resurrectionCost.sbtcAmount,
        character: character.name,
        floor: character.currentFloor
      });

      const result = await walletService.attemptResurrection(resurrectionCost.sbtcAmount);

      setResurrectionResult({
        success: result.success,
        message: result.success
          ? 'The Ancient Satoshi Coin glows with divine power! You have been resurrected!'
          : result.error || 'The coin crumbles to dust... resurrection failed.',
        txId: result.txId
      });

      if (result.success) {
        setTimeout(() => onResurrection?.(), 3000);
      } else {
        setTimeout(() => handleCreateTombstone(), 3000);
      }

    } catch (error) {
      console.error('Resurrection attempt failed:', error);
      setResurrectionResult({
        success: false,
        message: 'Resurrection attempt failed: ' + (error instanceof Error ? error.message : 'Unknown error')
      });
    } finally {
      setIsAttemptingResurrection(false);
    }
  };

  const handleSkipResurrection = () => {
    setShowResurrection(false);
    handleCreateTombstone();
  };

  const handleCreateTombstone = () => {
    console.log('🪦 Creating legacy tombstone...');
    onCreateTombstone?.();
  };

  const calculateFinalScore = (): number => {
    const baseScore = character.level * 1000;
    const floorBonus = character.deepestFloor * 500;
    const expBonus = character.experience;
    const equipmentBonus = character.equipped.length * 200;
    return baseScore + floorBonus + expBonus + equipmentBonus;
  };

  const finalScore = calculateFinalScore();

  // Resurrection Result Screen
  if (resurrectionResult) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className={`w-full max-w-2xl border-2 ${resurrectionResult.success ? 'border-green-500/50 bg-green-50 dark:bg-green-950/20' : 'border-red-500/50 bg-red-50 dark:bg-red-950/20'}`}>
          <CardHeader className="text-center pb-4">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center bg-card">
              {resurrectionResult.success ? (
                <Zap className="w-12 h-12 text-green-500" />
              ) : (
                <Skull className="w-12 h-12 text-red-500" />
              )}
            </div>
            <CardTitle className={`text-3xl font-bold ${resurrectionResult.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {resurrectionResult.success ? '✨ Resurrection Successful!' : '💀 Resurrection Failed'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-lg text-center leading-relaxed">{resurrectionResult.message}</p>

            {resurrectionResult.txId && (
              <div className="bg-muted/50 border border-border rounded-lg p-4">
                <p className="text-sm font-semibold mb-2">Transaction ID:</p>
                <p className="text-xs font-mono break-all text-muted-foreground">{resurrectionResult.txId}</p>
              </div>
            )}

            <div className="text-center">
              <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
                {resurrectionResult.success
                  ? 'Returning to the dungeon...'
                  : 'Creating your legacy tombstone...'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Resurrection Gamble Screen
  if (showResurrection && hasAncientCoin && resurrectionCost && countdown > 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-3xl border-2 border-yellow-500/50 bg-card">
          <CardHeader className="text-center pb-4">
            <div className="w-20 h-20 mx-auto mb-4 bg-yellow-500/20 rounded-full flex items-center justify-center">
              <Zap className="w-12 h-12 text-yellow-500 animate-pulse" />
            </div>
            <CardTitle className="text-3xl font-bold game-title">
              Ancient Satoshi Coin Activated!
            </CardTitle>
            <CardDescription className="text-lg">
              The coin whispers of second chances... but at a price.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Countdown Timer */}
            <div className="bg-muted/30 border border-border rounded-xl p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Timer className="w-5 h-5 text-yellow-500" />
                <span className="text-sm font-medium text-muted-foreground">Time to Decide</span>
              </div>
              <div className="text-6xl font-bold text-yellow-500 mb-3">{countdown}</div>
              <Progress value={(countdown / 10) * 100} className="h-2" />
            </div>

            {/* Resurrection Details */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Success Card */}
              <div className="bg-green-50 dark:bg-green-950/30 border-2 border-green-500/30 rounded-xl p-5 text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-green-500/20 rounded-full flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-green-500" />
                </div>
                <div className="font-bold text-lg text-green-700 dark:text-green-400 mb-1">47% Success</div>
                <div className="text-sm text-green-600 dark:text-green-500 space-y-1">
                  <div>✓ Resurrect with full health</div>
                  <div>✓ sBTC returned + bonus</div>
                  <div>✓ Continue your quest</div>
                </div>
              </div>

              {/* Failure Card */}
              <div className="bg-red-50 dark:bg-red-950/30 border-2 border-red-500/30 rounded-xl p-5 text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-red-500/20 rounded-full flex items-center justify-center">
                  <Flame className="w-6 h-6 text-red-500" />
                </div>
                <div className="font-bold text-lg text-red-700 dark:text-red-400 mb-1">53% Failure</div>
                <div className="text-sm text-red-600 dark:text-red-500 space-y-1">
                  <div>× Permanent death</div>
                  <div>× sBTC lost forever</div>
                  <div>× Legacy tombstone created</div>
                </div>
              </div>
            </div>

            {/* Cost Information */}
            <div className="bg-muted/30 border border-border rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Resurrection Cost:</span>
                <span className="text-lg font-bold font-mono">
                  {diaOracleService.formatSatoshisToBtc(resurrectionCost.sbtcAmount)} sBTC
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">USD Value:</span>
                <span className="font-mono text-muted-foreground">${resurrectionCost.usdValue.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Your Balance:</span>
                <span className="font-mono">{sbtcBalance} sBTC</span>
              </div>
            </div>

            {/* Warning Alert */}
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Cost increased by {((resurrectionCost.costMultiplier - 1) * 100).toFixed(0)}% due to floor depth.
                The deeper you venture, the higher the stakes for resurrection.
              </AlertDescription>
            </Alert>

            {/* Action Buttons */}
            <div className="grid gap-3">
              <Button
                onClick={attemptResurrection}
                disabled={isAttemptingResurrection || isCalculatingCost}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold text-lg py-6"
                size="lg"
              >
                {isAttemptingResurrection ? (
                  <>
                    <div className="w-5 h-5 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Rolling the Dice...
                  </>
                ) : (
                  <>
                    <Bitcoin className="w-5 h-5 mr-2" />
                    Gamble {diaOracleService.formatSatoshisToBtc(resurrectionCost.sbtcAmount)} sBTC
                  </>
                )}
              </Button>

              <Button
                onClick={handleSkipResurrection}
                variant="outline"
                className="w-full"
                size="lg"
              >
                <Skull className="w-5 h-5 mr-2" />
                Accept Death & Create Legacy
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default Death Screen
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-3xl border-2 border-red-500/50 bg-card">
        <CardHeader className="text-center pb-4">
          <div className="w-20 h-20 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
            <Skull className="w-12 h-12 text-red-500" />
          </div>
          <CardTitle className="text-4xl font-bold game-title text-red-600 dark:text-red-400">
            You Have Fallen
          </CardTitle>
          <CardDescription className="text-lg">
            {deathCause}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Character Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: character.level, label: 'Level', color: 'blue' },
              { value: character.deepestFloor, label: 'Deepest Floor', color: 'purple' },
              { value: character.equipped.length, label: 'Items Lost', color: 'red' },
              { value: finalScore.toLocaleString(), label: 'Final Score', color: 'orange' }
            ].map((stat, i) => (
              <div key={i} className="bg-muted/30 border border-border rounded-lg p-4 text-center">
                <div className={`text-3xl font-bold text-${stat.color}-500 mb-1`}>{stat.value}</div>
                <div className="text-xs text-muted-foreground font-medium">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Equipped Items Lost */}
          {character.equipped.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Flame className="w-5 h-5 text-red-500" />
                  Items Burned Forever
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {character.equipped.map((item, index) => (
                    <div key={index} className="bg-muted/30 border border-red-500/30 rounded-lg p-3 flex justify-between items-center">
                      <span className="font-medium">{item.name}</span>
                      <Badge variant="secondary" className={`text-xs capitalize ${
                        item.rarity === 'legendary' ? 'bg-orange-500/20 text-orange-700' :
                        item.rarity === 'rare' ? 'bg-purple-500/20 text-purple-700' :
                        'bg-blue-500/20 text-blue-700'
                      }`}>
                        {item.rarity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Legacy Options */}
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <h3 className="font-bold text-xl game-title">Your Legacy Awaits</h3>
              <p className="text-muted-foreground">
                Your achievements will be immortalized on the Bitcoin blockchain forever.
              </p>
            </div>

            <div className="grid gap-3">
              <Button
                onClick={handleCreateTombstone}
                className="w-full bg-primary hover:bg-primary/90 font-bold text-lg py-6"
                size="lg"
              >
                <TrendingUp className="w-5 h-5 mr-2" />
                Create Legacy Tombstone NFT
              </Button>

              <Button
                onClick={onNewGame}
                variant="outline"
                className="w-full"
                size="lg"
              >
                <ArrowRight className="w-5 h-5 mr-2" />
                Start New Quest
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}