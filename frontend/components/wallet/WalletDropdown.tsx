'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Wallet, 
  ChevronDown, 
  Copy, 
  ExternalLink, 
  LogOut,
  Bitcoin,
  Coins,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { WalletConnectionResult, walletService } from '@/lib/services/wallet-service';

interface WalletDropdownProps {
  walletData: WalletConnectionResult;
  onDisconnect: () => void;
}

export default function WalletDropdown({ walletData, onDisconnect }: WalletDropdownProps) {
  const [stxBalance, setStxBalance] = useState<string>('Loading...');
  const [sbtcBalance, setSbtcBalance] = useState<string>('Loading...');
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);

  React.useEffect(() => {
    loadBalances();
  }, []);

  const loadBalances = async () => {
    try {
      setIsLoadingBalances(true);
      
      const stxBal = await walletService.getStxBalance();
      setStxBalance(walletService.formatBalance(stxBal, 'STX'));

      const sbtcBal = await walletService.getSbtcBalance();
      setSbtcBalance(walletService.formatBalance(sbtcBal, 'SBTC'));
      
    } catch (error) {
      console.error('Failed to load balances:', error);
      setStxBalance('Error');
      setSbtcBalance('Error');
    } finally {
      setIsLoadingBalances(false);
    }
  };

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(walletData.address);
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  const openExplorer = () => {
    const baseUrl = walletData.network === 'mainnet' 
      ? 'https://explorer.stacks.co' 
      : 'https://explorer.stacks.co/?chain=testnet';
    window.open(`${baseUrl}/address/${walletData.address}`, '_blank');
  };

 return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 h-9">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <Wallet className="w-4 h-4" />
          <span className="hidden sm:inline font-mono text-sm">
            {walletData.address.slice(0, 4)}...{walletData.address.slice(-4)}
          </span>
          <ChevronDown className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground pb-2">
          {walletData.walletType}
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {/* Address */}
        <div className="px-2 py-2">
          <div className="text-xs font-mono bg-muted hover:bg-muted/80 p-2 rounded flex items-center justify-between group">
            <span className="truncate text-foreground">{walletData.address}</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={copyAddress} 
              className="h-5 w-5 p-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Copy className="w-3 h-3" />
            </Button>
          </div>
        </div>

        <DropdownMenuSeparator />
        
        {/* Balances */}
        <div className="px-2 py-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Balances</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={loadBalances}
              disabled={isLoadingBalances}
              className="h-5 w-5 p-0"
            >
              <RefreshCw className={`w-3 h-3 ${isLoadingBalances ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/30 rounded p-2 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Coins className="w-3 h-3 text-orange-600 dark:text-orange-400" />
                <span className="text-xs font-medium text-orange-800 dark:text-orange-300">STX</span>
              </div>
              <div className="text-xs font-mono text-orange-900 dark:text-orange-100">
                {isLoadingBalances ? '...' : stxBalance}
              </div>
            </div>
            
            <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800/30 rounded p-2 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Bitcoin className="w-3 h-3 text-yellow-600 dark:text-yellow-400" />
                <span className="text-xs font-medium text-yellow-800 dark:text-yellow-300">sBTC</span>
              </div>
              <div className="text-xs font-mono text-yellow-900 dark:text-yellow-100">
                {isLoadingBalances ? '...' : sbtcBalance}
              </div>
            </div>
          </div>
        </div>

        <DropdownMenuSeparator />
        
        {/* Actions */}
        <DropdownMenuItem onClick={openExplorer} className="cursor-pointer text-sm py-2">
          <ExternalLink className="w-4 h-4 mr-2" />
          View Explorer
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={copyAddress} className="cursor-pointer text-sm py-2">
          <Copy className="w-4 h-4 mr-2" />
          Copy Address
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={onDisconnect} className="cursor-pointer text-sm py-2 text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400">
          <LogOut className="w-4 h-4 mr-2" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}