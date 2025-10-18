'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Play, 
  Sword,
  Shield,
  Skull,
  Bitcoin,
  TrendingUp,
  Users,
  Zap
} from 'lucide-react';
import { WalletConnectionResult } from '@/lib/services/wallet-service';

interface HeroSectionProps {
  walletData: WalletConnectionResult | null;
  onStartGame?: () => void;
}

export default function HeroSection({ walletData, onStartGame }: HeroSectionProps) {
  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="pt-28 pb-16 px-6 min-h-screen flex items-center">
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Hero Content */}
          <div className="space-y-8">

            {/* Main Headline */}
            <div className="space-y-6">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold game-title leading-tight">
                <span className="block text-foreground">The First</span>
                <span className="block text-primary">Bitcoin-Secured</span>
                <span className="block text-foreground">Roguelike</span>
              </h1>
              
              <p className="text-xl sm:text-2xl text-muted-foreground leading-relaxed max-w-2xl">
                Enter Satoshi's dungeon where <strong className="text-foreground">death is permanent</strong>, 
                <strong className="text-primary"> loot is valuable</strong>, and every action is 
                <strong className="text-foreground"> secured by Bitcoin</strong>.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-row items-center gap-3 sm:gap-3">
              {walletData ? (
                <Button 
                  onClick={onStartGame}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 sm:px-6 py-2 sm:py-2.5 h-9 sm:h-11 text-sm sm:text-base transition-all hover:scale-105 active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                  <span className="hidden xs:inline">Enter the Dungeon</span>
                  <span className="xs:hidden">Play Now</span>
                </Button>
              ) : (
                <Button 
                  onClick={scrollToFeatures}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 sm:px-6 py-2 sm:py-2.5 h-9 sm:h-11 text-sm sm:text-base transition-all hover:scale-105 active:scale-95"
                >
                  <Sword className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                  <span className="hidden xs:inline">Start Your Quest</span>
                  <span className="xs:hidden">Start Quest</span>
                </Button>
              )}
              
              <Button 
                variant="outline" 
                onClick={scrollToFeatures}
                className="border font-medium px-4 sm:px-6 py-2 sm:py-2.5 h-9 sm:h-11 text-sm sm:text-base hover:bg-muted/50 transition-all"
              >
                <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                Learn More
              </Button>
            </div>

          </div>

          {/* Hero Visual */}
          <div className="relative order-last lg:order-last">
            {/* Main Game Preview Card */}
            <Card className="bg-card/80 border border-border/50 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="aspect-video bg-muted/20 border-2 border-dashed border-border/50 rounded-xl flex flex-col items-center justify-center space-y-6">
                  {/* Game Icons Display */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center">
                        <Sword className="w-8 h-8 text-blue-500" />
                      </div>
                      <span className="text-sm font-medium text-blue-500">Combat</span>
                    </div>
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center">
                        <Shield className="w-8 h-8 text-purple-500" />
                      </div>
                      <span className="text-sm font-medium text-purple-500">NFT Loot</span>
                    </div>
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                        <Skull className="w-8 h-8 text-red-500" />
                      </div>
                      <span className="text-sm font-medium text-red-500">Permadeath</span>
                    </div>
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center">
                        <Bitcoin className="w-8 h-8 text-yellow-500" />
                      </div>
                      <span className="text-sm font-medium text-yellow-500">sBTC</span>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <h3 className="font-bold text-lg mb-2">Game Preview</h3>
                    <p className="text-sm text-muted-foreground">
                      {walletData ? 'Ready to play!' : 'Connect wallet to enter'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Floating Elements */}
            <div className="absolute -top-6 -right-6 w-20 h-20 bg-primary/20 rounded-full blur-xl"></div>
            <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-accent/20 rounded-full blur-xl"></div>
            
            {/* Feature Highlights */}
            <div className="absolute -right-4 top-1/4 hidden xl:block">
              <Card className="bg-card/90 border border-border/50 backdrop-blur-sm p-4 w-48">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Blockchain Secured</div>
                    <div className="text-xs text-muted-foreground">Immutable game state</div>
                  </div>
                </div>
              </Card>
            </div>

            <div className="absolute -left-4 bottom-1/4 hidden xl:block">
              <Card className="bg-card/90 border border-border/50 backdrop-blur-sm p-4 w-48">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4 text-orange-500" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">True Ownership</div>
                    <div className="text-xs text-muted-foreground">Your loot, your wallet</div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="flex justify-center mt-16">
          <Button 
            variant="ghost" 
            onClick={scrollToFeatures}
            className="text-muted-foreground hover:text-foreground"
          >
            <div className="flex flex-col items-center space-y-2">
              <div className="text-sm">Discover Features</div>
              <div className="w-6 h-10 border-2 border-current rounded-full p-1">
                <div className="w-1 h-3 bg-current rounded-full animate-bounce"></div>
              </div>
            </div>
          </Button>
        </div>
      </div>
    </section>
  );
}