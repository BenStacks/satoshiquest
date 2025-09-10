/**
 * DIA Oracle Service - Real-time price feeds for BTC, STX, and sBTC
 * Adapted from playground implementation for Satoshi's Quest
 */

export interface PriceData {
  price: number;
  timestamp: number;
  symbol: string;
}

export interface ExchangeRates {
  'BTC/USD': PriceData;
  'STX/USD': PriceData;
  'SBTC/USD': PriceData;
  lastUpdated: number;
}

export class DiaOracleService {
  private readonly DIA_BASE_URL = 'https://api.diadata.org/v1/assetQuotation';
  
  // DIA Oracle API endpoints
  private readonly API_ENDPOINTS = {
    BTC: `${this.DIA_BASE_URL}/Bitcoin/0x0000000000000000000000000000000000000000`,
    STX: `${this.DIA_BASE_URL}/Stacks/0x0000000000000000000000000000000000000000`,
    SBTC: `${this.DIA_BASE_URL}/Stacks/SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token`
  };

  private cache: ExchangeRates | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION = 30000; // 30 seconds

  /**
   * Fetch real-time exchange rates for all supported currencies
   */
  async getExchangeRates(): Promise<ExchangeRates> {
    // Return cached data if still valid
    if (this.cache && Date.now() < this.cacheExpiry) {
      console.log('📊 Using cached DIA Oracle prices');
      return this.cache;
    }

    try {
      console.log('🔄 Fetching real-time prices from DIA Oracle...');
      
      const [btcData, stxData, sbtcData] = await Promise.all([
        this.fetchPrice('BTC'),
        this.fetchPrice('STX'), 
        this.fetchPrice('SBTC')
      ]);

      const rates: ExchangeRates = {
        'BTC/USD': btcData,
        'STX/USD': stxData,
        'SBTC/USD': sbtcData,
        lastUpdated: Date.now()
      };

      // Cache the results
      this.cache = rates;
      this.cacheExpiry = Date.now() + this.CACHE_DURATION;

      console.log('✅ DIA Oracle prices fetched:', {
        BTC: `$${btcData.price.toLocaleString()}`,
        STX: `$${stxData.price.toFixed(4)}`,
        SBTC: `$${sbtcData.price.toLocaleString()}`
      });

      return rates;
    } catch (error) {
      console.error('❌ Failed to fetch DIA Oracle prices:', error);
      
      // Fallback to cached prices or default values
      return this.getFallbackRates();
    }
  }

