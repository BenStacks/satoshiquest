/**
 * Wallet Service - Handles Stacks wallet connection and interactions for Satoshi's Quest
 * Manages STX and sBTC balances, transactions, and wallet state
 * Updated with modern Stacks Connect API
 */

import { 
  connect, 
  isConnected,
  disconnect,
  request,
  getLocalStorage
} from '@stacks/connect';
import { 
  verifyMessageSignature
} from '@stacks/encryption';
import { 
  STACKS_TESTNET, 
  STACKS_MAINNET,
  StacksNetwork 
} from '@stacks/network';
import { 
  uintCV, 
  principalCV, 
  noneCV, 
  someCV,
  bufferCV,
  PostConditionMode,
  makeContractCall,
  broadcastTransaction,
  AnchorMode
} from '@stacks/transactions';
import { createClient } from '@stacks/blockchain-api-client';
import { WalletState } from '../types/game';

// Extend window interface for wallet providers
declare global {
  interface Window {
    StacksProvider?: any;
    LeatherProvider?: any;
    XverseProviders?: any;
  }
}

export interface WalletInfo {
  address: string;
  publicKey: string;
  profile?: any;
  isConnected: boolean;
}

export interface StxBalanceResponse {
  balance: string;
  total_sent: string;
  total_received: string;
  total_fees_sent: string;
  total_miner_rewards_received: string;
  lock_tx_id: string;
  locked: string;
  lock_height: number;
  burnchain_lock_height: number;
  burnchain_unlock_height: number;
}

export interface WalletConnectionResult {
  address: string;
  publicKey: string;
  profile?: any;
  isConnected: boolean;
  walletType: string;
  network: 'mainnet' | 'testnet';
}

export interface WalletSignatureResult {
  signature: string;
  publicKey: string;
  address: string;
  message: string;
}

export interface GameTransactionResult {
  txId: string;
  success: boolean;
  error?: string;
}

/**
 * WalletService - Satoshi's Quest wallet connection and blockchain interactions
 * 
 * This service handles:
 * 1. Wallet connection (Stacks wallets like Leather, Xverse)
 * 2. STX and sBTC balance checking
 * 3. Game-specific blockchain transactions (NFT minting, burning, resurrection)
 * 4. Message signing for authentication
 */
export class WalletService {
  private network: StacksNetwork;
  private apiClient: any;
  private appConfig = {
    name: "Satoshi's Quest",
    icon: typeof window !== 'undefined' ? window.location.origin + '/favicon.ico' : '',
  };

  // Track explicit wallet connection state
  private explicitlyConnected: boolean = false;
  
  // Contract addresses for game mechanics
  private readonly CONTRACTS = {
    mainnet: {
      sbtc: 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token',
      questLoot: '', // Will be deployed
      questCore: '', // Will be deployed
      questTombstone: '' // Will be deployed
    },
    testnet: {
      sbtc: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.sbtc-token', // Test contract
      questLoot: '', // Will be deployed
      questCore: '', // Will be deployed
      questTombstone: '' // Will be deployed
    }
  };

  constructor() {
    const isMainnet = process.env.NEXT_PUBLIC_STACKS_NETWORK === 'mainnet';
    this.network = isMainnet ? STACKS_MAINNET : STACKS_TESTNET;
    
    this.apiClient = createClient({
      baseUrl: isMainnet ? 'https://api.hiro.so' : 'https://api.testnet.hiro.so'
    });
    
    // Check if there's a stored explicit connection
    if (typeof window !== 'undefined') {
      this.explicitlyConnected = localStorage.getItem('satoshi_quest_wallet_connected') === 'true';
    }
  }

  /**
   * Mark wallet as explicitly connected
   */
  private markAsExplicitlyConnected(): void {
    this.explicitlyConnected = true;
    if (typeof window !== 'undefined') {
      localStorage.setItem('satoshi_quest_wallet_connected', 'true');
    }
  }

