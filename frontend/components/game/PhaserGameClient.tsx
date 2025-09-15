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
  Gamepad2,
  Link
} from 'lucide-react';
import { 
  GameCharacter, 
  Monster, 
  LootItem, 
  CombatAction,
  LootRarity 
} from '@/lib/types/game';
import { blockchainGameService } from '@/lib/services/blockchain-game-service';
import { sbtcService, SbtcBalance } from '@/lib/services/sbtc-service';
import EpicLootNotification from './EpicLootNotification';

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

  // Blockchain integration state
  const [isBlockchainConnected, setIsBlockchainConnected] = useState(false);
  const [blockchainStatus, setBlockchainStatus] = useState<string>('Initializing...');
  const [pendingTransactions, setPendingTransactions] = useState<Set<string>>(new Set());
  const [transactionMessages, setTransactionMessages] = useState<string[]>([]);
  
  // Death countdown state
  const [deathCountdown, setDeathCountdown] = useState<number | null>(null);
  
  // sBTC integration state
  const [hasAncientCoin, setHasAncientCoin] = useState(false);
  const [sbtcBalance, setSbtcBalance] = useState<SbtcBalance>({
    balance: 0,
    balanceBtc: 0,
    formatted: '0.00000000 sBTC'
  });
  const [canResurrect, setCanResurrect] = useState(false);
  const [resurrectionCost, setResurrectionCost] = useState(0);
  
  // Epic loot notification state
  const [epicLoot, setEpicLoot] = useState<LootItem | null>(null);

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

    // Handle window resize
    const handleResize = () => {
      if (phaserGameRef.current && gameRef.current) {
        const containerWidth = gameRef.current.clientWidth;
        const containerHeight = gameRef.current.clientHeight;
        
        // Maintain 4:3 aspect ratio
        let gameWidth = Math.min(containerWidth, 800);
        let gameHeight = Math.min(containerHeight, 600);
        
        const aspectRatio = 4/3;
        if (gameWidth / gameHeight > aspectRatio) {
          gameWidth = gameHeight * aspectRatio;
        } else {
          gameHeight = gameWidth / aspectRatio;
        }
        
        phaserGameRef.current.scale.resize(gameWidth, gameHeight);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
      }
    };
  }, []);

  // Initialize blockchain service and event listeners
  useEffect(() => {
    const initBlockchain = async () => {
      try {
        await blockchainGameService.initialize(walletAddress);
        setIsBlockchainConnected(true);
        setBlockchainStatus('Connected');
        
        // Fetch sBTC balance
        const balance = await sbtcService.getSbtcBalance(walletAddress);
        setSbtcBalance(balance);
        
        // Calculate resurrection cost
        const cost = sbtcService.getResurrectionCost(character.level);
        setResurrectionCost(cost);
        
        // Set up event listeners
        blockchainGameService.on('lootMinted', (data: any) => {
          setTransactionMessages(prev => [...prev, `🎯 Loot NFT minted: ${data.lootItem.name}`]);
          setCombatLog(prev => [...prev, `💰 ${data.lootItem.name} has been minted as an NFT!`]);
        });

        blockchainGameService.on('characterDied', (data: any) => {
          setTransactionMessages(prev => [...prev, `💀 Tombstone created at floor ${data.floor}`]);
          setCombatLog(prev => [...prev, `⚰️ A tombstone marks your demise at floor ${data.floor}`]);
        });

        blockchainGameService.on('characterResurrected', (data: any) => {
          setTransactionMessages(prev => [...prev, `⚡ Resurrected with ${data.sBtcAmount} sBTC`]);
          setCombatLog(prev => [...prev, `🔥 You have been resurrected! Cost: ${data.sBtcAmount} sBTC`]);
        });

        blockchainGameService.on('transactionPending', (data: any) => {
          setPendingTransactions(prev => new Set([...prev, data.txId]));
        });

        blockchainGameService.on('transactionConfirmed', (data: any) => {
          setPendingTransactions(prev => {
            const newSet = new Set(prev);
            newSet.delete(data.txId);
            return newSet;
          });
        });

        blockchainGameService.on('error', (error: any) => {
          setTransactionMessages(prev => [...prev, `❌ Error: ${error.message}`]);
          setBlockchainStatus(`Error: ${error.message}`);
        });

      } catch (error) {
        console.error('Failed to initialize blockchain service:', error);
        setBlockchainStatus('Failed to connect');
        setIsBlockchainConnected(false);
      }
    };

    if (walletAddress) {
      initBlockchain();
    }

    return () => {
      blockchainGameService.removeAllListeners();
    };
  }, [walletAddress]);

  // Death countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (deathCountdown !== null && deathCountdown > 0) {
      interval = setInterval(() => {
        setDeathCountdown(prev => {
          if (prev === null || prev <= 1) {
            // Countdown finished, end the game
            onGameEnd?.('death');
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [deathCountdown, onGameEnd]);

  const setupGameCallbacks = (dungeonScene: any) => {
    dungeonScene.setCallbacks({
      onCombatStart: (monster: Monster) => {
        console.log('⚔️ Combat started with:', monster.name);
        setCurrentMonster(monster);
        setIsInCombat(true);
        addCombatLog(`💀 Encountered ${monster.name} (Level ${monster.level})!`);
      },
      
      onTreasureFound: async (loot: LootItem) => {
        console.log('💰 Treasure found:', loot.name);
        setInventory(prev => [...prev, loot]);
        addCombatLog(`✨ Found ${loot.name} (${loot.rarity})!`);
        
        // Check if this is an Ancient Satoshi Coin
        if (loot.name === 'Ancient Satoshi Coin') {
          setHasAncientCoin(true);
          addCombatLog('🪙 LEGENDARY! You found an Ancient Satoshi Coin! This can be used for resurrection gambling.');
        }
        
        // Show epic notification for legendary and mythic items
        if (loot.rarity === 'legendary' || loot.rarity === 'mythic') {
          setEpicLoot(loot);
        }
        
        // Mint NFT on blockchain for valuable loot
        if (isBlockchainConnected && walletAddress) {
          try {
            addCombatLog(`🔗 Minting ${loot.name} as NFT...`);
            await blockchainGameService.mintLootNFT(loot, walletAddress);
          } catch (error) {
            console.error('Failed to mint loot NFT:', error);
            addCombatLog(`❌ Failed to mint NFT: ${error}`);
          }
        } else {
          console.log('🪙 Would mint NFT for:', loot);
        }
      },
      
      onFloorAdvance: (floor: number) => {
        console.log('📈 Advanced to floor:', floor);
        setCharacter(prev => ({ ...prev, currentFloor: floor, deepestFloor: Math.max(prev.deepestFloor, floor) }));
        addCombatLog(`🏃 Descended to Floor ${floor}!`);
      },
      
      onPlayerDeath: async () => {
        console.log('💀 Player died!');
        setCharacter(prev => ({ ...prev, isAlive: false, health: 0 }));
        addCombatLog('💀 You have fallen in battle...');
        
        // Start countdown - 5 minutes (300 seconds) for blockchain users, 30 seconds for others
        const countdownTime = isBlockchainConnected ? 300 : 30;
        setDeathCountdown(countdownTime);
        
        // Process death on blockchain
        if (isBlockchainConnected && walletAddress) {
          try {
            addCombatLog('⚰️ Creating tombstone on blockchain...');
            await blockchainGameService.processCharacterDeath(
              character,
              'combat',
              1000 // Simple play time in ms (will be calculated properly later)
            );
          } catch (error) {
            console.error('Failed to process death on blockchain:', error);
            addCombatLog(`❌ Failed to create tombstone: ${error}`);
          }
        }
      }
    });
  };

  const addCombatLog = (message: string) => {
    setCombatLog(prev => [...prev.slice(-9), message]); // Keep last 10 messages
  };

  const formatCountdown = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Check sBTC balance and resurrection eligibility
  const checkResurrectionStatus = async () => {
    if (!walletAddress || !isBlockchainConnected) return;
    
    try {
      const resurrectionCheck = await sbtcService.canUseResurrection(walletAddress);
      setSbtcBalance(resurrectionCheck.sbtcBalance || {
        balance: 0,
        balanceBtc: 0,
        formatted: '0.00000000 sBTC'
      });
      setCanResurrect(resurrectionCheck.canResurrect);
    } catch (error) {
      console.error('Failed to check resurrection status:', error);
      setCanResurrect(false);
    }
  };

  // Check resurrection status when wallet connects or changes
  useEffect(() => {
    if (walletAddress && isBlockchainConnected) {
      checkResurrectionStatus();
      // Check every 30 seconds to keep balance updated
      const interval = setInterval(checkResurrectionStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [walletAddress, isBlockchainConnected]);

  const handleResurrection = async () => {
    if (!isBlockchainConnected || !walletAddress) {
      addCombatLog('❌ Wallet not connected for resurrection');
      return;
    }

    // REVOLUTIONARY MECHANIC: Use sBTC directly for resurrection, not inventory items!
    const resurrectionCheck = await sbtcService.canUseResurrection(walletAddress);
    
    if (!resurrectionCheck.canResurrect) {
      addCombatLog(`❌ Cannot resurrect: ${resurrectionCheck.reason}`);
      addCombatLog('💰 You need sBTC balance to gamble for resurrection!');
      return;
    }

    try {
      setIsProcessing(true);
      
      addCombatLog('₿ STARTING SBTC RESURRECTION GAMBLE...');
      addCombatLog(`💰 Your balance: ${resurrectionCheck.sbtcBalance?.formatted}`);
      addCombatLog(`🎰 Gambling ${sbtcService.formatSbtcAmount(resurrectionCost)} for resurrection...`);
      addCombatLog('⚡ This uses REAL Bitcoin (sBTC) - win or lose forever!');
      
      const result = await sbtcService.executeResurrectionGamble(
        walletAddress,
        resurrectionCost,
        character.id
      );

      if (result.success) {
        addCombatLog(result.message);
        
        if (result.won) {
          // Resurrection successful!
          setCharacter(prev => ({
            ...prev,
            isAlive: true,
            health: Math.floor(prev.maxHealth * 0.75), // Resurrect with 75% health
            currentFloor: Math.max(1, prev.currentFloor - 2) // Go back 2 floors as penalty
          }));
          
          // Clear the death countdown
          setDeathCountdown(null);
          
          // Remove the Ancient Satoshi Coin from inventory (consumed)
          setInventory(prev => prev.filter(item => item.name !== 'Ancient Satoshi Coin'));
          setHasAncientCoin(false);
          
          // Restart the game engine
          if (dungeonSceneRef.current) {
            dungeonSceneRef.current.resetToFloor1();
          }
          
          addCombatLog('⚡ The Ancient Satoshi Coin glows with power! You have been resurrected!');
          addCombatLog('🔥 Welcome back, hero! You have been blessed by Satoshi himself!');
          
          // Update sBTC balance
          const newBalance = await sbtcService.getSbtcBalance(walletAddress);
          setSbtcBalance(newBalance);
          
        } else {
          // Resurrection failed
          addCombatLog('💀 The coin flip failed... Your sBTC has been burned as offering to the Bitcoin gods.');
          addCombatLog('⚰️ Your character remains dead, but the Ancient Satoshi Coin is consumed.');
          
          // Remove the Ancient Satoshi Coin from inventory (consumed even on failure)
          setInventory(prev => prev.filter(item => item.name !== 'Ancient Satoshi Coin'));
          setHasAncientCoin(false);
          
          // Update sBTC balance
          const newBalance = await sbtcService.getSbtcBalance(walletAddress);
          setSbtcBalance(newBalance);
        }
      } else {
        addCombatLog(`💀 Resurrection attempt failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Resurrection error:', error);
      addCombatLog(`❌ Resurrection error: ${error}`);
    } finally {
      setIsProcessing(false);
    }
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

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Blockchain</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1">
                <Link className="w-4 h-4 text-blue-500" />
                Status
              </span>
              <Badge variant={isBlockchainConnected ? "default" : "secondary"}>
                {blockchainStatus}
              </Badge>
            </div>
            {isBlockchainConnected && (
              <>
                <div className="flex justify-between">
                  <span className="flex items-center gap-1">
                    <Coins className="w-4 h-4 text-orange-500" />
                    sBTC
                  </span>
                  <span className="font-mono text-xs">{sbtcBalance.formatted}</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-1">
                    ₿ sBTC Balance
                  </span>
                  <Badge variant={canResurrect ? "default" : "outline"} className="text-xs">
                    {sbtcBalance.formatted}
                  </Badge>
                </div>
                {canResurrect && sbtcBalance && (
                  <div className="flex justify-between">
                    <span className="text-xs text-green-600">✅ Resurrection Cost</span>
                    <span className="text-xs font-mono">{sbtcService.formatSbtcAmount(resurrectionCost)}</span>
                  </div>
                )}
                {!canResurrect && sbtcBalance && (
                  <div className="text-xs text-red-600">
                    ❌ Insufficient sBTC for resurrection
                  </div>
                )}
              </>
            )}
            {pendingTransactions.size > 0 && (
              <div className="flex justify-between">
                <span className="flex items-center gap-1">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  Pending
                </span>
                <span className="font-mono">{pendingTransactions.size}</span>
              </div>
            )}
            {transactionMessages.length > 0 && (
              <div className="mt-2 space-y-1">
                {transactionMessages.slice(-3).map((msg, idx) => (
                  <div key={idx} className="text-xs text-muted-foreground truncate">
                    {msg}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Game Area - Refined & Perfectly Responsive */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Phaser Game Canvas - Elegant Container */}
        <div className="xl:col-span-3 order-1 xl:order-1">
          <Card className="shadow-2xl border-2 border-border/50 bg-gradient-to-br from-background via-background to-muted/30">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-red-600">
                  <Gamepad2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-xl font-bold">Satoshi's Dungeon</div>
                  <div className="text-sm text-muted-foreground font-normal">Floor {character.currentFloor}</div>
                </div>
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Use WASD or arrow keys to move • Walk into monsters to fight • Touch treasures to collect
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-6">
              {/* Perfect Game Canvas Container */}
              <div className="relative w-full">
                <div 
                  ref={gameRef} 
                  className="w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl border-2 border-slate-700/50 shadow-inner overflow-hidden"
                  style={{
                    aspectRatio: '4 / 3',
                    maxWidth: '100%',
                    minHeight: '320px',
                    maxHeight: 'min(70vh, 600px)',
                    margin: '0 auto',
                    position: 'relative',
                    background: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #1e293b 100%)'
                  }}
                />
                
                {/* Game Loading Overlay */}
                {!gameInitialized && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm rounded-xl z-20">
                    <div className="text-center text-white">
                      <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                      <p className="text-lg font-medium">Loading Phaser.js Engine...</p>
                      <p className="text-sm text-slate-300 mt-2">Initializing game world...</p>
                    </div>
                  </div>
                )}

                {/* Death Screen Overlay */}
                {!character.isAlive && (
              <div className="absolute inset-0 flex items-center justify-center bg-red-900 bg-opacity-80 rounded-lg">
                <div className="text-center text-white max-w-sm">
                  <Skull className="w-16 h-16 mx-auto mb-4 text-red-300" />
                  <h3 className="text-2xl font-bold mb-2">You Have Fallen</h3>
                  <p className="text-red-200 mb-4">Your adventure ends at Floor {character.currentFloor}</p>
                  
                  {/* Countdown Display */}
                  {deathCountdown !== null && (
                    <div className={`mb-6 p-3 rounded-lg border ${
                      deathCountdown <= 30 
                        ? 'bg-red-700/70 border-red-400 animate-pulse' 
                        : 'bg-red-800/50 border-red-600'
                    }`}>
                      <div className="text-yellow-300 text-sm mb-1">
                        {isBlockchainConnected ? 'Resurrection window closes in:' : 'Game ending in:'}
                      </div>
                      <div className={`text-2xl font-mono font-bold ${
                        deathCountdown <= 30 ? 'text-red-200' : 'text-yellow-200'
                      }`}>
                        {formatCountdown(deathCountdown)}
                      </div>
                      {isBlockchainConnected && (
                        <div className="text-xs text-yellow-400 mt-1">
                          {deathCountdown <= 30 
                            ? 'Time running out! Resurrect now or lose your progress!' 
                            : 'Use resurrection or click "Give Up" to end now'
                          }
                        </div>
                      )}
                    </div>
                  )}
                  
                  {isBlockchainConnected ? (
                    <div className="space-y-3">
                      {canResurrect ? (
                        <>
                          <p className="text-sm text-yellow-300">
                            ₿ You have sufficient sBTC balance! 
                          </p>
                          <p className="text-xs text-green-300">
                            Balance: {sbtcBalance.formatted} (${sbtcBalance.usd?.toFixed(2) || 'N/A'})
                          </p>
                          <p className="text-xs text-red-300">
                            Risk {sbtcService.formatSbtcAmount(resurrectionCost)} for a 50% chance at resurrection
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-red-300">
                            You need sBTC balance to attempt resurrection
                          </p>
                          <p className="text-xs text-gray-400">
                            Current balance: {sbtcBalance.formatted}
                          </p>
                          <p className="text-xs text-gray-400">
                            Required: {sbtcService.formatSbtcAmount(resurrectionCost)}
                          </p>
                        </>
                      )}
                      <div className="flex gap-2">
                        <Button 
                          onClick={handleResurrection}
                          disabled={isProcessing || !canResurrect}
                          className="bg-orange-600 hover:bg-orange-700 flex-1"
                        >
                          {isProcessing ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                              Gambling...
                            </>
                          ) : (
                            <>
                              <Zap className="w-4 h-4 mr-2" />
                              {canResurrect ? 'Gamble sBTC' : 'Insufficient sBTC'}
                            </>
                          )}
                        </Button>
                        <Button 
                          onClick={() => {
                            setDeathCountdown(null);
                            onGameEnd?.('death');
                          }}
                          variant="outline"
                          className="border-red-600 text-red-200 hover:bg-red-800 flex-1"
                        >
                          Give Up
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-red-300">
                        Connect wallet to use sBTC resurrection
                      </p>
                      <Button 
                        onClick={() => {
                          setDeathCountdown(null);
                          onGameEnd?.('death');
                        }}
                        variant="outline"
                        className="border-red-600 text-red-200 hover:bg-red-800"
                      >
                        End Adventure
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
              </div>
          </CardContent>
        </Card>
        </div>

        {/* Refined Sidebar - Perfectly Aligned */}
        <div className="order-2 xl:order-2 space-y-6">
          {/* Combat Panel */}
          {isInCombat && currentMonster && (
            <Card className="border-red-400/50 bg-gradient-to-br from-red-50 via-red-50 to-red-100 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-red-800 flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-red-600">
                    <Skull className="w-4 h-4 text-white" />
                  </div>
                  <span>Combat!</span>
                </CardTitle>
                <CardDescription className="text-red-700 font-medium">
                  {currentMonster.name} - Level {currentMonster.level}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
          <strong>🎮 Phase 3 Complete!</strong> Full sBTC integration! Find Ancient Satoshi Coins to gamble real Bitcoin for resurrection!
        </AlertDescription>
      </Alert>

      {/* Epic Loot Notification */}
      <EpicLootNotification 
        loot={epicLoot}
        onClose={() => setEpicLoot(null)}
      />
        </div>

  );
}
