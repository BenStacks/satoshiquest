# External Price Oracle Integration

This solution replaces the problematic on-chain oracle integrations with a backend service that fetches real-time BTC prices from DIA Oracle API and feeds them to the smart contract.

## 🔧 Architecture

```
DIA Oracle API → Backend Service → Smart Contract
     ↓               ↓                  ↓
Live BTC Price → Price Validation → Contract Storage
```

## ✅ Benefits

- **No deployment issues**: Eliminates complex on-chain oracle contract calls
- **Reliable price feeds**: Uses DIA Oracle's robust API infrastructure
- **Better error handling**: Backend can handle API failures gracefully
- **Flexible updates**: Can easily switch price sources or add fallbacks
- **Cost effective**: Only pays gas for price updates, not every price fetch
- **Monitoring**: Built-in logging and health checks

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install axios @stacks/transactions @stacks/network
```

### 2. Configure Environment

```bash
cp price-oracle.env.example .env
# Edit .env with your contract address and admin private key
```

### 3. Start Price Oracle Service

```bash
# Option A: Standalone price oracle service
npm run start:price-oracle

# Option B: Integrate into existing backend
# See priceOracleApp.ts for integration example
```

### 4. Deploy Updated Contract

The resurrection contract now accepts price updates via the `update-sbtc-price` function instead of making direct oracle calls.

## 📊 API Endpoints

### Price Stats

```bash
GET /api/price/stats
```

Returns current price information and service status.

### Manual Price Update

```bash
POST /api/price/update
```

Triggers immediate price update (admin only).

### Service Control

```bash
POST /api/price/start   # Start automatic updates
POST /api/price/stop    # Stop automatic updates
```

### Health Check

```bash
GET /health
```

Returns service health and price freshness status.

## 📈 DIA Oracle API Integration

### Price Fetching

The service fetches BTC prices from DIA Oracle's public API:

```
GET https://api.diadata.org/v1/quotation/Bitcoin
```

### Response Format

```json
{
  "Symbol": "BTC",
  "Name": "Bitcoin",
  "Price": 67543.21,
  "Time": "2024-01-15T10:30:00Z",
  "Source": "DIA"
}
```

### Price Validation

- Minimum price: $10,000
- Maximum price: $500,000
- Maximum age: 10 minutes
- Minimum change: 1% (to avoid spam updates)

## 🔒 Security Features

- **Admin-only updates**: Only contract owner can update prices
- **Price bounds checking**: Prevents unreasonable price manipulation
- **Freshness validation**: Rejects stale price data
- **Rate limiting**: Prevents excessive contract calls

## 🛠 Smart Contract Changes

### New Functions Added

```clarity
;; Update sBTC price (admin only)
(define-public (update-sbtc-price (new-price uint)))

;; Get current price info
(define-read-only (get-current-sbtc-price))

;; Toggle price feed system
(define-public (set-price-feed-enabled (enabled bool)))
```

### Removed Functions

- All direct oracle contract calls (`get-dia-sbtc-price`, `get-pyth-sbtc-price`)
- Complex oracle fallback logic
- On-chain price validation complexity

## 💡 Usage in Game

### Frontend Integration

```typescript
// Get current price for resurrection cost calculation
const priceInfo = await contractCall("get-current-sbtc-price");
const costInSBTC = calculateResurrectionCost(
  level,
  deaths,
  priceInfo.effective - price
);

// Pay for resurrection (price is now validated on backend)
await contractCall("pay-for-resurrection", [characterId, sbtcAmount]);
```

### Backend Integration

```typescript
import { priceOracleService } from "./services/priceOracle";

// Start price updates when server starts
priceOracleService.startPriceUpdates();

// Get stats for admin dashboard
const stats = await priceOracleService.getPriceStats();
```

## 📊 Monitoring

The service provides comprehensive monitoring:

- **Price update events**: Logged with timestamps and values
- **Health checks**: Service status and price freshness
- **Error tracking**: Failed API calls and contract transactions
- **Performance metrics**: Update frequency and response times

## 🔄 Migration from Oracle Contracts

### Before (Problematic)

```clarity
;; Direct oracle calls causing deployment issues
(contract-call? DIA_ORACLE_CONTRACT get-value "sBTC/USD")
```

### After (Working Solution)

```clarity
;; Simple storage updated by backend
(var-get current-sbtc-price)
```

## 🚦 Deployment Steps

1. **Deploy updated contract** with oracle calls removed
2. **Configure backend** with contract address and admin key
3. **Start price service** to begin feeding live prices
4. **Test resurrection** with live price data
5. **Monitor health** via `/health` endpoint

## 📞 Support

For issues or questions about the price oracle integration:

- Check the health endpoint for service status
- Review logs for price update events
- Verify contract owner permissions
- Ensure DIA Oracle API accessibility

This approach provides a much more reliable and maintainable solution for price feeds while eliminating the deployment complexities of on-chain oracle integrations.
