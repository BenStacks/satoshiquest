'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wallet, Bitcoin, Coins, Network, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { walletService, type WalletConnectionResult } from '@/lib/services/wallet-service';

interface WalletConnectProps {
  onWalletConnected?: (walletData: WalletConnectionResult) => void;
  onWalletDisconnected?: () => void;
  showBalances?: boolean;
}

export default function WalletConnect({ 
  onWalletConnected, 
  onWalletDisconnected, 
  showBalances = true 
}: WalletConnectProps) {
  const [walletData, setWalletData] = useState<WalletConnectionResult | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stxBalance, setStxBalance] = useState<string>('0');
  const [sbtcBalance, setSbtcBalance] = useState<string>('0');
  const [loadingBalances, setLoadingBalances] = useState(false);

  // Check for existing connection on mount
  useEffect(() => {
    checkExistingConnection();
  }, []);

  // Load balances when wallet is connected
  useEffect(() => {
    if (walletData && showBalances) {
      loadBalances();
    }
  }, [walletData, showBalances]);

  const checkExistingConnection = async () => {
    try {
      const existingWallet = await walletService.getCurrentWalletData();
      if (existingWallet) {
        setWalletData(existingWallet);
        onWalletConnected?.(existingWallet);
        console.log('🎮 Existing wallet connection found:', existingWallet);
      }
    } catch (error) {
      console.error('Error checking existing connection:', error);
    }
  };

  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      
      console.log('🎮 Connecting wallet for Satoshi\'s Quest...');
      const wallet = await walletService.connectWallet();
      
      setWalletData(wallet);
      onWalletConnected?.(wallet);
      
      console.log('✅ Wallet connected successfully:', wallet);
    } catch (error) {
      console.error('❌ Wallet connection failed:', error);
      setError(error instanceof Error ? error.message : 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      await walletService.disconnectWallet();
      setWalletData(null);
      setStxBalance('0');
      setSbtcBalance('0');
      onWalletDisconnected?.();
      console.log('🔌 Wallet disconnected');
    } catch (error) {
      console.error('❌ Disconnect failed:', error);
      setError('Failed to disconnect wallet');
    }
  };

  const loadBalances = async () => {
    if (!walletData) return;

    try {
      setLoadingBalances(true);
      
      console.log('💰 Loading wallet balances...');
      
      // Load STX balance
      const stxBal = await walletService.getStxBalance();
      setStxBalance(walletService.formatBalance(stxBal, 'STX'));

      // Load sBTC balance
      const sbtcBal = await walletService.getSbtcBalance();
      setSbtcBalance(walletService.formatBalance(sbtcBal, 'SBTC'));
      
      console.log('💰 Balances loaded:', {
        stx: walletService.formatBalance(stxBal, 'STX'),
        sbtc: walletService.formatBalance(sbtcBal, 'SBTC')
      });
      
    } catch (error) {
      console.error('❌ Failed to load balances:', error);
      setError('Failed to load wallet balances');
    } finally {
      setLoadingBalances(false);
    }
  };

  const networkInfo = walletService.getNetworkInfo();

  if (!walletData) {
    return (
      <div className="relative">
        <Button 
          onClick={connectWallet} 
          disabled={isConnecting}
          className="w-full"
        >
          {isConnecting ? (
            <>
              <div className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Wallet className="w-4 h-4 mr-2" />
              Connect Wallet
            </>
          )}
        </Button>
        
        {error && (
          <Alert variant="destructive" className="absolute top-full mt-2 w-full z-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Wallet Connected
          </div>
          <Badge variant="secondary">
            {walletData.walletType}
          </Badge>
        </CardTitle>
        <CardDescription>
          Ready to enter Satoshi's Quest
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Wallet Info */}
        <div className="p-3 bg-muted rounded-lg space-y-2">
          <div className="text-sm font-medium">Address</div>
          <div className="text-xs font-mono text-muted-foreground break-all">
            {walletData.address}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Network className="w-3 h-3" />
            {walletData.network === 'mainnet' ? 'Mainnet' : 'Testnet'}
          </div>
        </div>

        {/* Balances */}
        {showBalances && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Balances</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={loadBalances}
                disabled={loadingBalances}
              >
                {loadingBalances ? (
                  <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Refresh'
                )}
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Coins className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-800">STX</span>
                </div>
                <div className="text-sm font-mono text-orange-900">
                  {loadingBalances ? '...' : stxBalance}
                </div>
              </div>
              
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Bitcoin className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">sBTC</span>
                </div>
                <div className="text-sm font-mono text-yellow-900">
                  {loadingBalances ? '...' : sbtcBalance}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Game Info */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm font-medium text-blue-800 mb-1">⚔️ Ready for Adventure</div>
          <div className="text-xs text-blue-700">
            Your wallet is connected and ready. Loot NFTs will be minted to this address, 
            and sBTC can be used for resurrection attempts.
          </div>
        </div>

        {/* Disconnect Button */}
        <Button 
          variant="outline" 
          onClick={disconnectWallet}
          className="w-full"
        >
          Disconnect Wallet
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
