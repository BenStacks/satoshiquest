'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bitcoin, 
  Skull, 
  Sword, 
  Shield, 
  Zap,
  Trophy,
  Github,
  ExternalLink
} from 'lucide-react';
import WalletConnect from '@/components/wallet/WalletConnect';
import PhaserGameScreen from '@/components/game/PhaserGameScreen';
import DeathScreen from '@/components/game/DeathScreen';
import { GameCharacter } from '@/lib/types/game';
import { WalletConnectionResult } from '@/lib/services/wallet-service';

type GameState = 'menu' | 'playing' | 'dead' | 'tombstone';

export default function Home() {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [walletData, setWalletData] = useState<WalletConnectionResult | null>(null);
  const [deadCharacter, setDeadCharacter] = useState<GameCharacter | null>(null);

  const handleWalletConnected = (wallet: WalletConnectionResult) => {
    setWalletData(wallet);
    console.log('Wallet connected to Satoshi Quest:', wallet);
  };

  const handleWalletDisconnected = () => {
    setWalletData(null);
    setGameState('menu');
    console.log('Wallet disconnected from Satoshi Quest');
  };

  const startGame = () => {
    if (walletData) {
      setGameState('playing');
    }
  };

  const handleGameEnd = (reason: string, character?: GameCharacter) => {
    console.log('Game ended:', reason);
    if (reason === 'death' && character) {
      setDeadCharacter(character);
      setGameState('dead');
    }
  };

  const handleResurrection = () => {
    console.log('Character resurrected!');
    setGameState('playing');
    setDeadCharacter(null);
  };

  const handleCreateTombstone = () => {
    console.log('Creating tombstone...');
    setGameState('tombstone');
  };

  const handleNewGame = () => {
    setGameState('playing');
    setDeadCharacter(null);
  };

  const backToMenu = () => {
    setGameState('menu');
    setDeadCharacter(null);
  };

  // Main menu
  if (gameState === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-4">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Satoshi&apos;s Quest
            </h1>
            <p className="text-xl text-muted-foreground mb-2">
              A Bitcoin-Powered Roguelike Adventure
            </p>
            <div className="flex items-center justify-center gap-2 mb-6">
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                Phase 1 Demo
              </Badge>
              <Badge variant="outline">
                Powered by Stacks & sBTC
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Game Info */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bitcoin className="w-6 h-6 text-orange-500" />
                    The Quest Begins
                  </CardTitle>
                  <CardDescription>
                    Enter the depths of Satoshi&apos;s dungeon, where every death is permanent 
                    and every victory is earned.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <Sword className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                      <div className="font-medium text-blue-800">Epic Combat</div>
                      <div className="text-xs text-blue-600">Turn-based battles</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <Shield className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                      <div className="font-medium text-purple-800">NFT Loot</div>
                      <div className="text-xs text-purple-600">Real blockchain assets</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 border border-red-200 rounded-lg">
                      <Skull className="w-6 h-6 mx-auto mb-2 text-red-600" />
                      <div className="font-medium text-red-800">Permadeath</div>
                      <div className="text-xs text-red-600">Death is permanent</div>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <Zap className="w-6 h-6 mx-auto mb-2 text-yellow-600" />
                      <div className="font-medium text-yellow-800">sBTC Resurrection</div>
                      <div className="text-xs text-yellow-600">Gamble for revival</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>How It Works</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</div>
                    <div>
                      <strong>Connect your Stacks wallet</strong> to enter the dungeon
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</div>
                    <div>
                      <strong>Battle monsters</strong> and collect legendary loot as NFTs
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">3</div>
                    <div>
                      <strong>When you die</strong>, equipped items are burned forever
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center text-xs font-bold">4</div>
                    <div>
                      <strong>Risk Real Bitcoin (sBTC)</strong> for resurrection when you die
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold">5</div>
                    <div>
                      <strong>Your legacy</strong> is permanently recorded on Bitcoin
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Github className="w-5 h-5" />
                    Vibe Coding Journey
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="text-muted-foreground">
                    This game was built following the &quot;Vibe Coding&quot; philosophy, using AI as a force multiplier:
                  </p>
                  <ul className="space-y-1 text-xs">
                    <li>• <strong>Game Engine:</strong> AI generated core roguelike mechanics</li>
                    <li>• <strong>Combat System:</strong> AI created turn-based battle logic</li>
                    <li>• <strong>Loot Generation:</strong> AI designed procedural item system</li>
                    <li>• <strong>UI Components:</strong> AI scaffolded React components</li>
                    <li>• <strong>Blockchain Integration:</strong> Human-reviewed Stacks contracts</li>
                  </ul>
                  <div className="pt-2">
                    <Button variant="outline" size="sm" className="w-full">
                      <ExternalLink className="w-3 h-3 mr-1" />
                      View Development Process
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Wallet Connection */}
            <div className="space-y-6">
              <WalletConnect 
                onWalletConnected={handleWalletConnected}
                onWalletDisconnected={handleWalletDisconnected}
                showBalances={true}
              />

              {walletData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-yellow-500" />
                      Ready for Adventure
                    </CardTitle>
                    <CardDescription>
                      Your wallet is connected. Time to face the depths!
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={startGame}
                      size="lg"
                      className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                    >
                      <Sword className="w-5 h-5 mr-2" />
                      Enter Satoshi&apos;s Dungeon
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Game screen
  if (gameState === 'playing' && walletData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-white">Satoshi&apos;s Quest</h1>
            <Button variant="outline" onClick={backToMenu}>
              Back to Menu
            </Button>
          </div>
          
          <PhaserGameScreen 
            walletAddress={walletData.address}
            onGameEnd={(reason) => {
              // In a real implementation, we'd get the character from the game engine
              const mockCharacter: GameCharacter = {
                id: 'mock-char',
                name: 'Hero of Bitcoin',
                level: 5,
                health: 0,
                maxHealth: 100,
                attack: 15,
                defense: 8,
                experience: 1250,
                experienceToNext: 2500,
                currentFloor: 3,
                deepestFloor: 3,
                equipped: [
                  {
                    id: 'sword1',
                    name: 'Satoshi Blade',
                    type: 'weapon',
                    rarity: 'legendary',
                    attackBonus: 15,
                    description: 'A legendary sword forged in the genesis block'
                  }
                ],
                isAlive: false,
                wallet: walletData.address
              };
              handleGameEnd(reason, mockCharacter);
            }}
          />
        </div>
      </div>
    );
  }

  // Death screen
  if (gameState === 'dead' && deadCharacter) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 to-gray-900 p-4">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-white">Satoshi&apos;s Quest</h1>
            <Button variant="outline" onClick={backToMenu}>
              Back to Menu
            </Button>
          </div>
          
          <DeathScreen 
            character={deadCharacter}
            deathCause="Slain by a Hash Goblin"
            onResurrection={handleResurrection}
            onCreateTombstone={handleCreateTombstone}
            onNewGame={handleNewGame}
          />
        </div>
      </div>
    );
  }

  // Tombstone created
  if (gameState === 'tombstone') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-800 to-black p-4">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-white">Satoshi&apos;s Quest</h1>
            <Button variant="outline" onClick={backToMenu}>
              Back to Menu
            </Button>
          </div>
          
          <Card className="w-full max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">🪦 Legacy Preserved</CardTitle>
              <CardDescription>
                Your tombstone NFT has been created and will be minted to your wallet
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-muted-foreground">
                Your achievements are now permanently recorded on the Bitcoin blockchain. 
                This is your proof of adventure, forever.
              </p>
              
              <div className="space-y-2">
                <Button onClick={handleNewGame} className="w-full">
                  Start New Quest
                </Button>
                <Button variant="outline" onClick={backToMenu} className="w-full">
                  Return to Menu
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return null;
}
