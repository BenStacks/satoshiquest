# Satoshi Quest - Deployment Configuration

## 🚨 CRITICAL: Pre-Deployment Checklist

### Oracle Configuration Changes Required for Production

**File**: `contracts/satoshi-quest-resurrection.clar`

**Line ~30**: Change the DIA_ORACLE_CONTRACT constant from test to production:

```clarity
;; CURRENT (Testing):
(define-constant DIA_ORACLE_CONTRACT .test-dia-oracle)

;; CHANGE TO (Production):
(define-constant DIA_ORACLE_CONTRACT 'ST1S5ZGRZV5K4S9205RWPRTX9RGS9JV40KQMR4G1J.dia-oracle)
```

### Environment-Specific Configurations

#### Development/Testing Environment

- **Oracle**: `.test-dia-oracle` (mock oracle for testing)
- **sBTC Contracts**: Clarinet simulated contracts
- **Purpose**: Local testing and development

#### Production Environment

- **Oracle**: `'ST1S5ZGRZV5K4S9205RWPRTX9RGS9JV40KQMR4G1J.dia-oracle` (real DIA Oracle)
- **sBTC Contracts**: Production sBTC contracts
- **Purpose**: Mainnet deployment

### Deployment Steps

1. **Pre-deployment**:

   - [ ] Update `DIA_ORACLE_CONTRACT` constant to production oracle
   - [ ] Verify all sBTC contract addresses are correct
   - [ ] Run full test suite with production configuration
   - [ ] Review all admin functions and ownership settings

2. **Deployment**:

   - [ ] Deploy contracts in correct order:
     1. Core contract
     2. Loot contract
     3. Tombstone contract
     4. Resurrection contract
   - [ ] Verify contract deployments
   - [ ] Test basic functionality

3. **Post-deployment**:
   - [ ] Set up proper admin controls
   - [ ] Configure resurrection pricing parameters
   - [ ] Enable resurrection system
   - [ ] Monitor oracle price feeds

### Automated Configuration Switching (Future Enhancement)

Consider implementing environment detection:

```clarity
;; Future enhancement: Environment-based oracle selection
(define-data-var oracle-mode (string-ascii 10) "test")

(define-read-only (get-oracle-contract)
    (if (is-eq (var-get oracle-mode) "production")
        'ST1S5ZGRZV5K4S9205RWPRTX9RGS9JV40KQMR4G1J.dia-oracle
        .test-dia-oracle
    )
)
```

### Testing Strategy

#### Local Testing (Current Setup)

- Uses mock DIA Oracle (`test-dia-oracle.clar`)
- Provides predictable price data for testing
- Tests all resurrection contract functionality

#### Pre-Production Testing

- Deploy with production oracle on testnet
- Verify real price feed integration
- Test edge cases with live data

### Important Notes

⚠️ **Never deploy test oracle to production**
⚠️ **Always verify oracle contract addresses before deployment**  
⚠️ **Test resurrection cost calculations with real price data**
⚠️ **Ensure proper access controls are in place**

---

## Contract Addresses Reference

### sBTC Contracts (Production)

- **Token**: `SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token`
- **Registry**: `SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-registry`
- **Deposit**: `SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-deposit`

### DIA Oracle Contracts

- **Production**: `ST1S5ZGRZV5K4S9205RWPRTX9RGS9JV40KQMR4G1J.dia-oracle`
- **Test**: `.test-dia-oracle` (local only)

### Game Contracts

- **Core**: `.satoshi-quest-core`
- **Loot**: `.satoshi-quest-loot`
- **Tombstone**: `.satoshi-quest-tombstone`
- **Resurrection**: `.satoshi-quest-resurrection`
