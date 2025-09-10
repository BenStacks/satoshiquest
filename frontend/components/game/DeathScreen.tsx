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
  AlertTriangle
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LegacyTombstone, GameCharacter, LootItem } from '@/lib/types/game';
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
  const [countdown, setCountdown] = useState(10); // 10 second window to decide

  // Check for Ancient Satoshi Coin in inventory
  const hasAncientCoin = character.equipped.some(item => item.type === 'ancient-coin');
  const ancientCoin = character.equipped.find(item => item.type === 'ancient-coin');

  useEffect(() => {
    loadWalletData();
    
    if (hasAncientCoin) {
      calculateResurrectionCost();
      
      // Start countdown timer
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
      
      // Base cost of $10 USD, increases with floor depth
      const cost = await diaOracleService.calculateResurrectionCost(
        character.currentFloor, 
        10 // $10 base cost
      );
      
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
          ? '✨ The Ancient Satoshi Coin glows with power! You have been resurrected!' 
          : result.error || 'The coin crumbles to dust... resurrection failed.',
        txId: result.txId
      });

      if (result.success) {
        // Successful resurrection - restore character
        setTimeout(() => {
          onResurrection?.();
        }, 3000);
      } else {
        // Failed resurrection - create tombstone
        setTimeout(() => {
          handleCreateTombstone();
        }, 3000);
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

  // Show resurrection result
  if (resurrectionResult) {
    return (
      <div className="w-full max-w-2xl mx-auto space-y-6">
        <Card className="text-center">
          <CardHeader>
            <CardTitle className={`text-2xl ${resurrectionResult.success ? 'text-green-600' : 'text-red-600'}`}>
              {resurrectionResult.success ? '✨ Resurrection Successful!' : '💀 Resurrection Failed'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg">{resurrectionResult.message}</p>
            
            {resurrectionResult.txId && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">Transaction ID:</p>
                <p className="text-xs font-mono break-all">{resurrectionResult.txId}</p>
              </div>
            )}
            
            <div className="text-sm text-muted-foreground">
              {resurrectionResult.success 
                ? 'Returning to the dungeon...' 
                : 'Creating your legacy tombstone...'}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show resurrection option if Ancient Coin is available
  if (showResurrection && hasAncientCoin && resurrectionCost && countdown > 0) {
    return (
      <div className="w-full max-w-2xl mx-auto space-y-6">
        <Card className="border-yellow-300 bg-yellow-50">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-yellow-800 flex items-center justify-center gap-2">
              <Zap className="w-6 h-6" />
              Ancient Satoshi Coin Activated!
            </CardTitle>
            <CardDescription className="text-yellow-700">
              The coin whispers of second chances... but at a price.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Countdown Timer */}
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-800 mb-2">{countdown}</div>
              <div className="text-sm text-yellow-700">seconds to decide</div>
              <Progress value={(countdown / 10) * 100} className="mt-2" />
            </div>

            <Separator />

            {/* Resurrection Details */}
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="font-bold text-lg mb-2">Resurrection Gamble</h3>
                <p className="text-sm text-muted-foreground">
                  Sacrifice {diaOracleService.formatSatoshisToBtc(resurrectionCost.sbtcAmount)} sBTC 
                  (≈${resurrectionCost.usdValue.toFixed(2)}) for a 50% chance at resurrection
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                  <div className="font-bold text-green-800">50% Success</div>
                  <div className="text-sm text-green-600">Resurrect with full health</div>
                  <div className="text-xs text-green-500">sBTC returned</div>
                </div>
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-center">
                  <div className="font-bold text-red-800">50% Failure</div>
                  <div className="text-sm text-red-600">Permanent death</div>
                  <div className="text-xs text-red-500">sBTC lost forever</div>
                </div>
              </div>

              {/* Current sBTC Balance */}
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Your sBTC Balance:</span>
                  <span className="font-mono">{sbtcBalance} sBTC</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Required:</span>
                  <span className="font-mono">{diaOracleService.formatSatoshisToBtc(resurrectionCost.sbtcAmount)} sBTC</span>
                </div>
              </div>

              {/* Cost Scaling Info */}
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Resurrection cost increases by {((resurrectionCost.costMultiplier - 1) * 100).toFixed(0)}% 
                  due to floor depth. The deeper you go, the higher the stakes.
                </AlertDescription>
              </Alert>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button 
                  onClick={attemptResurrection}
                  disabled={isAttemptingResurrection || isCalculatingCost}
                  className="w-full bg-yellow-600 hover:bg-yellow-700"
                  size="lg"
                >
                  {isAttemptingResurrection ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Rolling the Dice...
                    </>
                  ) : (
                    <>
                      <Bitcoin className="w-4 h-4 mr-2" />
                      Gamble {diaOracleService.formatSatoshisToBtc(resurrectionCost.sbtcAmount)} sBTC
                    </>
                  )}
                </Button>
                
                <Button 
                  onClick={handleSkipResurrection}
                  variant="outline"
                  className="w-full"
                >
                  <Skull className="w-4 h-4 mr-2" />
                  Accept Death
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default death screen
  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card className="border-red-300 bg-red-50">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl text-red-800 flex items-center justify-center gap-2">
            <Skull className="w-8 h-8" />
            You Have Fallen
          </CardTitle>
          <CardDescription className="text-red-700 text-lg">
            {deathCause}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Character Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-blue-600">{character.level}</div>
              <div className="text-sm text-muted-foreground">Level</div>
            </div>
            <div className="p-3 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-purple-600">{character.deepestFloor}</div>
              <div className="text-sm text-muted-foreground">Deepest Floor</div>
            </div>
            <div className="p-3 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-green-600">{character.equipped.length}</div>
              <div className="text-sm text-muted-foreground">Items Lost</div>
            </div>
            <div className="p-3 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-orange-600">{finalScore.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Final Score</div>
            </div>
          </div>

          {/* Equipped Items Lost */}
          {character.equipped.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-bold text-red-800 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Items Lost Forever
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {character.equipped.map((item, index) => (
                  <div key={index} className="p-2 bg-white border border-red-200 rounded flex justify-between items-center">
                    <span className="text-sm font-medium">{item.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {item.rarity}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Legacy Options */}
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="font-bold text-lg mb-2">Your Legacy Awaits</h3>
              <p className="text-sm text-muted-foreground">
                Your achievements will be immortalized on the Bitcoin blockchain forever.
              </p>
            </div>

            <div className="space-y-2">
              <Button 
                onClick={handleCreateTombstone}
                className="w-full bg-gray-600 hover:bg-gray-700"
                size="lg"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Create Legacy Tombstone NFT
              </Button>
              
              <Button 
                onClick={onNewGame}
                variant="outline"
                className="w-full"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Start New Quest
              </Button>
            </div>
          </div>

          {/* Blockchain Info */}
          <Alert>
            <Coins className="h-4 w-4" />
            <AlertDescription>
              <strong>Phase 1 Demo:</strong> In the full version, your equipped items would be burned as NFTs, 
              and your tombstone would be minted as a permanent record on the Bitcoin blockchain.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
