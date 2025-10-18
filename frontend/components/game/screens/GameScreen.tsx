'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Sword,
  Shield,
  Heart,
  Star,
  ArrowDown,
  Coins,
  Package,
  Zap,
  TrendingUp,
  Flame,
  Skull
} from 'lucide-react';
import {
  GameSession,
  Monster,
  LootItem,
  CombatAction,
  LootRarity
} from '@/lib/types/game';
import { gameEngine } from '@/lib/game/engine';

interface GameScreenProps {
  walletAddress: string;
  onGameEnd?: (reason: string) => void;
}

export default function GameScreen({ walletAddress, onGameEnd }: GameScreenProps) {
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [currentMonster, setCurrentMonster] = useState<Monster | null>(null);
  const [combatLog, setCombatLog] = useState<string[]>([]);
  const [selectedAction, setSelectedAction] = useState<CombatAction['type'] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showInventory, setShowInventory] = useState(false);

  useEffect(() => {
    startNewGame();
  }, []);

  const startNewGame = () => {
    const character = gameEngine.createCharacter('Hero of Bitcoin', walletAddress);
    const session = gameEngine.startGame(character);
    setGameSession(session);
    setCombatLog(session.combatLog);
  };

  const exploreFloor = () => {
    if (!gameSession) return;
    const { currentFloor } = gameSession;
    const monsters = [...currentFloor.monsters];

    if (monsters.length > 0) {
      const randomMonster = monsters[Math.floor(Math.random() * monsters.length)];
      gameEngine.startCombat(randomMonster);
      setCurrentMonster(randomMonster);
      const updatedSession = gameEngine.getCurrentSession()!;
      setGameSession(updatedSession);
      setCombatLog(updatedSession.combatLog);
    } else {
      const newLog = [...combatLog, `Floor ${currentFloor.level} cleared! Ready to descend.`];
      setCombatLog(newLog);
    }
  };

  const performCombatAction = async (actionType: CombatAction['type']) => {
    if (!gameSession || !currentMonster || isProcessing) return;

    try {
      setIsProcessing(true);
      setSelectedAction(actionType);
      const action: CombatAction = { type: actionType };
      gameEngine.performCombat(action);
      const updatedSession = gameEngine.getCurrentSession()!;
      setGameSession(updatedSession);
      setCombatLog(updatedSession.combatLog);

      if (!updatedSession.isInCombat) {
        setCurrentMonster(null);
        if (!updatedSession.character.isAlive) {
          handleCharacterDeath();
        }
      }
    } catch (error) {
      console.error('Combat action failed:', error);
    } finally {
      setIsProcessing(false);
      setSelectedAction(null);
    }
  };

  const handleCharacterDeath = () => {
    if (!gameSession) return;
    const tombstone = gameEngine.createLegacyTombstone(gameSession.character, 'Slain in combat');
    console.log('🪦 Tombstone created:', tombstone);
    onGameEnd?.('death');
  };

  const descendFloor = () => {
    if (!gameSession) return;
    gameEngine.advanceFloor();
    const updatedSession = gameEngine.getCurrentSession()!;
    setGameSession(updatedSession);
    setCombatLog(updatedSession.combatLog);
  };

  const equipItem = (item: LootItem) => {
    if (!gameSession) return;
    gameEngine.equipItem(gameSession.character, item);
    const updatedInventory = gameSession.inventory.filter(i => i.id !== item.id);
    const updatedSession = { ...gameSession, inventory: updatedInventory };
    setGameSession(updatedSession);
    setCombatLog([...combatLog, `⚙️ Equipped ${item.name}`]);
  };

  const getRarityColor = (rarity: LootRarity): string => {
    const colors = {
      common: 'border-gray-500/30 bg-gray-500/10',
      uncommon: 'border-green-500/30 bg-green-500/10',
      rare: 'border-blue-500/30 bg-blue-500/10',
      epic: 'border-purple-500/30 bg-purple-500/10',
      legendary: 'border-orange-500/30 bg-orange-500/10',
      mythic: 'border-red-500/30 bg-red-500/10'
    };
    return colors[rarity];
  };

  const formatItemBonus = (item: LootItem): string => {
    const bonuses = [];
    if (item.attackBonus) bonuses.push(`+${item.attackBonus} ATK`);
    if (item.defenseBonus) bonuses.push(`+${item.defenseBonus} DEF`);
    if (item.healthBonus) bonuses.push(`+${item.healthBonus} HP`);
    return bonuses.join(' • ') || 'No bonuses';
  };

  if (!gameSession) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="flex items-center justify-center p-12">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Initializing game...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { character, currentFloor, isInCombat, inventory } = gameSession;
  const healthPercent = (character.health / character.maxHealth) * 100;
  const expPercent = (character.experience / character.experienceToNext) * 100;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4">
      {/* Compact Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Character Card */}
        <Card className="border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm truncate">{character.name}</h3>
                <p className="text-xs text-muted-foreground">Level {character.level} • Floor {character.currentFloor}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Heart className="w-3 h-3 text-red-500" />
                <Progress value={healthPercent} className="h-1.5 flex-1" />
                <span className="text-xs font-mono">{character.health}/{character.maxHealth}</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-3 h-3 text-blue-500" />
                <Progress value={expPercent} className="h-1.5 flex-1" />
                <span className="text-xs font-mono">{character.experience}/{character.experienceToNext}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Combat Stats */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted-foreground">Combat Stats</span>
              <Badge variant="outline" className="text-xs">Active</Badge>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 bg-orange-500/10 rounded-lg border border-orange-500/20">
                <Sword className="w-4 h-4 text-orange-500 mx-auto mb-1" />
                <div className="text-lg font-bold">{character.attack}</div>
                <div className="text-xs text-muted-foreground">ATK</div>
              </div>
              <div className="text-center p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <Shield className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                <div className="text-lg font-bold">{character.defense}</div>
                <div className="text-xs text-muted-foreground">DEF</div>
              </div>
              <div className="text-center p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <Package className="w-4 h-4 text-purple-500 mx-auto mb-1" />
                <div className="text-lg font-bold">{inventory.length}</div>
                <div className="text-xs text-muted-foreground">Items</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Inventory */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted-foreground">Inventory</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowInventory(!showInventory)}
                className="h-6 text-xs"
              >
                {showInventory ? 'Hide' : 'Show'}
              </Button>
            </div>
            {inventory.length > 0 ? (
              <div className="space-y-1">
                {inventory.slice(0, 2).map((item) => (
                  <div key={item.id} className={`p-2 rounded border text-xs ${getRarityColor(item.rarity)}`}>
                    <div className="flex justify-between items-center">
                      <span className="font-medium truncate">{item.name}</span>
                      <Badge variant="secondary" className="text-xs ml-2">{item.rarity}</Badge>
                    </div>
                  </div>
                ))}
                {inventory.length > 2 && (
                  <p className="text-xs text-center text-muted-foreground pt-1">+{inventory.length - 2} more</p>
                )}
              </div>
            ) : (
              <p className="text-xs text-center text-muted-foreground py-2">No items yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Expanded Inventory */}
      {showInventory && inventory.length > 0 && (
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">All Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {inventory.map((item) => (
                <div key={item.id} className={`p-3 border rounded-lg ${getRarityColor(item.rarity)}`}>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-xs">{item.name}</h4>
                    <Badge variant="secondary" className="text-xs">{item.rarity}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{formatItemBonus(item)}</p>
                  <Button size="sm" onClick={() => equipItem(item)} className="w-full h-7 text-xs">
                    Equip
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Game Area */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
        {/* Combat/Exploration */}
        <div className="lg:col-span-3 space-y-3">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ArrowDown className="w-5 h-5 text-primary" />
                    Floor {currentFloor.level}
                  </CardTitle>
                  <CardDescription className="text-xs">{currentFloor.description}</CardDescription>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {currentFloor.monsters.length} enemies
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {!isInCombat ? (
                <div className="space-y-3">
                  <div className="p-4 bg-muted/30 rounded-lg border text-center">
                    <Zap className="w-8 h-8 text-primary mx-auto mb-2" />
                    <p className="text-sm font-medium mb-1">Ready to explore</p>
                    <p className="text-xs text-muted-foreground">
                      {currentFloor.monsters.length > 0
                        ? `${currentFloor.monsters.length} monsters lurking...`
                        : 'Floor cleared! Descend deeper.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={exploreFloor}
                      disabled={currentFloor.monsters.length === 0}
                      className="h-10"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Explore
                    </Button>
                    <Button
                      onClick={descendFloor}
                      variant="secondary"
                      disabled={currentFloor.monsters.length > 0}
                      className="h-10"
                    >
                      <ArrowDown className="w-4 h-4 mr-2" />
                      Descend
                    </Button>
                  </div>
                </div>
              ) : currentMonster && (
                <div className="space-y-3">
                  {/* Monster Card */}
                  <div className="p-4 bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20 rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                        <Skull className="w-6 h-6 text-red-500" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-sm text-red-900 dark:text-red-100">
                          {currentMonster.name}
                        </h3>
                        <p className="text-xs text-red-700 dark:text-red-300">
                          Level {currentMonster.level}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Heart className="w-3 h-3 text-red-500" />
                      <Progress
                        value={(currentMonster.health / currentMonster.maxHealth) * 100}
                        className="h-2 flex-1"
                      />
                      <span className="text-xs font-mono">{currentMonster.health}/{currentMonster.maxHealth}</span>
                    </div>
                    <div className="flex gap-2 text-xs">
                      <Badge variant="outline" className="text-xs">
                        <Sword className="w-3 h-3 mr-1" />
                        {currentMonster.attack} ATK
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <Shield className="w-3 h-3 mr-1" />
                        {currentMonster.defense} DEF
                      </Badge>
                    </div>
                  </div>

                  {/* Combat Actions */}
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      onClick={() => performCombatAction('ATTACK')}
                      disabled={isProcessing}
                      variant={selectedAction === 'ATTACK' ? 'default' : 'outline'}
                      className="h-16 flex-col"
                    >
                      <Sword className="w-5 h-5 mb-1" />
                      <span className="text-xs">Attack</span>
                    </Button>
                    <Button
                      onClick={() => performCombatAction('DEFEND')}
                      disabled={isProcessing}
                      variant={selectedAction === 'DEFEND' ? 'default' : 'outline'}
                      className="h-16 flex-col"
                    >
                      <Shield className="w-5 h-5 mb-1" />
                      <span className="text-xs">Defend</span>
                    </Button>
                    <Button
                      onClick={() => performCombatAction('FLEE')}
                      disabled={isProcessing}
                      variant={selectedAction === 'FLEE' ? 'destructive' : 'outline'}
                      className="h-16 flex-col"
                    >
                      <Flame className="w-5 h-5 mb-1" />
                      <span className="text-xs">Flee</span>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info Alert */}
          <Alert className="border-primary/20 bg-primary/5">
            <Coins className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Demo:</strong> Core gameplay live. Full NFT and sBTC integration coming soon.
            </AlertDescription>
          </Alert>
        </div>

        {/* Combat Log */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Adventure Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96 overflow-y-auto bg-black/90 rounded-lg p-3 border border-green-500/20">
              <div className="space-y-1 text-xs font-mono text-green-400">
                {combatLog.map((message, index) => (
                  <div key={index} className="leading-relaxed hover:text-green-300 transition-colors">
                    <span className="text-green-600 mr-2">&gt;</span>
                    {message}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
