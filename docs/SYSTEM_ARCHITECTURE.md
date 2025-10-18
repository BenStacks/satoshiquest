# Satoshi's Quest - System Architecture Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [High-Level Architecture](#high-level-architecture)
3. [Technology Stack](#technology-stack)
4. [Smart Contract Architecture](#smart-contract-architecture)
5. [Frontend Architecture](#frontend-architecture)
6. [Game Flow](#game-flow)
7. [Data Flow](#data-flow)
8. [Integration Points](#integration-points)

---

## Project Overview

**Satoshi's Quest** is a revolutionary blockchain-based rogue-like dungeon crawler that leverages Bitcoin's immutability and Stacks smart contracts to create a game with **permanent consequences** and **real digital scarcity**.

### Core Concept
- **Permadeath**: When you die, it's permanent - recorded on the Bitcoin blockchain forever
- **NFT Loot**: All items are SIP-009 NFTs with real value
- **sBTC Resurrection**: Use actual Bitcoin (via sBTC) to gamble for a second chance
- **Immutable Legacy**: Your achievements are forever etched into Bitcoin's history

### Key Innovation: sBTC Gambling Mechanic
Unlike traditional blockchain games, Satoshi's Quest implements a **provably fair gambling system** where players can:
- Find rare "Ancient Satoshi Coins" (NFTs) in deep dungeons
- Gamble **real sBTC** (Bitcoin on Stacks) for resurrection
- 47% chance to win resurrection + bonus
- All gambling revenue flows into **player-driven economy** (jackpots, tournaments, referrals)

---

## High-Level Architecture

```mermaid
graph TB
    subgraph "Frontend Layer"
        UI[User Interface<br/>Next.js 15 + React 19]
        Wallet[Wallet Integration<br/>@stacks/connect]
        Game[Game Engine<br/>Phaser 3.90]
        Services[Blockchain Services]
    end

    subgraph "Blockchain Layer"
        STX[STX Network<br/>Testnet]
        sBTC[sBTC System]
    end

    subgraph "Smart Contracts Layer"
        Core[satoshi-quest-core<br/>Main Game Logic]
        Loot[satoshi-quest-loot<br/>NFT Items]
        Tomb[satoshi-quest-tombstone<br/>Legacy NFTs]
        Res[satoshi-quest-resurrection<br/>sBTC Gambling]
        Oracle[random-oracle<br/>Provably Fair RNG]
    end

    subgraph "Settlement Layer"
        BTC[Bitcoin Blockchain<br/>Immutable History]
    end

    UI --> Wallet
    UI --> Game
    UI --> Services
    Services --> STX
    Services --> sBTC
    STX --> Core
    sBTC --> Res
    Core -.event-driven.-> Loot
    Core -.event-driven.-> Tomb
    Core -.event-driven.-> Res
    Res --> Oracle
    Core --> Oracle
    STX --> BTC

    style Core fill:#f9a825,stroke:#f57c00,stroke-width:3px
    style Res fill:#e53935,stroke:#c62828,stroke-width:3px
    style Oracle fill:#43a047,stroke:#2e7d32,stroke-width:2px
    style BTC fill:#ff6f00,stroke:#e65100,stroke-width:4px
```

---

## Technology Stack

### Frontend Layer
```typescript
{
  "framework": "Next.js 15.5.2 (App Router + Turbopack)",
  "rendering": "Client-Side with SSR capabilities",
  "ui": {
    "components": "shadcn/ui + Radix UI",
    "styling": "Tailwind CSS 4",
    "theme": "next-themes (dark/light mode)",
    "icons": "Lucide React"
  },
  "gameEngine": "Phaser 3.90.0",
  "stateManagement": {
    "local": "Zustand 5.0.8",
    "server": "@tanstack/react-query 5.87.4"
  },
  "forms": "react-hook-form + zod validation",
  "animations": "framer-motion 12.23.12"
}
```

### Blockchain Integration
```typescript
{
  "wallet": "@stacks/connect 8.2.0",
  "transactions": "@stacks/transactions 7.2.0",
  "network": "@stacks/network 7.2.0",
  "api": "@stacks/blockchain-api-client 8.13.0",
  "sbtc": "sbtc 0.3.2",
  "http": "axios 1.11.0"
}
```

### Smart Contracts
```clarity
{
  "language": "Clarity 3",
  "tools": "Clarinet (development & testing)",
  "network": "Stacks Testnet (Nakamoto)",
  "bitcoin": "sBTC for Bitcoin integration",
  "standards": {
    "nfts": "SIP-009 (NFT Standard)",
    "tokens": "SIP-010 (Fungible Token)"
  }
}
```

---

## Smart Contract Architecture

### Contract Hierarchy

```mermaid
graph TD
    subgraph "Core Contract"
        Core[satoshi-quest-core<br/>Main Game Controller]
        CoreEvents[Event Emissions:<br/>- character-created<br/>- character-died<br/>- loot-burn-requested<br/>- tombstone-requested]
        CoreAdmin[Admin Functions:<br/>- set-loot-contract<br/>- set-tombstone-contract<br/>- set-resurrection-contract<br/>- enable-contract-integration]
    end

    subgraph "NFT Contracts"
        Loot[satoshi-quest-loot<br/>SIP-009 NFT Items]
        LootFeatures[Features:<br/>- Rarity: common → mythic<br/>- Ancient Satoshi Coin<br/>- Burn on death]

        Tomb[satoshi-quest-tombstone<br/>SIP-009 Legacy NFTs]
        TombFeatures[Features:<br/>- Permanent death record<br/>- Non-transferable<br/>- Rich metadata]
    end

    subgraph "Economic System"
        Res[satoshi-quest-resurrection<br/>sBTC Gambling]
        ResFeatures[Features:<br/>- 47% win rate<br/>- Real Bitcoin<br/>- Pool distribution:<br/>  * Jackpot 30%<br/>  * Tournament 20%<br/>  * Platform 30%<br/>  * Referral 10%<br/>  * Winner bonus 10%]
    end

    subgraph "Utility"
        Oracle[random-oracle<br/>Provably Fair RNG]
        OracleFeatures[Functions:<br/>- get-coin-flip<br/>- get-random-value-in-range<br/>- get-resurrection-gamble-result]
    end

    Core -.event-driven.-> Loot
    Core -.event-driven.-> Tomb
    Core --> CoreEvents
    Core --> CoreAdmin
    Res --> Oracle
    Core --> Oracle
    Loot --> LootFeatures
    Tomb --> TombFeatures
    Res --> ResFeatures
    Oracle --> OracleFeatures

    style Core fill:#ffd54f,stroke:#f57c00,stroke-width:3px
    style Res fill:#ef5350,stroke:#c62828,stroke-width:3px
    style Oracle fill:#66bb6a,stroke:#2e7d32,stroke-width:2px
    style CoreEvents fill:#e1f5fe,stroke:#0277bd
    style ResFeatures fill:#ffebee,stroke:#c62828
```

### Event-Driven Architecture (Key Innovation)

**Problem Solved**: Circular dependencies between contracts
**Solution**: Event emission + post-deployment contract linking

```mermaid
sequenceDiagram
    participant OldCore as ❌ OLD WAY: Core Contract
    participant OldLoot as ❌ Loot Contract

    Note over OldCore,OldLoot: Circular Dependency Problem
    OldCore->>OldLoot: Direct contract-call
    OldLoot-->>OldCore: Requires core address at compile time
    Note over OldCore,OldLoot: ⚠️ Deployment fails!

    participant NewCore as ✅ NEW WAY: Core Contract
    participant Events as Event Bus
    participant Frontend as Frontend/Backend
    participant NewLoot as ✅ Loot Contract

    Note over NewCore,NewLoot: Event-Driven Solution
    NewCore->>Events: Emit "loot-burn-requested"
    Events->>Frontend: Listen for events
    Frontend->>NewLoot: Call burn-loot-item()
    Note over NewCore,NewLoot: ✅ No circular dependency!

    Note over NewCore: After deployment:
    Frontend->>NewCore: set-loot-contract(address)
    NewCore->>NewCore: Store in data-var
```

#### Event Types Emitted

```mermaid
graph LR
    subgraph "satoshi-quest-core Events"
        E1[tombstone-requested]
        E2[character-died]
        E3[loot-burn-requested]
    end

    subgraph "satoshi-quest-resurrection Events"
        E4[ancient-coin-burn-requested]
        E5[resurrection-success]
        E6[resurrection-fail]
        E7[jackpot-won]
    end

    subgraph "Event Payload Examples"
        P1["tombstone-requested:<br/>{tombstone-id, character-name,<br/>final-level, death-cause, ...}"]
        P2["resurrection-success:<br/>{character-id, sbtc-gambled,<br/>won: true, bonus, ...}"]
    end

    E1 --> P1
    E5 --> P2

    style E1 fill:#fff59d,stroke:#f57c00
    style E5 fill:#a5d6a7,stroke:#2e7d32
    style E6 fill:#ef9a9a,stroke:#c62828
```

---

## Frontend Architecture

### Directory Structure
```
frontend/
├── app/
│   ├── layout.tsx (root layout with providers)
│   ├── page.tsx (landing page with wallet connect)
│   └── game/
│       └── page.tsx (game route)
│
├── components/
│   ├── game/
│   │   ├── PhaserGameClient.tsx (Main game logic)
│   │   ├── PhaserGameScreen.tsx (Game wrapper)
│   │   ├── dashboard/ (UI overlays)
│   │   └── screens/ (Death, notifications)
│   │
│   ├── wallet/
│   │   ├── WalletConnect.tsx (Connection UI)
│   │   └── WalletDropdown.tsx (User menu)
│   │
│   ├── sections/ (Landing page sections)
│   ├── layout/ (Navbar, Footer)
│   └── ui/ (shadcn components)
│
├── lib/
│   ├── game/
│   │   └── phaser-engine.ts (Phaser game initialization)
│   ├── services/
│   │   ├── wallet-service.ts (Wallet abstraction)
│   │   ├── blockchain-game-service.ts (Contract calls)
│   │   └── sbtc-service.ts (sBTC gambling)
│   └── types/
│       └── game.ts (TypeScript interfaces)
│
└── public/ (Game assets: sprites, tilesets, audio)
```

### Component Hierarchy

```mermaid
graph TD
    Root[App Root<br/>layout.tsx]

    Root --> Landing[Landing Page<br/>/]
    Root --> GamePage[Game Page<br/>/game]

    Landing --> Navbar[Navbar]
    Landing --> Hero[HeroSection]
    Landing --> Features[FeaturesSection]
    Landing --> HowItWorks[HowItWorksSection]
    Landing --> Tech[TechnologySection]
    Landing --> Footer[Footer]

    Navbar --> WalletConnect[WalletConnect]

    GamePage --> PhaserScreen[PhaserGameScreen]
    PhaserScreen --> PhaserClient[PhaserGameClient]

    PhaserClient --> Canvas[Phaser Game Canvas<br/>ref-based]
    PhaserClient --> StatsHUD[Character Stats HUD]
    PhaserClient --> CombatPanel[Combat Panel<br/>conditional]
    PhaserClient --> Inventory[Inventory Sidebar]
    PhaserClient --> CombatLog[Combat Log Terminal]
    PhaserClient --> DeathScreen[Death Screen Overlay]
    PhaserClient --> EpicLoot[Epic Loot Notification]

    DeathScreen --> ResButton[Resurrection Button]

    style PhaserClient fill:#b39ddb,stroke:#5e35b1,stroke-width:3px
    style Canvas fill:#81c784,stroke:#388e3c,stroke-width:2px
    style DeathScreen fill:#e57373,stroke:#c62828,stroke-width:2px
    style ResButton fill:#ffd54f,stroke:#f57c00,stroke-width:2px
```

### State Management Strategy

```typescript
// Game State (local to PhaserGameClient)
const [character, setCharacter] = useState<GameCharacter>({...})
const [currentMonster, setCurrentMonster] = useState<Monster | null>(null)
const [inventory, setInventory] = useState<LootItem[]>([])
const [isInCombat, setIsInCombat] = useState(false)

// Blockchain State
const [isBlockchainConnected, setIsBlockchainConnected] = useState(false)
const [sbtcBalance, setSbtcBalance] = useState<SbtcBalance>({...})
const [pendingTransactions, setPendingTransactions] = useState<Set<string>>(new Set())

// Death & Resurrection State
const [deathCountdown, setDeathCountdown] = useState<number | null>(null)
const [canResurrect, setCanResurrect] = useState(false)
const [hasAncientCoin, setHasAncientCoin] = useState(false)
```

### Service Layer Architecture

#### Wallet Service (`wallet-service.ts`)
```typescript
class WalletService {
  // Wallet connection via @stacks/connect
  connectWallet(): Promise<WalletConnectionResult>
  disconnectWallet(): Promise<void>
  getCurrentWalletData(): Promise<WalletConnectionResult | null>

  // Balance queries
  getStxBalance(): Promise<number>
  getSbtcBalance(): Promise<number>

  // Utility
  formatBalance(amount: number, token: 'STX' | 'SBTC'): string
  getNetworkInfo(): NetworkInfo
}
```

#### Blockchain Game Service (`blockchain-game-service.ts`)
```typescript
class BlockchainGameService extends EventEmitter {
  // Initialization
  initialize(walletAddress: string): Promise<void>

  // Contract Interactions
  mintLootNFT(loot: LootItem, recipient: string): Promise<string>
  processCharacterDeath(character: GameCharacter, cause: string, playTime: number): Promise<string>

  // Events
  on('lootMinted', callback)
  on('characterDied', callback)
  on('characterResurrected', callback)
  on('transactionPending', callback)
  on('transactionConfirmed', callback)
  on('error', callback)
}
```

#### sBTC Service (`sbtc-service.ts`)
```typescript
class SbtcService {
  // Balance & Cost
  getSbtcBalance(address: string): Promise<SbtcBalance>
  getResurrectionCost(characterLevel: number): number
  formatSbtcAmount(sats: number): string

  // Resurrection
  canUseResurrection(address: string): Promise<{
    canResurrect: boolean,
    reason?: string,
    sbtcBalance?: SbtcBalance
  }>

  executeResurrectionGamble(
    address: string,
    amount: number,
    characterId: string
  ): Promise<{
    success: boolean,
    won: boolean,
    message: string,
    txId?: string
  }>
}
```

---

## Game Flow

### 1. Player Onboarding
```mermaid
graph TD
    A[Visit Landing Page] --> B{Wallet Connected?}
    B -->|No| C[Click Connect Wallet]
    C --> D[@stacks/connect Modal]
    D --> E[Hiro/Leather/Xverse Wallet]
    E --> F[User Approves]
    F --> G[Wallet Data Stored in Session]
    G --> H[Show STX & sBTC Balances]
    B -->|Yes| H
    H --> I[Click Start Game]
    I --> J[Navigate to /game]
```

### 2. Game Initialization
```mermaid
graph TD
    A[Game Page Loads] --> B[Check Session for Wallet]
    B --> C[Initialize Blockchain Service]
    C --> D[Fetch sBTC Balance]
    D --> E[Calculate Resurrection Cost]
    E --> F[Dynamic Import Phaser Engine]
    F --> G[Create Phaser Game Instance]
    G --> H[Load DungeonScene]
    H --> I[Setup Game Callbacks]
    I --> J{Blockchain Connected?}
    J -->|Yes| K[Listen for Blockchain Events]
    J -->|No| L[Offline Mode]
    K --> M[Game Ready]
    L --> M
```

### 3. Dungeon Exploration
```mermaid
graph TD
    A[Game Start - Floor 1] --> B[Player Moves with WASD]
    B --> C{Collision Event?}
    C -->|Monster| D[Enter Combat]
    C -->|Treasure| E[Open Chest]
    C -->|Stairs| F[Descend to Next Floor]
    C -->|None| B

    D --> G[Combat Loop]
    G --> H{Combat Result?}
    H -->|Victory| I[Gain XP + Loot Roll]
    H -->|Defeat| J[Death Sequence]
    H -->|Flee| B

    E --> K[Roll for Loot]
    K --> L{Rarity Check}
    L -->|Legendary/Mythic| M[Epic Loot Notification]
    L -->|Other| N[Add to Inventory]
    M --> N
    N --> O{Blockchain Connected?}
    O -->|Yes| P[Mint NFT on Stacks]
    O -->|No| Q[Local Storage Only]
    P --> R[Transaction Pending]
    R --> S[NFT Minted Event]

    F --> T[Floor +1]
    T --> U[Difficulty Scales]
    U --> B

    I --> V{Level Up?}
    V -->|Yes| W[Stats Increase]
    V -->|No| B
    W --> B
```

### 4. Death & Resurrection Flow
```mermaid
graph TD
    A[Player Health = 0] --> B[Character Dies Event]
    B --> C[Stop Game Engine]
    C --> D{Blockchain Connected?}

    D -->|Yes| E[Start 5-Minute Countdown]
    D -->|No| F[Start 30-Second Countdown]

    E --> G{Has Ancient Satoshi Coin?}
    F --> H[Show Death Screen]

    G -->|Yes| I[Check sBTC Balance]
    G -->|No| J[Cannot Resurrect]

    I --> K{Balance >= Cost?}
    K -->|Yes| L[Show Resurrection Button]
    K -->|No| M[Insufficient sBTC]

    L --> N[Player Clicks Gamble]
    N --> O[Call resurrection-contract.gamble-for-resurrection]
    O --> P[Contract: Lock sBTC]
    P --> Q[Contract: Call random-oracle.get-coin-flip]
    Q --> R{Result < 47?}

    R -->|Yes WIN| S[Contract: Return sBTC + 10% Bonus]
    S --> T[Contract: Discount Resurrection 50%]
    T --> U[Emit resurrection-success Event]
    U --> V[Frontend: Restore Character]
    V --> W[Health = 75%, Floor -2]
    W --> X[Remove Ancient Coin]
    X --> Y[Resume Game]

    R -->|No LOSE| Z[Contract: Burn sBTC]
    Z --> AA[Distribute to Pools]
    AA --> AB[Emit resurrection-fail Event]
    AB --> AC[Remove Ancient Coin]
    AC --> AD[Character Remains Dead]

    J --> AE[Create Tombstone NFT]
    M --> AE
    AD --> AE
    H --> AE

    AE --> AF[Call core.report-death]
    AF --> AG[Emit tombstone-requested Event]
    AG --> AH[Mint Tombstone NFT]
    AH --> AI[End Game]
```

---

## Data Flow

### Contract to Frontend Communication

```mermaid
sequenceDiagram
    participant UI as Frontend UI
    participant Service as Blockchain Service
    participant Wallet as User Wallet
    participant Contract as Smart Contract
    participant Chain as Stacks Blockchain
    participant State as React State

    Note over UI,State: Example: Loot NFT Minting

    UI->>Service: mintLootNFT(lootItem, address)
    Service->>Service: Build transaction
    Service->>Wallet: openContractCall()
    Wallet-->>UI: Show signing modal
    UI->>Wallet: User signs
    Wallet->>Chain: Broadcast transaction
    Chain-->>Service: txId returned
    Service->>State: emit('transactionPending', txId)
    State->>UI: Show "Minting..." indicator

    Note over Chain: Transaction mines (~10 min)

    Chain->>Contract: Execute mint-loot
    Contract->>Contract: Mint NFT
    Contract-->>Chain: NFT minted event

    Note over Service: Poll or chainhook detects

    Service->>State: emit('lootMinted', {lootItem, txId})
    State->>UI: Update combat log
    UI->>UI: Show "💰 NFT Minted!" message
```

### sBTC Gambling Flow (Data Perspective)

```mermaid
sequenceDiagram
    participant Player as Player<br/>(Frontend)
    participant Service as sbtc-service.ts
    participant Wallet as Wallet
    participant Res as resurrection.clar
    participant SBTC as sbtc-token.clar
    participant Oracle as random-oracle.clar
    participant State as React State

    Note over Player: Player Dies
    Player->>Player: Check: Has Ancient Coin?
    Player->>Player: Check: sBTC >= Cost?
    Player->>Service: Click "Gamble"

    Service->>Wallet: Build resurrection transaction
    Wallet->>Player: Request signature
    Player->>Wallet: Approve

    Wallet->>Res: gamble-for-resurrection(amount, character-id)

    Note over Res: Validate eligibility

    Res->>SBTC: transfer(amount, player → contract)
    SBTC-->>Res: sBTC locked ✅

    Res->>Oracle: get-coin-flip(seed)
    Oracle-->>Res: Returns 0-99

    alt Result < 47 (WIN - 47% chance)
        Res->>SBTC: transfer(amount + 10%, contract → player)
        Res->>Res: Discount resurrection 50%
        Res->>State: emit('resurrection-success', {won: true})
        State->>Player: Character revived! 🎉
        Player->>Player: Health = 75%, Floor -2
    else Result >= 47 (LOSE - 53% chance)
        Res->>Res: Distribute sBTC:<br/>Jackpot 30%<br/>Tournament 20%<br/>Platform 30%<br/>Referral 10%
        Res->>State: emit('resurrection-fail', {won: false})
        State->>Player: sBTC burned 💀
        Player->>Player: Character stays dead
    end

    State->>Player: Update UI
    Player->>Player: Remove Ancient Coin
```

---

## Integration Points

### Wallet Integration (@stacks/connect)
```typescript
// Connect wallet
const { userSession } = await showConnect({
  appDetails: {
    name: "Satoshi's Quest",
    icon: window.location.origin + "/logo.png"
  },
  redirectTo: "/",
  onFinish: () => {
    const userData = userSession.loadUserData()
    const address = userData.profile.stxAddress.testnet
    // Store in session, update UI
  }
})
```

### Smart Contract Calls
```typescript
// Example: Mint Loot NFT
import { makeContractCall, PostConditionMode } from '@stacks/transactions'

const txOptions = {
  contractAddress: 'ST2F3J...',
  contractName: 'satoshi-quest-loot',
  functionName: 'mint-loot',
  functionArgs: [
    stringUtf8Cv(lootItem.name),
    uintCv(lootItem.rarity),
    principalCv(recipientAddress)
  ],
  network: new StacksTestnet(),
  postConditionMode: PostConditionMode.Deny,
  postConditions: [/* NFT mint post condition */],
  senderKey: privateKey
}

const transaction = await makeContractCall(txOptions)
const result = await broadcastTransaction(transaction, network)
```

### sBTC Integration
```typescript
// Check sBTC balance (using @stacks/blockchain-api-client)
const balanceUrl = `${API_URL}/extended/v1/address/${address}/balances`
const response = await fetch(balanceUrl)
const data = await response.json()
const sbtcBalance = data.fungible_tokens['sbtc-token::sbtc']?.balance || 0

// Execute sBTC transfer (in resurrection contract)
(contract-call? .sbtc-token transfer amount tx-sender TREASURY_ADDRESS)
```

---

## Next Steps

For detailed information on specific subsystems, see:
- [CONTRACT_INTERACTIONS.md](./CONTRACT_INTERACTIONS.md) - Detailed contract call flows
- [GAME_MECHANICS.md](./GAME_MECHANICS.md) - Game rules and progression
- [SBTC_RESURRECTION_FLOW.md](./SBTC_RESURRECTION_FLOW.md) - Deep dive into gambling mechanic
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - How to deploy and configure

---

**Last Updated**: January 2025
**Version**: 1.0.0
**Authors**: Satoshi's Quest Development Team
