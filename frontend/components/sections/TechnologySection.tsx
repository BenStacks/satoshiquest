'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield,
  Trophy,
  Lock,
  Zap,
  Coins,
  Globe
} from 'lucide-react';

const benefits = [
  {
    icon: Lock,
    title: "Your Progress Never Disappears",
    description: "Game achievements are permanently saved. No company can delete them, ever.",
    color: "green"
  },
  {
    icon: Shield,
    title: "Items You Actually Own",
    description: "Legendary weapons and armor exist in your wallet. Trade them or keep them forever.",
    color: "purple"
  },
  {
    icon: Zap,
    title: "Fair Gaming Guaranteed",
    description: "All random events are mathematically provable and can't be rigged by anyone.",
    color: "yellow"
  },
  {
    icon: Globe,
    title: "Game Can't Be Shut Down",
    description: "Runs on Bitcoin's network. No single company controls or can stop it.",
    color: "blue"
  },
  {
    icon: Trophy,
    title: "Your Legacy Lives Forever",
    description: "Every achievement and milestone is recorded permanently on the blockchain.",
    color: "orange"
  },
  {
    icon: Coins,
    title: "Real Value, Real Stakes",
    description: "Your loot has genuine value. Trade it, sell it, or treasure it - your choice.",
    color: "red"
  }
];

export default function TechnologySection() {
  return (
    <section id="technology" className="py-16 px-6">
      <div className="container mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="text-center mb-12">
          <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1 text-xs font-semibold mb-4">
            Why This Matters
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold game-title mb-4">
            Gaming That Actually Respects You
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Your achievements matter, your items have real value, and your progress 
            is protected by the world's most secure network.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {benefits.map((benefit, index) => (
            <Card 
              key={index} 
              className={`group bg-gradient-to-br from-card via-card to-card/80 border border-${benefit.color}-500/20 hover:border-${benefit.color}-500/40 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1`}
            >
              <CardContent className="p-5">
                <div className={`w-12 h-12 bg-gradient-to-br from-${benefit.color}-500/20 to-${benefit.color}-600/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-${benefit.color}-500/10`}>
                  <benefit.icon className={`w-6 h-6 text-${benefit.color}-400`} />
                </div>
                <h3 className="text-base font-bold text-foreground mb-2 leading-tight">
                  {benefit.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {benefit.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Value Proposition */}
        <Card className="bg-gradient-to-br from-card/95 to-card/80 border border-primary/20 backdrop-blur-sm overflow-hidden">
          <CardContent className="p-6 sm:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-5 text-center lg:text-left">
                <div className="space-y-3">
                  <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1 text-xs">
                    Secured by Bitcoin
                  </Badge>
                  <h3 className="text-2xl sm:text-3xl font-bold game-title">
                    Why Bitcoin Changes Everything
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Traditional games? The company owns everything. They can delete your account, 
                    shut down servers, or take away items you "earned." Not here.
                  </p>
                </div>
                
                <div className="space-y-3 pt-2">
                  <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                    <div className="font-semibold text-sm text-foreground mb-1">Traditional Games</div>
                    <div className="text-xs text-muted-foreground">
                      Company owns everything. Items disappear if servers shut down.
                    </div>
                  </div>
                  
                  <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <div className="font-semibold text-sm text-primary mb-1">Satoshi's Quest</div>
                    <div className="text-xs text-muted-foreground">
                      You own everything. Items are yours forever, no matter what.
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="relative">
                <div className="bg-gradient-to-br from-muted/40 to-muted/20 rounded-xl p-6 border border-border/50 backdrop-blur-sm">
                  <div className="space-y-4">
                    <div className="text-center pb-4 border-b border-border/50">
                      <h4 className="text-lg font-bold game-title mb-2">What You Get</h4>
                      <p className="text-xs text-muted-foreground">Real ownership, real value</p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-card/50 rounded-lg">
                        <span className="text-sm font-medium">Your Items</span>
                        <Badge variant="outline" className="text-xs">In Your Wallet</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-card/50 rounded-lg">
                        <span className="text-sm font-medium">Your Progress</span>
                        <Badge variant="outline" className="text-xs">Never Lost</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-card/50 rounded-lg">
                        <span className="text-sm font-medium">Your Legacy</span>
                        <Badge variant="outline" className="text-xs">Forever Recorded</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-card/50 rounded-lg">
                        <span className="text-sm font-medium">Your Control</span>
                        <Badge variant="outline" className="text-xs">100% Yours</Badge>
                      </div>
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