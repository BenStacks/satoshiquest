# Satoshi's Quest - Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Smart Contract Deployment](#smart-contract-deployment)
4. [Frontend Deployment](#frontend-deployment)
5. [Post-Deployment Configuration](#post-deployment-configuration)
6. [Testing & Verification](#testing--verification)
7. [Production Checklist](#production-checklist)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools

```mermaid
graph TD
    Dev[Development Environment] --> Tools[Required Tools]

    Tools --> Node[Node.js v20+]
    Tools --> Clarinet[Clarinet 2.0+]
    Tools --> Git[Git]
    Tools --> Wallet[Stacks Wallet]

    Node --> NPM[npm/yarn/pnpm]
    Clarinet --> Clarity[Clarity 3 Support]
    Wallet --> Hiro[Hiro Wallet]
    Wallet --> Leather[Leather Wallet]
    Wallet --> Xverse[Xverse Wallet]

    style Tools fill:#90caf9,stroke:#1976d2,stroke-width:2px
```

### Installation Commands

```bash
# Install Node.js (using nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20

# Install Clarinet
curl -sL https://get.clarinet.sh | sh

# Verify installations
node --version    # Should be v20.x.x
npm --version     # Should be v10.x.x
clarinet --version # Should be v2.x.x
```

### Required Accounts

1. **Stacks Testnet Wallet**
   - Get testnet STX from [faucet](https://explorer.hiro.so/sandbox/faucet?chain=testnet)
   - Need ~5 STX for contract deployments

2. **GitHub Account** (for frontend deployment)

3. **sBTC Testnet Tokens** (for testing)
   - Use sBTC testnet faucet
   - Get test sBTC for resurrection testing

---

## Local Development Setup

### Project Structure

```
satoshiquest/
├── contract/              # Smart contracts
│   ├── contracts/         # Clarity contracts
│   ├── tests/             # Contract tests
│   ├── Clarinet.toml      # Clarinet configuration
│   └── deployments/       # Deployment plans
│
├── frontend/              # Next.js frontend
│   ├── app/               # App router pages
│   ├── components/        # React components
│   ├── lib/               # Services & utilities
│   ├── public/            # Static assets
│   └── package.json
│
├── docs/                  # Documentation
└── resources/             # Reference materials
```

### Clone & Install

```bash
# Clone repository
git clone https://github.com/your-org/satoshiquest.git
cd satoshiquest

# Install frontend dependencies
cd frontend
npm install

# Go back to contract directory
cd ../contract
```

### Environment Setup

```mermaid
graph LR
    Setup[Environment Setup] --> Frontend[Frontend Config]
    Setup --> Contracts[Contract Config]

    Frontend --> Env[.env.local]
    Contracts --> Clarinet[Clarinet.toml]

    Env --> Vars[Environment Variables:<br/>- NEXT_PUBLIC_NETWORK<br/>- NEXT_PUBLIC_CONTRACT_ADDRESS<br/>- NEXT_PUBLIC_API_URL]

    Clarinet --> Network[Network Configuration:<br/>- Testnet<br/>- Devnet<br/>- Mainnet]

    style Setup fill:#ffd54f,stroke:#f57c00
```

#### Frontend Environment (`.env.local`)

```bash
# Network Configuration
NEXT_PUBLIC_NETWORK=testnet
NEXT_PUBLIC_STACKS_API=https://api.testnet.hiro.so

# Contract Addresses (update after deployment)
NEXT_PUBLIC_CORE_CONTRACT=ST2F3J1PK46D6XVRBB9SQ66PY89P8G0EBDW5E05M7.satoshi-quest-core
NEXT_PUBLIC_LOOT_CONTRACT=ST2F3J1PK46D6XVRBB9SQ66PY89P8G0EBDW5E05M7.satoshi-quest-loot
NEXT_PUBLIC_TOMBSTONE_CONTRACT=ST2F3J1PK46D6XVRBB9SQ66PY89P8G0EBDW5E05M7.satoshi-quest-tombstone
NEXT_PUBLIC_RESURRECTION_CONTRACT=ST2F3J1PK46D6XVRBB9SQ66PY89P8G0EBDW5E05M7.satoshi-quest-resurrection

# sBTC Token
NEXT_PUBLIC_SBTC_CONTRACT=SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token
```

### Local Testing

```bash
# Start frontend development server
cd frontend
npm run dev
# Access at http://localhost:3000

# In another terminal, test contracts
cd contract
clarinet console
```

---

## Smart Contract Deployment

### Deployment Order

**IMPORTANT**: Contracts must be deployed in this specific order to avoid circular dependencies:

```mermaid
graph TD
    Start[Start Deployment] --> Step1[1. random-oracle]

    Step1 --> Step2[2. satoshi-quest-loot]
    Step1 --> Step3[2. satoshi-quest-tombstone]

    Step2 --> Step4[3. satoshi-quest-core]
    Step3 --> Step4

    Step4 --> Step5[4. satoshi-quest-resurrection]

    Step5 --> Config[5. Post-Deployment Config]

    Config --> Link1[Set loot contract in core]
    Config --> Link2[Set tombstone contract in core]
    Config --> Link3[Set core contract in loot]
    Config --> Link4[Set core contract in resurrection]
    Config --> Link5[Enable contract integration]

    Link5 --> Complete[✅ Deployment Complete]

    style Start fill:#66bb6a,stroke:#2e7d32
    style Config fill:#ffd54f,stroke:#f57c00
    style Complete fill:#4caf50,stroke:#2e7d32,stroke-width:3px
```

### Step-by-Step Deployment

#### 1. Prepare Deployment Account

```bash
# Generate deployment wallet or use existing
clarinet integrate

# Add your wallet configuration to Clarinet.toml
# [accounts.deployer]
# mnemonic = "your twelve word mnemonic here..."
# balance = 5000000000  # 5000 STX
```

#### 2. Check Contracts

```bash
# Verify all contracts compile
clarinet check

# Should see:
# ✅ All contracts compile successfully
```

#### 3. Deploy to Testnet

```bash
# Deploy all contracts
clarinet deployments apply -p deployments/default.simnet-plan.yaml --testnet

# This will:
# - Deploy contracts in correct order
# - Output deployment addresses
# - Create deployment report
```

#### 4. Manual Deployment (Alternative)

If automated deployment fails, deploy manually:

```bash
# 1. Deploy random-oracle
clarinet deploy contract/contracts/random-oracle.clar random-oracle --testnet

# 2. Deploy loot contract
clarinet deploy contract/contracts/satoshi-quest-loot.clar satoshi-quest-loot --testnet

# 3. Deploy tombstone contract
clarinet deploy contract/contracts/satoshi-quest-tombstone.clar satoshi-quest-tombstone --testnet

# 4. Deploy core contract
clarinet deploy contract/contracts/satoshi-quest-core.clar satoshi-quest-core --testnet

# 5. Deploy resurrection contract
clarinet deploy contract/contracts/satoshi-quest-resurrection.clar satoshi-quest-resurrection --testnet
```

#### 5. Record Contract Addresses

```mermaid
graph LR
    Deploy[Deployment Complete] --> Record[Record Addresses]

    Record --> File[Save to deployment.json]
    Record --> Env[Update .env.local]
    Record --> Docs[Update documentation]

    File --> Address[Contract Addresses:<br/>- random-oracle<br/>- satoshi-quest-core<br/>- satoshi-quest-loot<br/>- satoshi-quest-tombstone<br/>- satoshi-quest-resurrection]

    style Deploy fill:#66bb6a,stroke:#2e7d32
```

Create `deployment.json`:

```json
{
  "network": "testnet",
  "deployer": "ST2F3J1PK46D6XVRBB9SQ66PY89P8G0EBDW5E05M7",
  "contracts": {
    "random-oracle": "ST2F3J1PK46D6XVRBB9SQ66PY89P8G0EBDW5E05M7.random-oracle",
    "satoshi-quest-core": "ST2F3J1PK46D6XVRBB9SQ66PY89P8G0EBDW5E05M7.satoshi-quest-core",
    "satoshi-quest-loot": "ST2F3J1PK46D6XVRBB9SQ66PY89P8G0EBDW5E05M7.satoshi-quest-loot",
    "satoshi-quest-tombstone": "ST2F3J1PK46D6XVRBB9SQ66PY89P8G0EBDW5E05M7.satoshi-quest-tombstone",
    "satoshi-quest-resurrection": "ST2F3J1PK46D6XVRBB9SQ66PY89P8G0EBDW5E05M7.satoshi-quest-resurrection"
  },
  "deployedAt": "2025-01-18T12:00:00Z"
}
```

---

## Post-Deployment Configuration

### Contract Linking

After deployment, contracts need to be linked together using admin functions:

```mermaid
sequenceDiagram
    participant Admin
    participant Core as Core Contract
    participant Loot as Loot Contract
    participant Res as Resurrection Contract

    Note over Admin: Post-Deployment Setup

    Admin->>Core: set-loot-contract(loot-address)
    Admin->>Core: set-tombstone-contract(tombstone-address)

    Admin->>Loot: set-game-contract(core-address)

    Admin->>Res: set-core-contract(core-address)
    Admin->>Res: set-loot-contract(loot-address)
    Admin->>Res: set-tombstone-contract(tombstone-address)

    Admin->>Core: enable-contract-integration()

    Note over Admin,Res: ✅ Contracts Linked
```

### Configuration Script

```typescript
// scripts/configure-contracts.ts
import { makeContractCall, broadcastTransaction } from '@stacks/transactions'

async function configureContracts() {
  const deployer = 'ST2F3J1PK46D6XVRBB9SQ66PY89P8G0EBDW5E05M7'

  // 1. Set loot contract in core
  await makeContractCall({
    contractAddress: deployer,
    contractName: 'satoshi-quest-core',
    functionName: 'set-loot-contract',
    functionArgs: [principalCV(`${deployer}.satoshi-quest-loot`)],
    network: new StacksTestnet()
  })

  // 2. Set tombstone contract in core
  await makeContractCall({
    contractAddress: deployer,
    contractName: 'satoshi-quest-core',
    functionName: 'set-tombstone-contract',
    functionArgs: [principalCV(`${deployer}.satoshi-quest-tombstone`)],
    network: new StacksTestnet()
  })

  // 3. Set core contract in loot
  await makeContractCall({
    contractAddress: deployer,
    contractName: 'satoshi-quest-loot',
    functionName: 'set-game-contract',
    functionArgs: [principalCV(`${deployer}.satoshi-quest-core`)],
    network: new StacksTestnet()
  })

  // 4. Set contracts in resurrection
  await makeContractCall({
    contractAddress: deployer,
    contractName: 'satoshi-quest-resurrection',
    functionName: 'set-core-contract',
    functionArgs: [principalCV(`${deployer}.satoshi-quest-core`)],
    network: new StacksTestnet()
  })

  // 5. Enable integration
  await makeContractCall({
    contractAddress: deployer,
    contractName: 'satoshi-quest-core',
    functionName: 'enable-contract-integration',
    functionArgs: [],
    network: new StacksTestnet()
  })

  console.log('✅ Contracts configured successfully')
}

configureContracts()
```

---

## Frontend Deployment

### Build Process

```mermaid
graph LR
    Source[Source Code] --> Build[Build Process]

    Build --> TypeScript[Compile TypeScript]
    Build --> Next[Next.js Build]
    Build --> Assets[Optimize Assets]

    TypeScript --> Bundle[Production Bundle]
    Next --> Bundle
    Assets --> Bundle

    Bundle --> Deploy[Deploy to Hosting]

    Deploy --> Vercel[Vercel]
    Deploy --> Netlify[Netlify]
    Deploy --> Custom[Custom Server]

    style Build fill:#90caf9,stroke:#1976d2
    style Deploy fill:#66bb6a,stroke:#2e7d32
```

### Vercel Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
cd frontend
vercel --prod

# Follow prompts:
# - Link to existing project or create new
# - Set environment variables
# - Deploy
```

### Environment Variables on Vercel

```bash
# Set via Vercel dashboard or CLI
vercel env add NEXT_PUBLIC_NETWORK production
vercel env add NEXT_PUBLIC_STACKS_API production
vercel env add NEXT_PUBLIC_CORE_CONTRACT production
# ... add all environment variables
```

### Build Configuration

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "outputDirectory": ".next"
}
```

---

## Testing & Verification

### Contract Testing

```bash
# Run unit tests
clarinet test

# Test specific contract
clarinet test --filter satoshi-quest-core

# Integration tests
clarinet integrate
```

### Frontend Testing

```bash
# Run development server
npm run dev

# Test build
npm run build
npm start

# Check production build
npm run build && npm run start
```

### Verification Checklist

```mermaid
graph TD
    Verify[Verification Steps] --> Contracts[Smart Contracts]
    Verify --> Frontend[Frontend]
    Verify --> Integration[Integration]

    Contracts --> Deploy[All contracts deployed?]
    Contracts --> Linked[Contracts linked?]
    Contracts --> Funded[Deployer has STX?]

    Frontend --> Build[Build successful?]
    Frontend --> Env[Environment variables set?]
    Frontend --> Assets[Assets loading?]

    Integration --> Wallet[Wallet connects?]
    Integration --> Contract[Contract calls work?]
    Integration --> sBTC[sBTC integration works?]
    Integration --> Game[Game playable?]

    Deploy --> Pass1[✅]
    Linked --> Pass1
    Funded --> Pass1

    Build --> Pass2[✅]
    Env --> Pass2
    Assets --> Pass2

    Wallet --> Pass3[✅]
    Contract --> Pass3
    sBTC --> Pass3
    Game --> Pass3

    Pass1 --> AllPass[✅ VERIFIED]
    Pass2 --> AllPass
    Pass3 --> AllPass

    style Verify fill:#ffd54f,stroke:#f57c00
    style AllPass fill:#4caf50,stroke:#2e7d32,stroke-width:3px
```

### Manual Testing Procedure

1. **Wallet Connection**
   ```
   ✅ Connect Hiro Wallet
   ✅ Connect Leather Wallet
   ✅ Display correct balance
   ✅ Network detection works
   ```

2. **Game Functionality**
   ```
   ✅ Game loads properly
   ✅ Character movement works
   ✅ Combat system functions
   ✅ Loot drops appear
   ✅ Floor progression works
   ```

3. **Blockchain Integration**
   ```
   ✅ NFT minting works
   ✅ Tombstone creation works
   ✅ sBTC balance displays
   ✅ Resurrection gambling works
   ✅ Events emit correctly
   ```

---

## Production Checklist

### Pre-Launch

```mermaid
graph TD
    PreLaunch[Pre-Launch Checklist]

    PreLaunch --> Security[Security Audit]
    PreLaunch --> Performance[Performance Testing]
    PreLaunch --> Legal[Legal Compliance]
    PreLaunch --> Docs[Documentation]

    Security --> Audit[Contract Audit]
    Security --> Pentest[Penetration Testing]
    Security --> Review[Code Review]

    Performance --> Load[Load Testing]
    Performance --> Speed[Speed Optimization]
    Performance --> CDN[CDN Setup]

    Legal --> Terms[Terms of Service]
    Legal --> Privacy[Privacy Policy]
    Legal --> Disclaimers[Gambling Disclaimers]

    Docs --> User[User Guide]
    Docs --> Dev[Developer Docs]
    Docs --> API[API Documentation]

    Audit --> Ready1[✅]
    Pentest --> Ready1
    Review --> Ready1

    Load --> Ready2[✅]
    Speed --> Ready2
    CDN --> Ready2

    Terms --> Ready3[✅]
    Privacy --> Ready3
    Disclaimers --> Ready3

    User --> Ready4[✅]
    Dev --> Ready4
    API --> Ready4

    Ready1 --> Launch[🚀 READY FOR LAUNCH]
    Ready2 --> Launch
    Ready3 --> Launch
    Ready4 --> Launch

    style PreLaunch fill:#ffd54f,stroke:#f57c00
    style Launch fill:#4caf50,stroke:#2e7d32,stroke-width:4px
```

### Launch Day

1. **Final Deployment**
   ```bash
   # Deploy to mainnet
   clarinet deployments apply --mainnet

   # Verify contracts on explorer
   # https://explorer.hiro.so/txid/{tx_id}?chain=mainnet

   # Deploy frontend
   vercel --prod

   # Verify frontend
   # https://satoshiquest.io
   ```

2. **Monitoring Setup**
   ```bash
   # Set up monitoring
   - Sentry for error tracking
   - Google Analytics for usage
   - Custom blockchain monitoring
   ```

3. **Announcement**
   ```
   - Tweet launch announcement
   - Post on Discord/Telegram
   - Update documentation
   - Monitor for issues
   ```

### Post-Launch Monitoring

```mermaid
graph LR
    Monitor[Continuous Monitoring]

    Monitor --> Errors[Error Tracking]
    Monitor --> Usage[Usage Metrics]
    Monitor --> Chain[Blockchain Events]

    Errors --> Sentry[Sentry Alerts]
    Usage --> Analytics[Analytics Dashboard]
    Chain --> Events[Event Monitoring]

    Sentry --> Fix[Bug Fixes]
    Analytics --> Optimize[Optimization]
    Events --> Verify[Verify Transactions]

    Fix --> Deploy[Deploy Updates]
    Optimize --> Deploy
    Verify --> Deploy

    style Monitor fill:#90caf9,stroke:#1976d2
```

---

## Troubleshooting

### Common Issues

#### 1. Contract Deployment Fails

```bash
# Error: Insufficient balance
# Solution: Get more STX from faucet
clarinet deploy --help

# Error: Contract already exists
# Solution: Use different contract name or deployer address

# Error: Circular dependency
# Solution: Deploy in correct order (see deployment section)
```

#### 2. Frontend Build Errors

```bash
# Error: Environment variables not found
# Solution: Create .env.local with all required vars

# Error: Module not found
# Solution: npm install

# Error: TypeScript errors
# Solution: npm run build -- --no-type-check
```

#### 3. Wallet Connection Issues

```
Problem: Wallet not connecting
Solution:
- Check browser extension is installed
- Clear browser cache
- Try different wallet
- Check network (testnet vs mainnet)
```

#### 4. Transaction Failures

```
Problem: Contract call fails
Solution:
- Check post-conditions
- Verify contract address
- Ensure sufficient STX balance
- Check function arguments
```

### Debug Mode

```typescript
// Enable debug logging
localStorage.setItem('DEBUG', 'satoshiquest:*')

// In code
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', data)
}
```

### Support Resources

```mermaid
graph TD
    Help[Need Help?]

    Help --> Docs[Documentation]
    Help --> Community[Community]
    Help --> GitHub[GitHub Issues]

    Docs --> System[System Architecture]
    Docs --> Game[Game Mechanics]
    Docs --> Deploy[This Guide]

    Community --> Discord[Discord Channel]
    Community --> Forum[Forum]
    Community --> Twitter[Twitter/X]

    GitHub --> Bug[Bug Reports]
    GitHub --> Feature[Feature Requests]
    GitHub --> Discuss[Discussions]

    style Help fill:#ffd54f,stroke:#f57c00
```

---

## Maintenance

### Regular Tasks

```bash
# Weekly
- Monitor error logs
- Check transaction volume
- Review user feedback
- Update dependencies

# Monthly
- Security review
- Performance audit
- Backup data
- Update documentation

# Quarterly
- Major version updates
- Feature releases
- Community events
- Financial reports
```

### Update Procedure

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant Test as Testing
    participant Stage as Staging
    participant Prod as Production

    Dev->>Test: 1. Deploy to test environment
    Test->>Test: 2. Run automated tests
    Test->>Test: 3. Manual QA
    Test->>Stage: 4. Deploy to staging
    Stage->>Stage: 5. Final verification
    Stage->>Prod: 6. Production deployment
    Prod->>Prod: 7. Monitor for issues

    Note over Prod: Roll back if issues detected
```

---

## Next Steps

Now that you've deployed Satoshi's Quest:

1. **Test thoroughly** - Verify all functionality
2. **Monitor closely** - Watch for any issues
3. **Engage community** - Gather feedback
4. **Iterate quickly** - Fix bugs and add features

For more information:
- [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) - System design
- [GAME_MECHANICS.md](./GAME_MECHANICS.md) - Game rules
- [SBTC_RESURRECTION_FLOW.md](./SBTC_RESURRECTION_FLOW.md) - sBTC mechanics

---

**Last Updated**: January 2025
**Version**: 1.0.0
**Authors**: Satoshi's Quest Development Team