  /**
   * Clear explicit connection state
   */
  private clearExplicitConnection(): void {
    this.explicitlyConnected = false;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('satoshi_quest_wallet_connected');
    }
  }

  /**
   * Check if wallet is explicitly connected through our app
   */
  isExplicitlyConnected(): boolean {
    return this.explicitlyConnected;
  }

  /**
   * Connect to a Stacks wallet
   * This method explicitly connects the wallet and marks it as connected through our app
   */
  async connectWallet(): Promise<WalletConnectionResult> {
    try {
      console.log("🎮 Starting Satoshi's Quest wallet connection...");
      
      const response = await connect();
      console.log("Wallet connection response:", response);

      const userData = getLocalStorage();
      console.log("User Data:", userData);
      
      // Helper to safely access wallet response
      const getWalletAddresses = (response: any) => {
        return {
          stx: response?.addresses?.stx?.[0]?.address,
          btc: response?.addresses?.btc?.[0]?.address
        };
      };

      const { stx, btc } = getWalletAddresses(userData);
      console.log("Extracted addresses:", { stx, btc });
      
      if (stx) {
        // Mark as explicitly connected ONLY after successful connection
        this.markAsExplicitlyConnected();
        
        return {
          address: stx,
          publicKey: (userData as any)?.profile?.publicKey || (userData as any)?.publicKey || '',
          profile: (userData as any)?.profile || userData,
          isConnected: true,
          walletType: this.detectWalletType(),
          network: this.network === STACKS_MAINNET ? 'mainnet' : 'testnet',
        };
      } else {
        throw new Error("Failed to retrieve wallet addresses");
      }
    } catch (error) {
      console.error('❌ Error connecting wallet:', error);
      throw new Error('Failed to connect wallet');
    }
  }

  /**
   * Switch between mainnet and testnet
   */
  switchNetwork(network: 'mainnet' | 'testnet'): void {
    this.network = network === 'mainnet' ? STACKS_MAINNET : STACKS_TESTNET;
    this.apiClient = createClient({
      baseUrl: network === 'mainnet' 
        ? 'https://api.hiro.so' 
        : 'https://api.testnet.hiro.so'
    });
    console.log(`🔄 Switched to ${network}`);
  }

  /**
   * Check if wallet is currently connected
   */
  async isWalletConnected(): Promise<boolean> {
    try {
      return await isConnected() && this.explicitlyConnected;
    } catch (error) {
      console.error('Error checking wallet connection:', error);
      return false;
    }
  }

  /**
   * Get current wallet data if explicitly connected through our app
   */
  async getCurrentWalletData(): Promise<WalletConnectionResult | null> {
    try {
      // First check if wallet was explicitly connected through our app
      if (!this.explicitlyConnected) {
        console.log("Wallet not explicitly connected through Satoshi's Quest");
        return null;
      }

      const connected = await isConnected();
      if (!connected) {
        console.log("Stacks wallet not connected");
        // Clear our explicit connection flag if Stacks connect says not connected
        this.clearExplicitConnection();
        return null;
      }

      const walletData = getLocalStorage();
      if (!walletData) {
        console.log("No wallet data available");
        return null;
      }

      // Helper to safely access wallet response
      const getWalletAddresses = (response: any) => {
        return {
          stx: response?.addresses?.stx?.[0]?.address,
          btc: response?.addresses?.btc?.[0]?.address
        };
      };

      const { stx, btc } = getWalletAddresses(walletData);

      if (!stx) {
        console.log("No Stacks address found in wallet data");
        return null;
      }

      return {
        address: stx,
        publicKey: (walletData as any)?.profile?.publicKey || (walletData as any)?.publicKey || '',
        profile: (walletData as any)?.profile || walletData,
        isConnected: true,
        walletType: this.detectWalletType(),
        network: this.network === STACKS_MAINNET ? 'mainnet' : 'testnet',
      };
    } catch (error) {
      console.error('❌ Failed to get current wallet data:', error);
      return null;
    }
  }

  /**
   * Get current wallet address if explicitly connected
   */
  async getCurrentAddress(): Promise<string | null> {
    try {
      // First check if wallet was explicitly connected through our app
      if (!this.explicitlyConnected) {
        console.log("Wallet not explicitly connected through Satoshi's Quest");
        return null;
      }

      if (!await isConnected()) {
        // Clear our explicit connection flag if Stacks connect says not connected
        this.clearExplicitConnection();
        return null;
      }

      const userData = getLocalStorage();
      
      // Helper to safely access wallet response
      const getWalletAddresses = (response: any) => {
        return {
          stx: response?.addresses?.stx?.[0]?.address,
          btc: response?.addresses?.btc?.[0]?.address
        };
      };

      const { stx } = getWalletAddresses(userData);
      return stx || null;
    } catch (error) {
      console.error('Error getting wallet address:', error);
      return null;
    }
  }

  /**
   * Get STX balance for connected wallet
   */
  async getStxBalance(): Promise<bigint> {
    try {
      // First check if wallet was explicitly connected through our app
      if (!this.explicitlyConnected) {
        console.log("Wallet not explicitly connected through Satoshi's Quest");
        return BigInt(0);
      }

      const address = await this.getCurrentAddress();
      if (!address) {
        throw new Error('No wallet connected');
      }

      // Use the better API endpoint (v2)
      const apiUrl = this.network === STACKS_MAINNET 
        ? 'https://api.hiro.so'
        : 'https://api.testnet.hiro.so';

      const response = await fetch(`${apiUrl}/extended/v2/addresses/${address}/balances/stx?include_mempool=false`);
      if (!response.ok) {
        throw new Error('Failed to fetch balance');
      }

      const data = await response.json() as StxBalanceResponse;
      console.log("STX Balance Response:", data);
      
      // Return balance in microSTX
      return BigInt(data.balance || '0');
    } catch (error) {
      console.error('Error getting STX balance:', error);
      throw new Error('Failed to get STX balance');
    }
  }

  /**
   * Get sBTC balance for connected wallet
   */
  async getSbtcBalance(): Promise<string> {
    const walletData = await this.getCurrentWalletData();
    if (!walletData) throw new Error('No wallet connected');

    try {
      const currentNetwork = this.network === STACKS_MAINNET ? 'mainnet' : 'testnet';
      const contractAddress = this.CONTRACTS[currentNetwork].sbtc.split('.')[0];
      const contractName = this.CONTRACTS[currentNetwork].sbtc.split('.')[1];

      const response = await this.apiClient.GET('/v2/contracts/call-read/{contract_address}/{contract_name}/{function_name}', {
        params: {
          path: {
            contract_address: contractAddress,
            contract_name: contractName,
            function_name: 'get-balance'
          }
        },
        body: {
          sender: walletData.address,
          arguments: [walletData.address]
        }
      });

      // Parse the Clarity response
      const balanceData = response.data;
      if (balanceData && balanceData.result) {
        // Extract balance from Clarity uint response
        const balance = balanceData.result.replace('u', '');
        return balance;
      }

      return '0';
    } catch (error) {
      console.error('Failed to fetch sBTC balance:', error);
      // Return 0 instead of throwing to handle cases where sBTC contract doesn't exist
      return '0';
    }
  }

  /**
   * Mint NFT loot item to player wallet (placeholder for Phase 2)
   */
  async mintLootNFT(
    itemName: string, 
    itemType: string, 
    rarity: string, 
    metadata: string
  ): Promise<GameTransactionResult> {
    const walletData = await this.getCurrentWalletData();
    if (!walletData) throw new Error('No wallet connected');

    console.log('🎯 Minting loot NFT:', { itemName, itemType, rarity });
    
    // For Phase 1, return mock success
    return {
      txId: 'mock-mint-' + Date.now(),
      success: true
    };
  }

  /**
   * Burn loot NFTs on character death (placeholder for Phase 2)
   */
  async burnLootNFTs(nftIds: string[]): Promise<GameTransactionResult> {
    const walletData = await this.getCurrentWalletData();
    if (!walletData) throw new Error('No wallet connected');

    console.log('🔥 Burning loot NFTs:', nftIds);
    
    // For Phase 1, return mock success
    return {
      txId: 'mock-burn-' + Date.now(),
      success: true
    };
  }

  /**
   * Create legacy tombstone NFT (placeholder for Phase 2)
   */
  async createTombstone(
    characterName: string,
    finalLevel: number,
    deepestFloor: number,
    burnedItems: string[]
  ): Promise<GameTransactionResult> {
    const walletData = await this.getCurrentWalletData();
    if (!walletData) throw new Error('No wallet connected');

    console.log('🪦 Creating tombstone NFT:', { characterName, finalLevel, deepestFloor });
    
    // For Phase 1, return mock success
    return {
      txId: 'mock-tombstone-' + Date.now(),
      success: true
    };
  }

  /**
   * Attempt sBTC resurrection (the killer feature!)
   */
  async attemptResurrection(sbtcAmount: number): Promise<GameTransactionResult> {
    const walletData = await this.getCurrentWalletData();
    if (!walletData) throw new Error('No wallet connected');

    try {
      console.log('🎲 Attempting sBTC resurrection:', {
        address: walletData.address,
        sbtcAmount: sbtcAmount,
        network: walletData.network
      });

      // For Phase 1, simulate the resurrection mechanic
      return new Promise((resolve) => {
        // Simulate 50/50 chance for demo
        const success = Math.random() > 0.5;
        
        setTimeout(() => {
          resolve({
            txId: 'mock-resurrection-' + Date.now(),
            success,
            error: success ? undefined : 'The ancient coin crumbles to dust... resurrection failed'
          });
        }, 2000);
      });

    } catch (error) {
      console.error('Resurrection failed:', error);
      return {
        txId: '',
        success: false,
        error: error instanceof Error ? error.message : 'Resurrection failed'
      };
    }
  }

  /**
   * Sign a message with the connected wallet
   */
  async signMessage(message: string): Promise<WalletSignatureResult> {
    try {
      const walletData = await this.getCurrentWalletData();
      if (!walletData) {
        throw new Error('No wallet connected');
      }

      console.log('✍️ Signing message with wallet...');
      console.log('📝 Message to sign:', message);
      console.log('🔑 Using public key:', walletData.publicKey);

      // Use the modern request API for message signing
      const result = await request('stx_signMessage', {
        message,
        publicKey: walletData.publicKey
      });

      console.log('✅ Message signed successfully');

      // Ensure signature is in the correct format
      let processedSignature = result.signature;
      if (typeof result.signature === 'string') {
        // Remove 0x prefix if present
        if (result.signature.startsWith('0x')) {
          processedSignature = result.signature.slice(2);
        }
      }

      return {
        signature: processedSignature,
        publicKey: result.publicKey,
        address: walletData.address,
        message: message,
      };

    } catch (error) {
      console.error('❌ Message signing failed:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to sign message');
    }
  }

  /**
   * Verify a message signature locally
   */
  verifySignature(message: string, signature: string, publicKey: string): boolean {
    try {
      return verifyMessageSignature({
        message,
        signature,
        publicKey,
      });
    } catch (error) {
      console.error('❌ Local signature verification failed:', error);
      return false;
    }
  }

  /**
   * Disconnect wallet
   */
  async disconnectWallet(): Promise<void> {
    try {
      await disconnect();
      this.clearExplicitConnection();
      console.log('🔌 Wallet disconnected from Satoshi\'s Quest');
    } catch (error) {
      console.error('❌ Wallet disconnection failed:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to disconnect wallet');
    }
  }

  /**
   * Get network info
   */
  getNetworkInfo() {
    return {
      network: this.network,
      isMainnet: this.network === STACKS_MAINNET,
      stacksApiUrl: this.network === STACKS_MAINNET 
        ? 'https://api.mainnet.hiro.so'
        : 'https://api.testnet.hiro.so',
    };
  }

  /**
   * Get owned NFTs (for loot items and tombstones)
   */
  async getOwnedNFTs(): Promise<any[]> {
    const walletData = await this.getCurrentWalletData();
    if (!walletData) throw new Error('No wallet connected');

    try {
      const response = await this.apiClient.GET('/extended/v1/tokens/nft/holdings', {
        params: {
          query: { principal: walletData.address }
        }
      });

      return response.data?.results || [];
    } catch (error) {
      console.error('Failed to fetch NFTs:', error);
      return [];
    }
  }

  /**
   * Detect wallet type based on available providers
   */
  private detectWalletType(): string {
    if (typeof window === 'undefined') return 'unknown';
    
    if (window.LeatherProvider) return 'leather';
    if (window.XverseProviders) return 'xverse';
    if (window.StacksProvider) return 'stacks';
    
    return 'unknown';
  }

  /**
   * Format balance for display
   */
  formatBalance(balance: string | bigint, currency: 'STX' | 'SBTC'): string {
    const num = typeof balance === 'bigint' ? Number(balance) : Number(balance);
    
    if (currency === 'STX') {
      return (num / 1_000_000).toFixed(6); // microSTX to STX
    } else {
      return (num / 100_000_000).toFixed(8); // satoshis to BTC
    }
  }

  /**
   * Get explorer URL for transaction
   */
  getExplorerUrl(txId: string): string {
    const baseUrl = this.network === STACKS_MAINNET
      ? 'https://explorer.hiro.so'
      : 'https://explorer.hiro.so/?chain=testnet';
    
    return `${baseUrl}/txid/${txId}`;
  }
}

// Export singleton instance
export const walletService = new WalletService();
export default walletService;
