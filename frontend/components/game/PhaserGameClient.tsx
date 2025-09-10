'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Skull, 
  Coins,
  Package,
  Zap,
  TrendingUp,
  Gamepad2
} from 'lucide-react';
import { 
  GameCharacter, 
  Monster, 
  LootItem, 
  CombatAction,
  LootRarity 
} from '@/lib/types/game';

interface PhaserGameClientProps {
  walletAddress: string;
  onGameEnd?: (reason: string) => void;
}

export default function PhaserGameClient({ walletAddress, onGameEnd }: PhaserGameClientProps) {
  const gameRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<any>(null);
  const dungeonSceneRef = useRef<any>(null);
  
  const [gameInitialized, setGameInitialized] = useState(false);
  const [character, setCharacter] = useState<GameCharacter>({
    id: 'player-1',
    name: 'Hero of Bitcoin',
    level: 1,
    health: 100,
    maxHealth: 100,
    attack: 10,
    defense: 5,
    experience: 0,
    experienceToNext: 100,
    currentFloor: 1,
    deepestFloor: 1,
    equipped: [],
    isAlive: true,
    wallet: walletAddress
  });
  
  const [currentMonster, setCurrentMonster] = useState<Monster | null>(null);
  const [combatLog, setCombatLog] = useState<string[]>(['🎮 Welcome to Satoshi\'s Quest!', '🏰 Use WASD or arrow keys to move']);
  const [inventory, setInventory] = useState<LootItem[]>([]);
  const [isInCombat, setIsInCombat] = useState(false);
  const [selectedAction, setSelectedAction] = useState<CombatAction['type'] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize Phaser game with dynamic import
  useEffect(() => {
    if (gameRef.current && !phaserGameRef.current) {
      console.log('🎮 Dynamically loading Phaser.js game...');
      
      import('@/lib/game/phaser-engine').then(({ createPhaserGame, DungeonScene }) => {
        if (gameRef.current && !phaserGameRef.current) {
          phaserGameRef.current = createPhaserGame(gameRef.current);
          
          // Wait for scene to be ready
          const checkScene = () => {
            const dungeonScene = phaserGameRef.current?.scene?.getScene('DungeonScene');
            if (dungeonScene) {
              dungeonSceneRef.current = dungeonScene;
              setupGameCallbacks(dungeonScene);
              dungeonScene.setCharacter(character);
              setGameInitialized(true);
              console.log('✅ Phaser game initialized successfully');
            } else {
              setTimeout(checkScene, 100);
            }
          };
          
          setTimeout(checkScene, 100);
        }
      }).catch(error => {
        console.error('Failed to load Phaser game:', error);
      });
    }

    return () => {
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
      }
    };
  }, []);

  const setupGameCallbacks = (dungeonScene: any) => {
    dungeonScene.setCallbacks({
      onCombatStart: (monster: Monster) => {
        console.log('⚔️ Combat started with:', monster.name);
        setCurrentMonster(monster);
        setIsInCombat(true);
        addCombatLog(`💀 Encountered ${monster.name} (Level ${monster.level})!`);
      },
      
      onTreasureFound: (loot: LootItem) => {
        console.log('💰 Treasure found:', loot.name);
        setInventory(prev => [...prev, loot]);
        addCombatLog(`✨ Found ${loot.name} (${loot.rarity})!`);
        
        // TODO: Call blockchain contract to mint NFT
        console.log('🪙 Would mint NFT for:', loot);
      },
      
      onFloorAdvance: (floor: number) => {
        console.log('📈 Advanced to floor:', floor);
        setCharacter(prev => ({ ...prev, currentFloor: floor, deepestFloor: Math.max(prev.deepestFloor, floor) }));
        addCombatLog(`🏃 Descended to Floor ${floor}!`);
      },
      
      onPlayerDeath: () => {
        console.log('💀 Player died!');
        setCharacter(prev => ({ ...prev, isAlive: false, health: 0 }));
        addCombatLog('💀 You have fallen in battle...');
        
        // TODO: Call blockchain contract to process death
        setTimeout(() => {
          onGameEnd?.('death');
        }, 2000);
      }
    });
  };

  const addCombatLog = (message: string) => {
    setCombatLog(prev => [...prev.slice(-9), message]); // Keep last 10 messages
  };

  const performCombatAction = async (actionType: CombatAction['type']) => {
    if (!currentMonster || isProcessing || !dungeonSceneRef.current) return;

    try {
      setIsProcessing(true);
      setSelectedAction(actionType);

      // Simulate combat calculations
      let playerDamage = 0;
      let monsterDamage = 0;
      let actionResult = '';

      switch (actionType) {
        case 'ATTACK':
          playerDamage = Math.max(1, character.attack - currentMonster.defense + Math.floor(Math.random() * 5));
          actionResult = `⚔️ You attack for ${playerDamage} damage!`;
          break;
        case 'DEFEND':
          playerDamage = Math.max(1, Math.floor(character.attack / 2) - currentMonster.defense);
          actionResult = `🛡️ You defend while attacking for ${playerDamage} damage!`;
          break;
        case 'FLEE':
          if (Math.random() < 0.7) {
            addCombatLog('🏃 You successfully fled from combat!');
            setIsInCombat(false);
            setCurrentMonster(null);
            dungeonSceneRef.current.endCombat(false);
            return;
          } else {
            actionResult = '❌ Failed to flee!';
            playerDamage = 0;
          }
          break;
      }

      // Apply damage to monster
      const updatedMonster = { ...currentMonster, health: currentMonster.health - playerDamage };
      setCurrentMonster(updatedMonster);
      addCombatLog(actionResult);

      // Check if monster is defeated
      if (updatedMonster.health <= 0) {
        addCombatLog(`✅ ${currentMonster.name} defeated!`);
        
        // Gain experience
        const expGained = currentMonster.level * 20;
        const newExp = character.experience + expGained;
        let newLevel = character.level;
        let newExpToNext = character.experienceToNext;
        
        if (newExp >= character.experienceToNext) {
          newLevel++;
          newExpToNext = newLevel * 100; // Simple level progression
          addCombatLog(`🌟 Level up! You are now level ${newLevel}!`);
        }
        
        setCharacter(prev => ({
          ...prev,
          experience: newExp,
          level: newLevel,
          experienceToNext: newExpToNext,
          attack: prev.attack + (newLevel > prev.level ? 2 : 0),
          defense: prev.defense + (newLevel > prev.level ? 1 : 0),
          maxHealth: prev.maxHealth + (newLevel > prev.level ? 10 : 0)
        }));
        
        addCombatLog(`📈 Gained ${expGained} experience!`);
        
        setIsInCombat(false);
        setCurrentMonster(null);
        
        // Tell Phaser scene combat ended
        if (dungeonSceneRef.current && currentMonster.gridX !== undefined && currentMonster.gridY !== undefined) {
          dungeonSceneRef.current.endCombat(true, currentMonster.gridX, currentMonster.gridY);
        }
        
        return;
      }

      // Monster attacks back
      await new Promise(resolve => setTimeout(resolve, 1000)); // Animation delay
      
      monsterDamage = Math.max(1, currentMonster.attack - character.defense + Math.floor(Math.random() * 3));
      const newHealth = Math.max(0, character.health - monsterDamage);
      
      setCharacter(prev => ({ ...prev, health: newHealth }));
      addCombatLog(`👹 ${currentMonster.name} attacks for ${monsterDamage} damage!`);
      
      // Check if player died
      if (newHealth <= 0) {
        addCombatLog('💀 You have been defeated...');
        setCharacter(prev => ({ ...prev, isAlive: false }));
        
        if (dungeonSceneRef.current) {
          dungeonSceneRef.current.endCombat(false);
        }
        
        setTimeout(() => {
          onGameEnd?.('death');
        }, 2000);
      }

    } finally {
      setIsProcessing(false);
      setSelectedAction(null);
    }
  };

  const equipItem = (item: LootItem) => {
    setCharacter(prev => {
      const newEquipped = [...prev.equipped, item];
      const newAttack = prev.attack + (item.attackBonus || 0);
      const newDefense = prev.defense + (item.defenseBonus || 0);
      const newMaxHealth = prev.maxHealth + (item.healthBonus || 0);
      
      return {
        ...prev,
        equipped: newEquipped,
        attack: newAttack,
        defense: newDefense,
        maxHealth: newMaxHealth,
        health: Math.min(prev.health + (item.healthBonus || 0), newMaxHealth)
      };
    });
    
    setInventory(prev => prev.filter(i => i.id !== item.id));
    addCombatLog(`⚙️ Equipped ${item.name} (+${item.attackBonus || 0} ATK, +${item.defenseBonus || 0} DEF, +${item.healthBonus || 0} HP)`);
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

  const healthPercent = (character.health / character.maxHealth) * 100;
  const expPercent = (character.experience / character.experienceToNext) * 100;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Character Stats Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Star className="w-5 h-5 text-yellow-500" />
              {character.name}
            </CardTitle>
            <CardDescription>Level {character.level} Hero</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-1">
                  <Heart className="w-4 h-4 text-red-500" />
                  Health
                </span>
                <span className="font-mono">{character.health}/{character.maxHealth}</span>
              </div>
              <Progress value={healthPercent} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Experience</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  Progress
                </span>
                <span className="font-mono">{character.experience}/{character.experienceToNext}</span>
              </div>
              <Progress value={expPercent} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Combat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="flex items-center gap-1">
                <Sword className="w-4 h-4 text-orange-500" />
                Attack
              </span>
              <span className="font-mono">{character.attack}</span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center gap-1">
                <Shield className="w-4 h-4 text-blue-500" />
                Defense
              </span>
              <span className="font-mono">{character.defense}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="flex items-center gap-1">
                <ArrowDown className="w-4 h-4 text-purple-500" />
                Floor
              </span>
              <span className="font-mono">{character.currentFloor}</span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center gap-1">
                <Package className="w-4 h-4 text-green-500" />
                Items
              </span>
              <span className="font-mono">{inventory.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Game Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Phaser Game Canvas */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gamepad2 className="w-5 h-5" />
              Satoshi's Dungeon - Floor {character.currentFloor}
            </CardTitle>
            <CardDescription>
              Use WASD or arrow keys to move • Walk into monsters to fight • Touch treasures to collect
            </CardDescription>
          </CardHeader>
          <CardContent className="relative">
            <div 
              ref={gameRef} 
              className="w-full h-[400px] border border-border rounded-lg overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900"
            />
            
            {!gameInitialized && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                <div className="text-center text-white">
                  <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p>Loading Phaser.js Engine...</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Combat Panel */}
          {isInCombat && currentMonster && (
            <Card className="border-red-300 bg-red-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-red-800 flex items-center gap-2">
                  <Skull className="w-5 h-5" />
                  Combat!
                </CardTitle>
                <CardDescription className="text-red-700">
                  {currentMonster.name} - Level {currentMonster.level}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Monster Health</span>
                    <span className="font-mono">{currentMonster.health}/{currentMonster.maxHealth}</span>
                  </div>
                  <Progress 
                    value={(currentMonster.health / currentMonster.maxHealth) * 100} 
                    className="h-2"
                  />
                </div>
                
                <div className="grid grid-cols-1 gap-2">
                  <Button 
                    onClick={() => performCombatAction('ATTACK')}
                    disabled={isProcessing}
                    variant={selectedAction === 'ATTACK' ? 'default' : 'outline'}
                    size="sm"
                  >
                    <Sword className="w-4 h-4 mr-2" />
                    Attack
                  </Button>
                  <Button 
                    onClick={() => performCombatAction('DEFEND')}
                    disabled={isProcessing}
                    variant={selectedAction === 'DEFEND' ? 'default' : 'outline'}
                    size="sm"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Defend
                  </Button>
                  <Button 
                    onClick={() => performCombatAction('FLEE')}
                    disabled={isProcessing}
                    variant={selectedAction === 'FLEE' ? 'destructive' : 'outline'}
                    size="sm"
                  >
                    <ArrowDown className="w-4 h-4 mr-2" />
                    Flee
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Inventory */}
          {inventory.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Inventory ({inventory.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {inventory.map((item) => (
                  <div 
                    key={item.id} 
                    className={`p-2 border rounded-lg ${getRarityColor(item.rarity)}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-medium text-sm">{item.name}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {item.rarity}
                      </Badge>
                    </div>
                    <p className="text-xs mb-2">
                      {item.attackBonus ? `+${item.attackBonus} ATK ` : ''}
                      {item.defenseBonus ? `+${item.defenseBonus} DEF ` : ''}
                      {item.healthBonus ? `+${item.healthBonus} HP` : ''}
                    </p>
                    <Button 
                      size="sm" 
                      onClick={() => equipItem(item)}
                      className="w-full text-xs"
                    >
                      Equip
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Combat Log */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Adventure Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 overflow-y-auto space-y-1 text-sm font-mono bg-black text-green-400 p-3 rounded">
                {combatLog.map((message, index) => (
                  <div key={index} className="leading-relaxed">
                    {message}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Info Alert */}
      <Alert>
        <Coins className="h-4 w-4" />
        <AlertDescription>
          <strong>🎮 Phase 1 Complete!</strong> Full Phaser.js game engine with dungeon exploration, combat, and loot! 
          Next: Connect to blockchain for real NFT minting and sBTC resurrection mechanics.
        </AlertDescription>
      </Alert>
    </div>
  );
}
