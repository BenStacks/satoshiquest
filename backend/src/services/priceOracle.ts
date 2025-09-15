/**
 * DIA Oracle Price Feed Service
 * 
 * This service fetches real-time BTC/sBTC prices from DIA Oracle API
 * and feeds them to the resurrection smart contract.
 * 
 * This approach eliminates the complex on-chain oracle integrations
 * that were causing deployment issues.
 */

import axios from 'axios';
import { StacksMainnet, StacksTestnet } from '@stacks/network';
import {
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  standardPrincipalCV,
  uintCV,
} from '@stacks/transactions';

// DIA Oracle API Configuration
const DIA_API_BASE_URL = 'https://api.diadata.org/v1';
const PRICE_UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes
const MAX_PRICE_AGE = 10 * 60 * 1000; // 10 minutes

// Contract Configuration
const CONTRACT_ADDRESS = process.env.RESURRECTION_CONTRACT_ADDRESS || 'ST2F3J1PK46D6XVRBB9SQ66PY89P8G0EBDW5E05M7';
const CONTRACT_NAME = 'satoshi-quest-resurrection';
const PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY!; // Contract owner's private key

// Network Configuration
const network = process.env.STACKS_NETWORK === 'mainnet' 
  ? new StacksMainnet() 
  : new StacksTestnet();

interface PriceData {
  symbol: string;
  name: string;
  price: number;
  time: string;
  source: string;
}

interface ResurrectionPriceUpdate {
  btcPrice: number;
  sBtcPrice: number;
  timestamp: number;
  priceInCents: number;
}

export class PriceOracleService {
  private lastPriceUpdate: number = 0;
  private currentPrice: number = 50000; // Default $50k
  private updateInterval: NodeJS.Timeout | null = null;

