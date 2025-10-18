'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Play,
  Sword,
  Skull,
  Trophy,
  ArrowRight,
  Wallet,
  Gamepad2,
  Package,
  Coins,
  Crown
} from 'lucide-react';

const steps = [
  {
    number: "01",
    icon: Wallet,
    title: "Connect Wallet",
    description: "Link your Stacks wallet to access the blockchain dungeon.",
    color: "blue"
  },
  {
    number: "02", 
    icon: Play,
    title: "Enter Dungeon",
    description: "Begin your quest in procedurally generated floors.",
    color: "purple"
  },
  {
    number: "03",
    icon: Sword,
    title: "Battle & Collect",
    description: "Fight monsters and discover legendary NFT loot.",
    color: "green"
  },
  {
    number: "04",
    icon: Skull,
    title: "Face Death",
    description: "Permanent death burns equipped items forever.",
    color: "red"
  },
  {
    number: "05",
    icon: Trophy,
    title: "Leave Legacy",
    description: "Your achievements immortalized on-chain.",
    color: "yellow"
  }
];

const gameplayHighlights = [
  {
    icon: Gamepad2,
    title: "Turn-Based Combat",
    description: "Strategic battles"
  },
  {
    icon: Package,
    title: "NFT Equipment",
    description: "Items you own"
  },
  {
    icon: Coins,
    title: "sBTC Gambling",
    description: "Risk & resurrection"
  },
  {
    icon: Crown,
    title: "Permanent Legacy",
    description: "Forever on-chain"
  }
];

export default function HowItWorksSection() {
  const scrollToNext = () => {
    document.getElementById('technology')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="how-it-works" className="py-16 px-6 bg-muted/20">
      <div className="container mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="text-center mb-12">
          <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1 text-xs font-semibold mb-4">
            How It Works
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold game-title mb-4">
            Your Journey Into the Unknown
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Five essential steps to master the most challenging blockchain gaming experience.
          </p>
        </div>

        {/* Steps Flow - Modern Horizontal Timeline */}
        <div className="mb-16 relative">
          {/* Connection Line */}
          
          <div className="hidden lg:block absolute top-20 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500/20 via-purple-500/20  to-yellow-500/20"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <Card className={`group bg-gradient-to-br from-card via-card to-card/80 border border-${step.color}-500/20 hover:border-${step.color}-500/50 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 h-full overflow-hidden`}>
                  {/* Gradient overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br from-${step.color}-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                  
                  <CardContent className="p-5 text-center relative z-10">
                    {/* Step Number Badge */}
                    <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full bg-${step.color}-500/10 border border-${step.color}-500/20 mb-3`}>
                      <span className={`text-sm font-bold text-${step.color}-500`}>{step.number}</span>
                    </div>
                    
                    {/* Icon */}
                    <div className={`w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-${step.color}-500/20 to-${step.color}-600/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-${step.color}-500/10`}>
                      <step.icon className={`w-6 h-6 text-${step.color}-400`} />
                    </div>
                    
                    {/* Content */}
                    <h3 className="text-sm font-bold text-foreground mb-2 leading-tight">
                      {step.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>

        {/* Gameplay Highlights - Compact Grid */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold game-title mb-2">Core Gameplay</h3>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              Traditional roguelike meets blockchain technology
            </p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {gameplayHighlights.map((highlight, index) => (
              <Card key={index} className="bg-card/60 border border-border/50 backdrop-blur-sm text-center p-4 hover:-translate-y-0.5 transition-all duration-300 group">
                <div className="w-10 h-10 mx-auto mb-3 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <highlight.icon className="w-5 h-5 text-primary" />
                </div>
                <h4 className="font-semibold text-sm text-foreground mb-1">{highlight.title}</h4>
                <p className="text-xs text-muted-foreground">{highlight.description}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Risk vs Reward - Modern Two Column */}
        <Card className="bg-gradient-to-br from-card/95 to-card/80 border border-primary/20 backdrop-blur-sm overflow-hidden">
          <CardContent className="p-6 sm:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-5">
                <div className="space-y-3">
                  <Badge className="bg-red-500/10 text-red-500 border-red-500/20 px-3 py-1 text-xs">
                    High Stakes
                  </Badge>
                  <h3 className="text-2xl sm:text-3xl font-bold game-title">
                    Every Decision Matters
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    No save files, no respawns. Every choice carries weight, every battle has 
                    consequences, and every treasure has real value.
                  </p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Trophy className="w-4 h-4 text-green-400" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-foreground">High Rewards</div>
                      <div className="text-xs text-muted-foreground">
                        Legendary NFTs with real value
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-red-500/20 to-red-600/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Skull className="w-4 h-4 text-red-400" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-foreground">Real Consequences</div>
                      <div className="text-xs text-muted-foreground">
                        Permanent loss of equipped items
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Coins className="w-4 h-4 text-yellow-400" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-foreground">Resurrection Gambling</div>
                      <div className="text-xs text-muted-foreground">
                        Risk Bitcoin for a second chance
                      </div>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={scrollToNext}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-10 px-5"
                >
                  Learn About Technology
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
              
              <div className="relative">
                <div className="bg-gradient-to-br from-muted/40 to-muted/20 rounded-xl p-6 border border-border/50 backdrop-blur-sm">
                  <div className="space-y-5">
                    <div className="text-center pb-4 border-b border-border/50">
                      <div className="text-3xl font-bold text-primary mb-1">47%</div>
                      <div className="text-sm font-semibold text-foreground">Resurrection Rate</div>
                      <div className="text-xs text-muted-foreground">Mathematically verified</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-4 bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-lg border border-green-500/20">
                        <div className="font-bold text-sm text-green-400 mb-1">Success</div>
                        <div className="text-xs text-green-600 dark:text-green-500">Return + sBTC back</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-red-500/10 to-red-600/5 rounded-lg border border-red-500/20">
                        <div className="font-bold text-sm text-red-400 mb-1">Failure</div>
                        <div className="text-xs text-red-600 dark:text-red-500">Death + sBTC lost</div>
                      </div>
                    </div>
                    
                    <div className="text-center text-xs text-muted-foreground pt-2">
                      Powered by blockchain oracles for provable fairness
                    </div>
                  </div>
                </div>
                <div className="absolute -top-3 -right-3 w-16 h-16 bg-primary/20 rounded-full blur-2xl"></div>
                <div className="absolute -bottom-3 -left-3 w-12 h-12 bg-accent/20 rounded-full blur-xl"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}