  /**
   * Fetch price for a specific asset from DIA Oracle
   */
  private async fetchPrice(asset: keyof typeof this.API_ENDPOINTS): Promise<PriceData> {
    const url = this.API_ENDPOINTS[asset];
    
    try {
      console.log(`📊 Fetching ${asset} price from DIA...`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`DIA API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // DIA Oracle response format
      const price = parseFloat(data.Price || data.price || '0');
      const timestamp = new Date(data.Time || data.timestamp || Date.now()).getTime();
      
      if (price <= 0) {
        throw new Error(`Invalid price data for ${asset}: ${price}`);
      }

      return {
        price,
        timestamp,
        symbol: asset
      };
      
    } catch (error) {
      console.error(`❌ Failed to fetch ${asset} price:`, error);
      throw error;
    }
  }

  /**
   * Calculate sBTC resurrection cost based on current floor and base USD cost
   */
  async calculateResurrectionCost(currentFloor: number, baseUsdCost: number = 10): Promise<{
    sbtcAmount: number;
    usdValue: number;
    costMultiplier: number;
  }> {
    const rates = await this.getExchangeRates();
    
    // Increase cost exponentially with floor depth
    const costMultiplier = Math.pow(1.2, Math.max(0, currentFloor - 5));
    const adjustedUsdCost = baseUsdCost * costMultiplier;
    
    const sbtcAmount = adjustedUsdCost / rates['SBTC/USD'].price;
    
    console.log(`💰 Resurrection cost calculation:`, {
      floor: currentFloor,
      baseUsd: baseUsdCost,
      multiplier: costMultiplier.toFixed(2),
      finalUsd: adjustedUsdCost.toFixed(2),
      sbtcAmount: sbtcAmount.toFixed(8),
      sbtcPrice: rates['SBTC/USD'].price
    });

    return {
      sbtcAmount: Math.floor(sbtcAmount * 100_000_000), // Convert to satoshis
      usdValue: adjustedUsdCost,
      costMultiplier
    };
  }

  /**
   * Convert USD amount to cryptocurrency amount
   */
  async convertUsdToCrypto(usdAmount: number, currency: 'BTC' | 'STX' | 'SBTC'): Promise<number> {
    const rates = await this.getExchangeRates();
    
    let priceData: PriceData;
    switch (currency) {
      case 'BTC':
        priceData = rates['BTC/USD'];
        break;
      case 'STX':
        priceData = rates['STX/USD'];
        break;
      case 'SBTC':
        priceData = rates['SBTC/USD'];
        break;
      default:
        throw new Error(`Unsupported currency: ${currency}`);
    }

    if (priceData.price <= 0) {
      throw new Error(`Invalid price for ${currency}: ${priceData.price}`);
    }

    const cryptoAmount = usdAmount / priceData.price;
    
    console.log(`💱 Conversion: $${usdAmount} → ${cryptoAmount.toFixed(8)} ${currency} @ $${priceData.price}`);
    
    return cryptoAmount;
  }

  /**
   * Convert cryptocurrency amount to USD
   */
  async convertCryptoToUsd(cryptoAmount: number, currency: 'BTC' | 'STX' | 'SBTC'): Promise<number> {
    const rates = await this.getExchangeRates();
    
    let priceData: PriceData;
    switch (currency) {
      case 'BTC':
        priceData = rates['BTC/USD'];
        break;
      case 'STX':
        priceData = rates['STX/USD'];
        break;
      case 'SBTC':
        priceData = rates['SBTC/USD'];
        break;
      default:
        throw new Error(`Unsupported currency: ${currency}`);
    }

    const usdAmount = cryptoAmount * priceData.price;
    
    console.log(`💱 Conversion: ${cryptoAmount} ${currency} → $${usdAmount.toFixed(2)} @ $${priceData.price}`);
    
    return usdAmount;
  }

  /**
   * Fallback rates when DIA Oracle is unavailable
   */
  private getFallbackRates(): ExchangeRates {
    console.warn('⚠️ Using fallback exchange rates - DIA Oracle unavailable');
    
    const now = Date.now();
    
    return {
      'BTC/USD': {
        price: 45000, // Fallback BTC price
        timestamp: now,
        symbol: 'BTC'
      },
      'STX/USD': {
        price: 0.6, // Fallback STX price
        timestamp: now,
        symbol: 'STX'
      },
      'SBTC/USD': {
        price: 45000, // sBTC should be 1:1 pegged to BTC
        timestamp: now,
        symbol: 'SBTC'
      },
      lastUpdated: now
    };
  }

  /**
   * Check if prices are stale (older than 5 minutes)
   */
  isPriceStale(timestamp: number): boolean {
    const FIVE_MINUTES = 5 * 60 * 1000;
    return Date.now() - timestamp > FIVE_MINUTES;
  }

  /**
   * Format price for display in game UI
   */
  formatPrice(price: number, currency: string): string {
    if (currency === 'STX') {
      return `$${price.toFixed(4)}`;
    }
    return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  /**
   * Format satoshis to BTC for display
   */
  formatSatoshisToBtc(satoshis: number): string {
    return (satoshis / 100_000_000).toFixed(8);
  }

  /**
   * Clear cache (useful for testing or forced refresh)
   */
  clearCache(): void {
    this.cache = null;
    this.cacheExpiry = 0;
    console.log('🗑️ DIA Oracle cache cleared');
  }
}

// Export singleton instance
export const diaOracleService = new DiaOracleService();
export default diaOracleService;
