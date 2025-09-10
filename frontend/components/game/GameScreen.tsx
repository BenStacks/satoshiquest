'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Sword, 
  Shield, 
  Heart, 
  Star, 
  ArrowDown, 
  Skull, 
  Coins,
  Package,
  Zap,
  TrendingUp
} from 'lucide-react';
import { 
  GameCharacter, 
  GameSession, 
  Monster, 
  LootItem, 
  CombatAction,
  LootRarity 
} from '@/lib/types/game';
import { gameEngine } from '@/lib/game/engine';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

  // Initialize game on component mount
  useEffect(() => {
    startNewGame();
  }, []);

  const startNewGame = () => {
    console.log('🎮 Starting new Satoshi\'s Quest game...');
    
    const character = gameEngine.createCharacter('Hero of Bitcoin', walletAddress);
    const session = gameEngine.startGame(character);
    
    setGameSession(session);
    setCombatLog(session.combatLog);
    
    console.log('✅ Game started:', session);
  };

  const exploreFloor = () => {
    if (!gameSession) return;

    const { currentFloor } = gameSession;
    const monsters = [...currentFloor.monsters];
    
    if (monsters.length > 0) {
      // Random encounter with a monster
      const randomMonster = monsters[Math.floor(Math.random() * monsters.length)];
      gameEngine.startCombat(randomMonster);
      setCurrentMonster(randomMonster);
      
      const updatedSession = gameEngine.getCurrentSession()!;
      setGameSession(updatedSession);
      setCombatLog(updatedSession.combatLog);
    } else {
      // No monsters left, can advance floor
      const newLog = [...combatLog, `Floor ${currentFloor.level} cleared! Ready to descend deeper...`];
      setCombatLog(newLog);
    }
  };

  const performCombatAction = async (actionType: CombatAction['type']) => {
    if (!gameSession || !currentMonster || isProcessing) return;

    try {
      setIsProcessing(true);
      setSelectedAction(actionType);

      const action: CombatAction = { type: actionType };
      const result = gameEngine.performCombat(action);
      
      const updatedSession = gameEngine.getCurrentSession()!;
      setGameSession(updatedSession);
      setCombatLog(updatedSession.combatLog);

      // Check if combat ended
      if (!updatedSession.isInCombat) {
        setCurrentMonster(null);
        
        // Check if character died
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

    console.log('💀 Character has died!');
    const tombstone = gameEngine.createLegacyTombstone(
      gameSession.character, 
      'Slain in combat'
    );
    
    console.log('🪦 Tombstone created:', tombstone);
    onGameEnd?.('death');
  };

  const descendFloor = () => {
    if (!gameSession) return;

    const nextFloor = gameEngine.advanceFloor();
    const updatedSession = gameEngine.getCurrentSession()!;
    
    setGameSession(updatedSession);
    setCombatLog(updatedSession.combatLog);
  };

  const equipItem = (item: LootItem) => {
    if (!gameSession) return;

    gameEngine.equipItem(gameSession.character, item);
    
    // Remove from inventory and update session
    const updatedInventory = gameSession.inventory.filter(i => i.id !== item.id);
    const updatedSession = { ...gameSession, inventory: updatedInventory };
    
    setGameSession(updatedSession);
    setCombatLog([...combatLog, `⚙️ Equipped ${item.name}`]);
  };

  const getRarityColor = (rarity: LootRarity): string => {
    const colors = {
      common: 'bg-gray-100 text-gray-800 border-gray-300',
      uncommon: 'bg-green-100 text-green-800 border-green-300',
      rare: 'bg-blue-100 text-blue-800 border-blue-300',
      epic: 'bg-purple-100 text-purple-800 border-purple-300',
      legendary: 'bg-orange-100 text-orange-800 border-orange-300',
      mythic: 'bg-red-100 text-red-800 border-red-300'
    };
    return colors[rarity];
  };

  const formatItemBonus = (item: LootItem): string => {
    const bonuses = [];
    if (item.attackBonus) bonuses.push(`+${item.attackBonus} ATK`);
    if (item.defenseBonus) bonuses.push(`+${item.defenseBonus} DEF`);
    if (item.healthBonus) bonuses.push(`+${item.healthBonus} HP`);
    return bonuses.join(', ') || 'No bonuses';
  };

  if (!gameSession) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-current border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p>Initializing Satoshi's Quest...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { character, currentFloor, isInCombat, inventory } = gameSession;
  const healthPercent = (character.health / character.maxHealth) * 100;
  const expPercent = (character.experience / character.experienceToNext) * 100;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Character Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Star className="w-5 h-5" />
              {character.name}
            </CardTitle>
            <CardDescription>Level {character.level} Hero</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-1">
                  <Heart className="w-4 h-4 text-red-500" />
                  Health
                </span>
                <span className="font-mono">{character.health}/{character.maxHealth}</span>
              </div>
              <Progress value={healthPercent} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  Experience
                </span>
                <span className="font-mono">{character.experience}/{character.experienceToNext}</span>
              </div>
              <Progress value={expPercent} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Combat Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="flex items-center gap-1 text-sm">
                <Sword className="w-4 h-4 text-orange-500" />
                Attack
              </span>
              <span className="font-mono">{character.attack}</span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center gap-1 text-sm">
                <Shield className="w-4 h-4 text-blue-500" />
                Defense
              </span>
              <span className="font-mono">{character.defense}</span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center gap-1 text-sm">
                <ArrowDown className="w-4 h-4 text-purple-500" />
                Floor
              </span>
              <span className="font-mono">{character.currentFloor}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Inventory</CardTitle>
            <CardDescription>{inventory.length} items</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              onClick={() => setShowInventory(!showInventory)}
              className="w-full"
            >
              <Package className="w-4 h-4 mr-2" />
              {showInventory ? 'Hide' : 'Show'} Items
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Inventory */}
      {showInventory && inventory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Inventory Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {inventory.map((item) => (
                <div 
                  key={item.id} 
                  className={`p-3 border rounded-lg ${getRarityColor(item.rarity)}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-sm">{item.name}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {item.rarity}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {formatItemBonus(item)}
                  </p>
                  <Button 
                    size="sm" 
                    onClick={() => equipItem(item)}
                    className="w-full"
                  >
                    Equip
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Game Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Floor & Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Floor {currentFloor.level}</CardTitle>
            <CardDescription>{currentFloor.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isInCombat ? (
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  Monsters remaining: {currentFloor.monsters.length}
                </div>
                
                <div className="space-y-2">
                  <Button 
                    onClick={exploreFloor} 
                    className="w-full"
                    disabled={currentFloor.monsters.length === 0}
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Explore Floor
                  </Button>
                  
                  {currentFloor.monsters.length === 0 && (
                    <Button 
                      onClick={descendFloor} 
                      variant="secondary"
                      className="w-full"
                    >
                      <ArrowDown className="w-4 h-4 mr-2" />
                      Descend to Floor {currentFloor.level + 1}
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              currentMonster && (
                <div className="space-y-4">
                  <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h3 className="font-bold text-red-800 mb-2">
                      ⚔️ Combat: {currentMonster.name}
                    </h3>
                    <div className="text-sm text-red-700">
                      Level {currentMonster.level} • {currentMonster.health}/{currentMonster.maxHealth} HP
                    </div>
                    <Progress 
                      value={(currentMonster.health / currentMonster.maxHealth) * 100} 
                      className="mt-2 h-2"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      onClick={() => performCombatAction('ATTACK')}
                      disabled={isProcessing}
                      variant={selectedAction === 'ATTACK' ? 'default' : 'outline'}
                    >
                      <Sword className="w-4 h-4 mr-2" />
                      Attack
                    </Button>
                    <Button 
                      onClick={() => performCombatAction('DEFEND')}
                      disabled={isProcessing}
                      variant={selectedAction === 'DEFEND' ? 'default' : 'outline'}
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Defend
                    </Button>
                    <Button 
                      onClick={() => performCombatAction('FLEE')}
                      disabled={isProcessing}
                      variant={selectedAction === 'FLEE' ? 'destructive' : 'outline'}
                      className="col-span-2"
                    >
                      <ArrowDown className="w-4 h-4 mr-2" />
                      Flee
                    </Button>
                  </div>
                </div>
              )
            )}
          </CardContent>
        </Card>

        {/* Combat Log */}
        <Card>
          <CardHeader>
            <CardTitle>Adventure Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 overflow-y-auto space-y-1 text-sm font-mono bg-black text-green-400 p-3 rounded">
              {combatLog.map((message, index) => (
                <div key={index} className="leading-relaxed">
                  {message}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Game Info */}
      <Alert>
        <Coins className="h-4 w-4" />
        <AlertDescription>
          <strong>Phase 1 Demo:</strong> This is the core game loop! Combat, loot, and progression work. 
          In Phase 2, loot will become real NFTs minted to your wallet, and death will trigger the sBTC resurrection mechanic.
        </AlertDescription>
      </Alert>
    </div>
  );
}
