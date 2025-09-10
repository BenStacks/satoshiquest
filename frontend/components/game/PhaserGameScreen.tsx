'use client';

import dynamic from 'next/dynamic';
import { Card, CardContent } from '@/components/ui/card';

interface PhaserGameScreenProps {
  walletAddress: string;
  onGameEnd?: (reason: string) => void;
}

// Dynamically import the client-side Phaser game component to avoid SSR issues
const PhaserGameClient = dynamic(
  () => import('./PhaserGameClient'),
  { 
    ssr: false,
    loading: () => (
      <Card className="w-full max-w-7xl mx-auto">
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-current border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p>Loading Phaser.js Game Engine...</p>
          </div>
        </CardContent>
      </Card>
    )
  }
);

export default function PhaserGameScreen({ walletAddress, onGameEnd }: PhaserGameScreenProps) {
  return <PhaserGameClient walletAddress={walletAddress} onGameEnd={onGameEnd} />;
}
