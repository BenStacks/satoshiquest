'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Sword, 
  Shield, 
  Skull, 
  Bitcoin,
  Zap,
  Trophy,
  Lock,
  Repeat,
  Target,
  Gem,
  Clock,
  Globe
} from 'lucide-react';

const features = [
  {
    icon: Sword,
    title: "Strategic Combat",
    description: "Turn-based tactical battles where positioning and timing determine victory.",
    color: "blue",
    details: ["Skill-based mechanics", "Multiple enemy types", "Strategy matters"]
  },
  {
    icon: Shield,
    title: "NFT Loot System",
    description: "Collect legendary weapons and armor as real blockchain assets you truly own.",
    color: "purple", 
    details: ["True ownership", "Rarity-based drops", "Tradeable assets"]
  },
  {
    icon: Skull,
    title: "Permanent Death",
    description: "When you die, equipped items are burned forever. Death has real consequences.",
    color: "red",
    details: ["No save scumming", "High stakes", "True scarcity"]
  },
  {
    icon: Bitcoin,
    title: "sBTC Integration",
    description: "Risk real Bitcoin for resurrection attempts with proven fairness.",
    color: "yellow",
    details: ["47% resurrection rate", "Transparent odds", "Real Bitcoin stakes"]
  },
  {
    icon: Lock,
    title: "Blockchain Security",
    description: "All game state secured by Bitcoin's immutable ledger.",
    color: "green",
    details: ["Immutable records", "Decentralized", "Trustless"]
  },
  {
    icon: Repeat,
    title: "Procedural Generation",
    description: "Every dungeon floor is unique with algorithmically generated encounters.",
    color: "indigo",
    details: ["Infinite replayability", "Unique experiences", "Always fresh"]
  }
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-16 px-6 bg-muted/20">
      <div className="container mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="text-center mb-12">
          <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1 text-xs font-semibold mb-4">
            Core Features
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold game-title mb-4">
            Revolutionary Gaming Experience
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            True digital ownership, permanent consequences, and gameplay that matters beyond the screen.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className={`group bg-card/80 border border-${feature.color}-500/20 hover:border-${feature.color}-500/40 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02]`}
            >
              <CardHeader className="pb-2 pt-5 px-5">
                <div className={`w-10 h-10 bg-${feature.color}-500/20 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`w-5 h-5 text-${feature.color}-500`} />
                </div>
                <CardTitle className="text-base font-bold">{feature.title}</CardTitle>
                <CardDescription className="text-sm leading-snug pt-1">
                  {feature.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-3 pb-5 px-5">
                <div className="space-y-1">
                  {feature.details.map((detail, detailIndex) => (
                    <div key={detailIndex} className="flex items-center gap-2">
                      <div className={`w-1 h-1 bg-${feature.color}-500 rounded-full flex-shrink-0`}></div>
                      <span className="text-xs text-muted-foreground">{detail}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Technology Highlight */}
        <Card className="bg-card/60 border border-primary/20 backdrop-blur-sm">
          <CardContent className="p-6 sm:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1 text-xs">
                  Powered by Bitcoin
                </Badge>
                <h3 className="text-2xl sm:text-3xl font-bold game-title">
                  Secured by Bitcoin's Network
                </h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  Your game progress, achievements, and items are protected by Bitcoin's 
                  unbreakable security. When you earn something, it's yours forever.
                </p>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="space-y-1">
                    <div className="font-semibold text-sm text-foreground">Your Items</div>
                    <div className="text-xs text-muted-foreground">Truly owned assets</div>
                  </div>
                  <div className="space-y-1">
                    <div className="font-semibold text-sm text-foreground">Game Progress</div>
                    <div className="text-xs text-muted-foreground">Permanent records</div>
                  </div>
                  <div className="space-y-1">
                    <div className="font-semibold text-sm text-foreground">Resurrection</div>
                    <div className="text-xs text-muted-foreground">Real Bitcoin mechanics</div>
                  </div>
                  <div className="space-y-1">
                    <div className="font-semibold text-sm text-foreground">Decentralized</div>
                    <div className="text-xs text-muted-foreground">No central control</div>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="bg-muted/30 rounded-xl p-6 border border-border/50">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-2.5 bg-card/50 rounded-lg">
                      <span className="text-sm font-medium">Your Progress</span>
                      <Badge variant="outline" className="text-xs">Never Lost</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2.5 bg-card/50 rounded-lg">
                      <span className="text-sm font-medium">Legendary Items</span>
                      <Badge variant="outline" className="text-xs">You Own Them</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2.5 bg-card/50 rounded-lg">
                      <span className="text-sm font-medium">Second Chances</span>
                      <Badge variant="outline" className="text-xs">Risk Bitcoin</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2.5 bg-card/50 rounded-lg">
                      <span className="text-sm font-medium">Your Legacy</span>
                      <Badge variant="outline" className="text-xs">Forever Recorded</Badge>
                    </div>
                  </div>
                </div>
                <div className="absolute -top-3 -right-3 w-12 h-12 bg-primary/20 rounded-full blur-xl"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}