  /**
   * Fetch BTC price from DIA Oracle API
   */
  async fetchBTCPrice(): Promise<PriceData | null> {
    try {
      const response = await axios.get(`${DIA_API_BASE_URL}/quotation/Bitcoin`, {
        timeout: 10000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SatoshiQuest/1.0'
        }
      });

      if (response.data && response.data.Price) {
        return {
          symbol: response.data.Symbol || 'BTC',
          name: response.data.Name || 'Bitcoin',
          price: parseFloat(response.data.Price),
          time: response.data.Time,
          source: 'DIA Oracle'
        };
      }

      return null;
    } catch (error) {
      console.error('Error fetching BTC price from DIA Oracle:', error);
      return null;
    }
  }

  /**
   * Fetch sBTC price (for now, using BTC price as 1:1 proxy)
   */
  async fetchSBTCPrice(): Promise<PriceData | null> {
    // For now, sBTC price = BTC price (1:1 backing)
    // In the future, this could be a separate endpoint or calculation
    const btcPrice = await this.fetchBTCPrice();
    
    if (btcPrice) {
      return {
        ...btcPrice,
        symbol: 'sBTC',
        name: 'Stacks Bitcoin',
        source: 'DIA Oracle (BTC proxy)'
      };
    }

    return null;
  }

  /**
   * Validate price data for reasonableness
   */
  private validatePrice(price: number): boolean {
    const MIN_BTC_PRICE = 10000; // $10k minimum
    const MAX_BTC_PRICE = 500000; // $500k maximum
    
    return price >= MIN_BTC_PRICE && price <= MAX_BTC_PRICE;
  }

  /**
   * Convert USD price to cents (contract expects price in cents)
   */
  private toCents(priceUSD: number): number {
    return Math.floor(priceUSD * 100);
  }

  /**
   * Update price in the resurrection contract
   */
  async updateContractPrice(priceInCents: number): Promise<boolean> {
    try {
      console.log(`Updating contract price to ${priceInCents} cents ($${priceInCents/100})`);

      const txOptions = {
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: 'update-sbtc-price',
        functionArgs: [uintCV(priceInCents)],
        senderKey: PRIVATE_KEY,
        network,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow,
      };

      const transaction = await makeContractCall(txOptions);
      const broadcastResponse = await broadcastTransaction(transaction, network);

      if (broadcastResponse.error) {
        console.error('Error broadcasting price update:', broadcastResponse.error);
        return false;
      }

      console.log(`Price update transaction broadcasted: ${broadcastResponse.txid}`);
      return true;

    } catch (error) {
      console.error('Error updating contract price:', error);
      return false;
    }
  }

  /**
   * Get current price with fallback handling
   */
  async getCurrentPrice(): Promise<ResurrectionPriceUpdate | null> {
    try {
      // Try to fetch fresh price data
      const priceData = await this.fetchSBTCPrice();
      
      if (!priceData) {
        console.warn('Failed to fetch price data from DIA Oracle');
        return null;
      }

      const price = priceData.price;
      
      if (!this.validatePrice(price)) {
        console.warn(`Invalid price received: $${price}. Using fallback.`);
        return null;
      }

      const priceInCents = this.toCents(price);
      const timestamp = new Date(priceData.time).getTime();

      // Check if price is fresh (not too old)
      const priceAge = Date.now() - timestamp;
      if (priceAge > MAX_PRICE_AGE) {
        console.warn(`Price data too old: ${priceAge/1000}s. Using fallback.`);
        return null;
      }

      return {
        btcPrice: price,
        sBtcPrice: price, // 1:1 for now
        timestamp,
        priceInCents
      };

    } catch (error) {
      console.error('Error getting current price:', error);
      return null;
    }
  }

  /**
   * Update price in contract if needed
   */
  async updatePriceIfNeeded(): Promise<void> {
    try {
      const now = Date.now();
      
      // Check if we need to update (respect rate limiting)
      if (now - this.lastPriceUpdate < PRICE_UPDATE_INTERVAL) {
        return;
      }

      const priceUpdate = await this.getCurrentPrice();
      
      if (!priceUpdate) {
        console.log('No valid price update available');
        return;
      }

      // Check if price changed significantly (>1% change)
      const priceChange = Math.abs(priceUpdate.priceInCents - this.currentPrice * 100) / (this.currentPrice * 100);
      
      if (priceChange < 0.01) {
        console.log(`Price change too small (${(priceChange * 100).toFixed(2)}%), skipping update`);
        return;
      }

      // Update the contract
      const success = await this.updateContractPrice(priceUpdate.priceInCents);
      
      if (success) {
        this.currentPrice = priceUpdate.btcPrice;
        this.lastPriceUpdate = now;
        
        console.log(`Price successfully updated to $${this.currentPrice}`);
        
        // Emit event for monitoring
        this.emitPriceUpdateEvent(priceUpdate);
      }

    } catch (error) {
      console.error('Error in updatePriceIfNeeded:', error);
    }
  }

  /**
   * Start automatic price updates
   */
  startPriceUpdates(): void {
    if (this.updateInterval) {
      return; // Already started
    }

    console.log('Starting automatic price updates...');
    
    // Update immediately
    this.updatePriceIfNeeded();
    
    // Then update every 5 minutes
    this.updateInterval = setInterval(() => {
      this.updatePriceIfNeeded();
    }, PRICE_UPDATE_INTERVAL);
  }

  /**
   * Stop automatic price updates
   */
  stopPriceUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      console.log('Stopped automatic price updates');
    }
  }

  /**
   * Emit price update event for monitoring/logging
   */
  private emitPriceUpdateEvent(update: ResurrectionPriceUpdate): void {
    const event = {
      event: 'price-updated',
      timestamp: new Date().toISOString(),
      price: update.btcPrice,
      priceInCents: update.priceInCents,
      source: 'DIA Oracle API'
    };
    
    console.log('Price Update Event:', JSON.stringify(event, null, 2));
    
    // Here you could emit to EventEmitter, send to monitoring service, etc.
  }

  /**
   * Get price statistics for dashboard
   */
  async getPriceStats() {
    const currentPriceData = await this.getCurrentPrice();
    
    return {
      currentPrice: this.currentPrice,
      lastUpdate: this.lastPriceUpdate,
      updateInterval: PRICE_UPDATE_INTERVAL,
      isRunning: !!this.updateInterval,
      latestPriceData: currentPriceData,
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME
    };
  }

  /**
   * Manual price update (for testing or emergency use)
   */
  async manualPriceUpdate(): Promise<ResurrectionPriceUpdate | null> {
    console.log('Performing manual price update...');
    
    const priceUpdate = await this.getCurrentPrice();
    
    if (priceUpdate) {
      const success = await this.updateContractPrice(priceUpdate.priceInCents);
      
      if (success) {
        this.currentPrice = priceUpdate.btcPrice;
        this.lastPriceUpdate = Date.now();
        console.log('Manual price update successful');
        return priceUpdate;
      }
    }
    
    console.log('Manual price update failed');
    return null;
  }
}

// Singleton instance
export const priceOracleService = new PriceOracleService();

// Express.js route example
export const createPriceRoutes = (app: any) => {
  // Get current price stats
  app.get('/api/price/stats', async (req: any, res: any) => {
    try {
      const stats = await priceOracleService.getPriceStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get price stats' });
    }
  });

  // Manual price update (admin only)
  app.post('/api/price/update', async (req: any, res: any) => {
    try {
      // Add authentication check here
      const result = await priceOracleService.manualPriceUpdate();
      
      if (result) {
        res.json({ success: true, price: result });
      } else {
        res.status(500).json({ success: false, error: 'Price update failed' });
      }
    } catch (error) {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });

  // Start/stop price updates
  app.post('/api/price/start', (req: any, res: any) => {
    priceOracleService.startPriceUpdates();
    res.json({ success: true, message: 'Price updates started' });
  });

  app.post('/api/price/stop', (req: any, res: any) => {
    priceOracleService.stopPriceUpdates();
    res.json({ success: true, message: 'Price updates stopped' });
  });
};