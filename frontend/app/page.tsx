'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/components/sections/HeroSection';
import FeaturesSection from '@/components/sections/FeaturesSection';
import HowItWorksSection from '@/components/sections/HowItWorksSection';
import TechnologySection from '@/components/sections/TechnologySection';
import { WalletConnectionResult } from '@/lib/services/wallet-service';

export default function Home() {
  const router = useRouter();
  const [walletData, setWalletData] = useState<WalletConnectionResult | null>(null);

  const handleWalletConnected = (wallet: WalletConnectionResult) => {
    setWalletData(wallet);
    // Store wallet data in session storage for route persistence
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('satoshiquest_wallet', JSON.stringify(wallet));
    }
    console.log('Wallet connected to Satoshi Quest:', wallet);
  };

  const handleWalletDisconnected = () => {
    setWalletData(null);
    // Clear wallet data from session storage
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('satoshiquest_wallet');
    }
    console.log('Wallet disconnected from Satoshi Quest');
  };

  const startGame = () => {
    if (walletData) {
      router.push('/game');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        walletData={walletData}
        onWalletConnected={handleWalletConnected}
        onWalletDisconnected={handleWalletDisconnected}
        onStartGame={startGame}
      />
      <HeroSection
        walletData={walletData}
        onStartGame={startGame}
      />
      <FeaturesSection />
      <HowItWorksSection />
      <TechnologySection />
      <Footer />
    </div>
  );
}