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
      <div className="w-full max-w-7xl mx-auto">
        <Card className="shadow-lg border-primary/30">
          <CardContent className="flex items-center justify-center p-12">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-primary">Loading Game Engine</h3>
                <p className="text-sm text-muted-foreground">Initializing Phaser.js...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
);

export default function PhaserGameScreen({ walletAddress, onGameEnd }: PhaserGameScreenProps) {
  return <PhaserGameClient walletAddress={walletAddress} onGameEnd={onGameEnd} />;
}
