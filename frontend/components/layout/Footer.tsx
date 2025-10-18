'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { 
  Bitcoin, 
  Github, 
  ExternalLink, 
  BookOpen,
  Twitter,
  MessageCircle
} from 'lucide-react';

export default function Footer() {
  return (
    <footer className="py-16 px-6 border-t border-border/50 bg-card/30">
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Bitcoin className="w-8 h-8 text-primary" />
                <div className="absolute -inset-1 bg-primary/20 rounded-full blur-sm -z-10"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold game-title text-foreground">Satoshi's Quest</span>
                <span className="text-xs text-muted-foreground">Bitcoin-Powered Roguelike</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              The first truly decentralized roguelike where your achievements 
              are permanently recorded on Bitcoin's immutable ledger.
            </p>
          </div>

          {/* Game */}
          <div className="space-y-4">
            <h3 className="font-bold text-foreground">Game</h3>
            <div className="space-y-3">
              <Button 
                variant="ghost" 
                size="sm" 
                className="justify-start p-0 h-auto text-muted-foreground hover:text-foreground"
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Features
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="justify-start p-0 h-auto text-muted-foreground hover:text-foreground"
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              >
                How to Play
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="justify-start p-0 h-auto text-muted-foreground hover:text-foreground"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                Play Now
              </Button>
            </div>
          </div>

          {/* Technology */}
          <div className="space-y-4">
            <h3 className="font-bold text-foreground">Technology</h3>
            <div className="space-y-3">
              <Button 
                variant="ghost" 
                size="sm" 
                className="justify-start p-0 h-auto text-muted-foreground hover:text-foreground"
                onClick={() => document.getElementById('technology')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Blockchain Stack
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="justify-start p-0 h-auto text-muted-foreground hover:text-foreground"
                asChild
              >
                <a href="https://stacks.co" target="_blank" rel="noopener noreferrer">
                  Stacks Network
                </a>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="justify-start p-0 h-auto text-muted-foreground hover:text-foreground"
                asChild
              >
                <a href="https://sbtc.tech" target="_blank" rel="noopener noreferrer">
                  sBTC Protocol
                </a>
              </Button>
            </div>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h3 className="font-bold text-foreground">Resources</h3>
            <div className="space-y-3">
              <Button 
                variant="ghost" 
                size="sm" 
                className="justify-start p-0 h-auto text-muted-foreground hover:text-foreground"
                asChild
              >
                <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                  <Github className="w-4 h-4 mr-2" />
                  Source Code
                </a>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="justify-start p-0 h-auto text-muted-foreground hover:text-foreground"
                asChild
              >
                <a href="#" target="_blank" rel="noopener noreferrer">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Documentation
                </a>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="justify-start p-0 h-auto text-muted-foreground hover:text-foreground"
                asChild
              >
                <a href="#" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Block Explorer
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-8 border-t border-border/50">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-col md:flex-row items-center gap-4 text-sm text-muted-foreground">
              <span>© 2024 Satoshi's Quest</span>
              <div className="hidden md:block w-1 h-1 bg-muted-foreground rounded-full"></div>
              <span>Built on Stacks • Secured by Bitcoin</span>
            </div>
            
            <div className="flex items-center gap-6">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-muted-foreground hover:text-foreground"
                asChild
              >
                <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                  <Github className="w-4 h-4" />
                </a>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-muted-foreground hover:text-foreground"
                asChild
              >
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                  <Twitter className="w-4 h-4" />
                </a>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-muted-foreground hover:text-foreground"
                asChild
              >
                <a href="https://discord.com" target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-4 h-4" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}