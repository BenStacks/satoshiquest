'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import WalletConnect from '@/components/wallet/WalletConnect';
import WalletDropdown from '@/components/wallet/WalletDropdown';
import { 
  Bitcoin, 
  Menu, 
  X,
  ExternalLink,
  Github,
  BookOpen
} from 'lucide-react';
import { WalletConnectionResult } from '@/lib/services/wallet-service';

interface NavbarProps {
  walletData: WalletConnectionResult | null;
  onWalletConnected: (wallet: WalletConnectionResult) => void;
  onWalletDisconnected: () => void;
  onStartGame?: () => void;
}

export default function Navbar({ 
  walletData, 
  onWalletConnected, 
  onWalletDisconnected,
  onStartGame 
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/95 backdrop-blur-lg border-b border-border/50">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bitcoin className="w-8 h-8 text-primary" />
              <div className="absolute -inset-1 bg-primary/20 rounded-full blur-sm -z-10"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold game-title text-foreground">Satoshi's Quest</span>
              <span className="text-xs text-muted-foreground hidden sm:block">Bitcoin-Powered Roguelike</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            <div className="flex items-center gap-6">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-muted-foreground hover:text-foreground"
                onClick={() => scrollToSection('features')}
              >
                Features
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-muted-foreground hover:text-foreground"
                onClick={() => scrollToSection('how-it-works')}
              >
                How to Play
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-muted-foreground hover:text-foreground"
                onClick={() => scrollToSection('technology')}
              >
                Technology
              </Button>
            </div>

            {/* Wallet Section */}
            <div className="flex items-center gap-3">
              <ThemeToggle />
              {walletData ? (
                <div className="flex items-center gap-3">
                  <WalletDropdown 
                    walletData={walletData}
                    onDisconnect={onWalletDisconnected}
                  />
                  <Button 
                    onClick={onStartGame}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6"
                  >
                    Play Now
                  </Button>
                </div>
              ) : (
                <WalletConnect 
                  onWalletConnected={onWalletConnected}
                  onWalletDisconnected={onWalletDisconnected}
                  showBalances={false}
                />
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center gap-3">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border/50 py-4">
            <div className="flex flex-col gap-4">
              {/* Navigation Links */}
              <div className="flex flex-col gap-2">
                <Button 
                  variant="ghost" 
                  className="justify-start text-muted-foreground hover:text-foreground"
                  onClick={() => scrollToSection('features')}
                >
                  Features
                </Button>
                <Button 
                  variant="ghost" 
                  className="justify-start text-muted-foreground hover:text-foreground"
                  onClick={() => scrollToSection('how-it-works')}
                >
                  How to Play
                </Button>
                <Button 
                  variant="ghost" 
                  className="justify-start text-muted-foreground hover:text-foreground"
                  onClick={() => scrollToSection('technology')}
                >
                  Technology
                </Button>
              </div>

              {/* Mobile Wallet */}
              <div className="pt-4 border-t border-border/50">
                <div className="space-y-3">
                  {walletData ? (
                    <>
                      <div className="flex justify-center">
                        <WalletDropdown 
                          walletData={walletData}
                          onDisconnect={onWalletDisconnected}
                        />
                      </div>
                      <Button 
                        onClick={() => {
                          onStartGame?.();
                          setMobileMenuOpen(false);
                        }}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                      >
                        Play Now
                      </Button>
                    </>
                  ) : (
                    <WalletConnect 
                      onWalletConnected={onWalletConnected}
                      onWalletDisconnected={onWalletDisconnected}
                      showBalances={false}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}