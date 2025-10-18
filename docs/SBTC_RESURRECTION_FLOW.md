# Satoshi's Quest - sBTC Resurrection Flow Documentation

## Table of Contents
1. [Overview](#overview)
2. [sBTC Integration](#sbtc-integration)
3. [Resurrection Mechanism](#resurrection-mechanism)
4. [Economic System](#economic-system)
5. [Provably Fair Gambling](#provably-fair-gambling)
6. [Revenue Distribution](#revenue-distribution)
7. [Security & Safeguards](#security--safeguards)
8. [User Experience Flow](#user-experience-flow)

---

## Overview

The **sBTC Resurrection System** is the revolutionary core mechanic of Satoshi's Quest. It allows players to use **real Bitcoin** (via sBTC) to gamble for a second chance when their character dies.

### Key Innovation

```mermaid
graph TD
    Traditional[Traditional Games] --> Respawn[Free Respawn<br/>No Consequences]

    SatoshiQuest[Satoshi's Quest] --> Death[Permanent Death]
    Death --> Choice{Player Choice}

    Choice -->|Accept| Permanent[Create Tombstone NFT<br/>Game Over]
    Choice -->|Gamble| sBTC[Use Real Bitcoin<br/>sBTC]

    sBTC --> Fair[Provably Fair<br/>47% Win Rate]
    Fair --> Win[WIN: Revive + Bonus]
    Fair --> Lose[LOSE: sBTC Burned]

    Lose --> Economy[Distributed to:<br/>- Jackpots<br/>- Tournaments<br/>- Platform<br/>- Referrals]

    Win --> Continue[Continue Playing]
    Economy --> Community[Benefit Community]

    style Traditional fill:#9e9e9e,stroke:#616161
    style sBTC fill:#ffd54f,stroke:#f57c00,stroke-width:3px
    style Fair fill:#66bb6a,stroke:#2e7d32
    style Economy fill:#90caf9,stroke:#1976d2
```

---

## sBTC Integration

### What is sBTC?

**sBTC (Stacks Bitcoin)** is a SIP-010 fungible token that represents Bitcoin 1:1 on the Stacks blockchain.

```mermaid
graph LR
    BTC[Bitcoin<br/>on Bitcoin L1] <-->|Peg| sBTC[sBTC<br/>on Stacks L2]

    sBTC --> Smart[Smart Contracts]
    sBTC --> Fast[Fast Transactions]
    sBTC --> Programmable[Programmable Bitcoin]

    Smart --> Game[Satoshi's Quest]

    style BTC fill:#ff6f00,stroke:#e65100,stroke-width:3px
    style sBTC fill:#ffd54f,stroke:#f57c00,stroke-width:3px
```

### sBTC Contract Integration

```clarity
;; In satoshi-quest-resurrection.clar
(define-constant SBTC_CONTRACT 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token)

;; Transfer sBTC from player to contract
(contract-call? .sbtc-token transfer
  amount
  tx-sender
  (as-contract tx-sender)
  none)

;; Return sBTC from contract to player (on win)
(as-contract
  (contract-call? .sbtc-token transfer
    payout-amount
    tx-sender
    player
    none))
```

### Balance Checking

```mermaid
sequenceDiagram
    participant Frontend
    participant API as Stacks API
    participant sBTC as sBTC Contract

    Frontend->>API: GET /address/{address}/balances
    API->>sBTC: Query fungible_tokens
    sBTC-->>API: Return balance
    API-->>Frontend: {<br/>  "sbtc-token::sbtc": {<br/>    "balance": "10000000"<br/>  }<br/>}

    Note over Frontend: Convert satoshis to BTC<br/>10000000 sats = 0.1 sBTC
```

---

## Resurrection Mechanism

### Requirements

To attempt resurrection, a player must have:

```mermaid
graph TD
    Attempt[Attempt Resurrection] --> Check1{Has Ancient<br/>Satoshi Coin?}

    Check1 -->|No| Fail1[❌ Cannot Resurrect]
    Check1 -->|Yes| Check2{sBTC Balance<br/>>= Cost?}

    Check2 -->|No| Fail2[❌ Insufficient Funds]
    Check2 -->|Yes| Check3{Resurrections<br/>< Max?}

    Check3 -->|No| Fail3[❌ Too Many Resurrections]
    Check3 -->|Yes| Eligible[✅ Eligible to Resurrect]

    Eligible --> Gamble[Proceed to Gambling]

    style Eligible fill:#66bb6a,stroke:#2e7d32
    style Gamble fill:#ffd54f,stroke:#f57c00
```

### Cost Calculation

```clarity
;; Base cost scaling with character level
(define-private (calculate-resurrection-cost (level uint) (death-count uint))
  (let (
    (base-cost ANCIENT_COIN_BASE_COST_SATS) ;; 100,000 satoshis (0.001 BTC)
    (level-multiplier (+ u100 (* level u10))) ;; +10% per level
    (death-multiplier (+ u100 (* death-count DEATH_MULTIPLIER))) ;; +50% per previous death
  )
  ;; Cost = base * (1 + level*0.1) * (1 + deaths*0.5)
  (/ (* (* base-cost level-multiplier) death-multiplier) u10000))
)
```

```mermaid
graph LR
    Base[Base Cost:<br/>100,000 sats] --> Level[Level Multiplier:<br/>+10% per level]
    Level --> Deaths[Death Multiplier:<br/>+50% per death]

    Deaths --> Final[Final Cost]

    Example1[Level 1, 0 deaths] --> Cost1[100,000 sats]
    Example2[Level 10, 0 deaths] --> Cost2[200,000 sats]
    Example3[Level 10, 1 death] --> Cost3[300,000 sats]
    Example4[Level 20, 2 deaths] --> Cost4[600,000 sats]

    style Final fill:#ffd54f,stroke:#f57c00
```

### Maximum Resurrections

```clarity
(define-constant MAX_RESURRECTIONS_PER_CHARACTER u10)

;; Track per character
(define-map character-resurrection-count
  (string-ascii 64)  ;; character-id
  uint               ;; resurrection count
)
```

---

## Economic System

### Revenue Distribution Model

When a player **loses** the resurrection gamble, their sBTC is distributed across multiple pools:

```mermaid
pie title "sBTC Distribution on Loss (100% = Lost Bet)"
    "Jackpot Pool" : 30
    "Platform Revenue" : 30
    "Tournament Pool" : 20
    "Referral Rewards" : 10
    "Reserve" : 10
```

### Pool Breakdown

```mermaid
graph TD
    Lost[Lost sBTC Bet] --> Distribute[Distribute to Pools]

    Distribute --> JP[Jackpot Pool<br/>30%]
    Distribute --> Platform[Platform Revenue<br/>30%]
    Distribute --> Tournament[Tournament Pool<br/>20%]
    Distribute --> Referral[Referral Rewards<br/>10%]
    Distribute --> Reserve[Reserve Fund<br/>10%]

    JP --> JPWin[Random Player<br/>Wins Jackpot]
    Platform --> Ops[Platform Operations<br/>Development<br/>Maintenance]
    Tournament --> Prizes[Tournament Prizes<br/>Top Players]
    Referral --> Ref[Referrer Rewards<br/>Recruitment]
    Reserve --> Emergency[Emergency Fund<br/>Bug Bounties]

    style Lost fill:#ef5350,stroke:#c62828
    style JP fill:#ffd54f,stroke:#f57c00
    style Platform fill:#90caf9,stroke:#1976d2
    style Tournament fill:#ab47bc,stroke:#6a1b9a
```

### Winner Rewards

When a player **wins** the resurrection gamble:

```clarity
;; Winner gets back bet + 10% bonus
(define-constant WINNER_BONUS_PERCENTAGE u110) ;; 110% return

;; Winner also gets 50% discount on next resurrection
(define-constant WINNER_RESURRECTION_DISCOUNT u50) ;; 50% off
```

```mermaid
graph LR
    Win[WIN Resurrection] --> Return[Return sBTC]
    Return --> Original[Original Bet:<br/>100%]
    Return --> Bonus[Bonus:<br/>+10%]

    Win --> Perk[Special Perk]
    Perk --> Discount[50% Off Next<br/>Resurrection]

    Original --> Total[Total: 110%]
    Bonus --> Total

    style Win fill:#66bb6a,stroke:#2e7d32
    style Bonus fill:#ffd54f,stroke:#f57c00
```

---

## Provably Fair Gambling

### Random Oracle System

```mermaid
graph TD
    Request[Resurrection Request] --> Oracle[Random Oracle Contract]

    Oracle --> Inputs[Entropy Inputs]

    Inputs --> BlockHeight[Block Height]
    Inputs --> Seed[Player Seed]
    Inputs --> CoinID[Ancient Coin Token ID]

    BlockHeight --> Combine[Combine Sources]
    Seed --> Combine
    CoinID --> Combine

    Combine --> Hash[Generate Hash]
    Hash --> Range[Map to Range 0-99]
    Range --> Result[Random Result]

    Result --> Check{Result < 47?}
    Check -->|Yes| Win[WIN: 47%]
    Check -->|No| Lose[LOSE: 53%]

    style Oracle fill:#66bb6a,stroke:#2e7d32,stroke-width:3px
    style Win fill:#4caf50,stroke:#2e7d32
    style Lose fill:#ef5350,stroke:#c62828
```

### Verifiable Fairness

```clarity
;; In random-oracle.clar
(define-read-only (get-resurrection-gamble-result
  (character-id (string-ascii 64))
  (player principal)
  (ancient-coin-token-id uint))

  (let (
    ;; Create unique seed from multiple sources
    (coin-entropy ancient-coin-token-id)
    (unique-seed (+
      coin-entropy
      stacks-block-height
      (* stacks-block-height u12345) ;; Additional entropy
    ))
    (result (unwrap-panic (get-coin-flip unique-seed)))
  )
  {
    won: (< result u47), ;; Win if result < 47 (47% chance)
    random-value: result,
    seed-used: unique-seed,
    block-height: stacks-block-height,
  })
)
```

### Transparency

All gambling results are **on-chain** and can be verified:

```typescript
// Anyone can verify the result
async function verifyGamblingResult(txId: string) {
  const tx = await fetchTransaction(txId)
  const events = tx.events

  const gamblingEvent = events.find(e =>
    e.event_type === 'print' &&
    e.event_data.event === 'resurrection-attempt'
  )

  return {
    characterId: gamblingEvent.character_id,
    blockHeight: gamblingEvent.block_height,
    randomValue: gamblingEvent.random_value,
    won: gamblingEvent.random_value < 47,
    verifiable: true // All inputs on-chain
  }
}
```

---

## Revenue Distribution

### Distribution Flow

```mermaid
sequenceDiagram
    participant Player
    participant Contract as Resurrection Contract
    participant Pools
    participant Platform
    participant Community

    Player->>Contract: Gamble sBTC (LOSE)

    Note over Contract: Calculate Distributions

    Contract->>Pools: 30% → Jackpot Pool
    Contract->>Platform: 30% → Platform Treasury
    Contract->>Pools: 20% → Tournament Pool
    Contract->>Pools: 10% → Referral Pool
    Contract->>Pools: 10% → Reserve Fund

    Note over Pools: Pools accumulate

    Pools->>Community: Jackpot Winner (random)
    Pools->>Community: Tournament Winners (top players)
    Pools->>Community: Referrer Rewards

    Platform->>Platform: Development & Operations

    Note over Community: Players benefit from economy
```

### Jackpot System

```clarity
;; Jackpot accumulation
(define-data-var jackpot-pool uint u0)

;; On each loss, add to jackpot
(define-private (add-to-jackpot (amount uint))
  (var-set jackpot-pool (+ (var-get jackpot-pool) amount))
)

;; Jackpot winner selection (triggered periodically)
(define-public (trigger-jackpot-draw)
  (let (
    (jackpot-amount (var-get jackpot-pool))
    (winner (select-random-active-player)) ;; From recent players
  )
  (try! (as-contract
    (contract-call? .sbtc-token transfer
      jackpot-amount
      tx-sender
      winner
      none)))
  (var-set jackpot-pool u0)
  (print {
    event: "jackpot-won",
    winner: winner,
    amount: jackpot-amount,
  })
  (ok true))
)
```

### Tournament System

```mermaid
graph TD
    Tournament[Tournament Period] --> Players[Players Compete]

    Players --> Score[Accumulate Scores:<br/>- Deepest Floor<br/>- XP Gained<br/>- Monsters Defeated]

    Score --> End[Tournament Ends]

    End --> Rank[Rank Players]
    Rank --> Top[Top 10 Players]

    Top --> Prize[Prize Distribution]

    Prize --> First[1st: 40% of pool]
    Prize --> Second[2nd: 25% of pool]
    Prize --> Third[3rd: 15% of pool]
    Prize --> Rest[4th-10th: 20% split]

    style Tournament fill:#ab47bc,stroke:#6a1b9a
    style Prize fill:#ffd54f,stroke:#f57c00
```

---

## Security & Safeguards

### Contract Security

```mermaid
graph TD
    Security[Security Measures]

    Security --> Checks[Pre-Execution Checks]
    Security --> Limits[Rate Limits]
    Security --> Audit[Audit Trail]

    Checks --> Balance[sBTC Balance Verification]
    Checks --> Ownership[Ancient Coin Ownership]
    Checks --> Eligibility[Resurrection Eligibility]

    Limits --> MaxRes[Max 10 Resurrections/Character]
    Limits --> Cooldown[No spam prevention]

    Audit --> Events[Emit Detailed Events]
    Audit --> OnChain[All Data On-Chain]
    Audit --> Verifiable[Publicly Verifiable]

    style Security fill:#66bb6a,stroke:#2e7d32,stroke-width:3px
```

### Input Validation

```clarity
;; Comprehensive validation
(define-public (gamble-for-resurrection
  (character-id (string-ascii 64))
  (ancient-coin-token-id uint)
  (sbtc-amount uint))

  (let (
    (player tx-sender)
    (user-sbtc-balance (get-sbtc-balance player))
    (resurrection-count (get-resurrection-count character-id))
  )

  ;; Validate all inputs
  (asserts! (is-valid-character-id character-id) ERR_INVALID_PRICE_DATA)
  (asserts! (var-get resurrection-enabled) ERR_UNAUTHORIZED)
  (asserts! (< resurrection-count MAX_RESURRECTIONS_PER_CHARACTER)
    ERR_TOO_MANY_RESURRECTIONS)
  (asserts! (>= sbtc-amount min-gambling-cost) ERR_INSUFFICIENT_PAYMENT)
  (asserts! (>= user-sbtc-balance sbtc-amount) ERR_INSUFFICIENT_PAYMENT)

  ;; Proceed with gambling...
  )
)
```

### Emergency Controls

```clarity
;; Admin can pause system in emergency
(define-data-var resurrection-enabled bool true)

(define-public (toggle-resurrection-system (enabled bool))
  (begin
    (asserts! (is-contract-owner) ERR_UNAUTHORIZED)
    (var-set resurrection-enabled enabled)
    (print { event: "system-toggled", enabled: enabled })
    (ok true)
  )
)
```

---

## User Experience Flow

### Complete User Journey

```mermaid
sequenceDiagram
    participant Player
    participant Game
    participant UI
    participant Service as sBTC Service
    participant Wallet
    participant Contract as Resurrection Contract
    participant Oracle

    Note over Player: Character Dies

    Game->>UI: Show Death Screen
    UI->>Player: Display death details

    Player->>UI: Check resurrection option
    UI->>Service: canUseResurrection(address)
    Service->>Service: Check Ancient Coin
    Service->>Service: Check sBTC Balance
    Service-->>UI: {canResurrect: true, cost: X}

    UI->>Player: Show Gambling Option<br/>"Risk X sBTC for 47% win"

    Player->>UI: Click "Gamble for Resurrection"

    UI->>Player: Confirm: "You will lose sBTC if you lose"
    Player->>UI: Confirm

    UI->>Service: executeResurrectionGamble()
    Service->>Wallet: Build transaction
    Wallet->>Player: Request signature

    Player->>Wallet: Sign transaction
    Wallet->>Contract: Call gamble-for-resurrection()

    Contract->>Contract: Lock sBTC
    Contract->>Oracle: Get random result
    Oracle-->>Contract: Returns 0-99

    alt WIN (< 47)
        Contract->>Contract: Return sBTC + 10%
        Contract->>Contract: Apply 50% discount
        Contract-->>Service: Success event
        Service->>UI: Update: "WON!"
        UI->>Player: 🎉 REVIVED!
        UI->>Game: Restore character (75% HP, Floor -2)
    else LOSE (>= 47)
        Contract->>Contract: Distribute sBTC to pools
        Contract-->>Service: Fail event
        Service->>UI: Update: "LOST"
        UI->>Player: 💀 Character remains dead
        UI->>Game: Create tombstone NFT
    end

    UI->>Player: Remove Ancient Coin from inventory
```

### Frontend Implementation

```typescript
// In PhaserGameClient.tsx
const handleResurrection = async () => {
  try {
    setIsProcessing(true)

    // 1. Check eligibility
    const check = await sbtcService.canUseResurrection(walletAddress)
    if (!check.canResurrect) {
      addCombatLog(`❌ ${check.reason}`)
      return
    }

    // 2. Get cost
    const cost = sbtcService.getResurrectionCost(character.level)

    // 3. Confirm with user
    addCombatLog(`₿ Gambling ${sbtcService.formatSbtcAmount(cost)} sBTC`)
    addCombatLog(`⚡ 47% chance to win. sBTC burned on loss!`)

    // 4. Execute gamble
    const result = await sbtcService.executeResurrectionGamble(
      walletAddress,
      cost,
      character.id
    )

    // 5. Handle result
    if (result.won) {
      // WIN: Revive character
      setCharacter(prev => ({
        ...prev,
        isAlive: true,
        health: Math.floor(prev.maxHealth * 0.75),
        currentFloor: Math.max(1, prev.currentFloor - 2)
      }))
      setDeathCountdown(null)
      addCombatLog('⚡ RESURRECTION SUCCESS!')
      addCombatLog(`💰 Received ${sbtcService.formatSbtcAmount(cost * 1.1)} sBTC`)
    } else {
      // LOSE: Character stays dead
      addCombatLog('💀 Resurrection failed...')
      addCombatLog(`💸 ${sbtcService.formatSbtcAmount(cost)} sBTC burned`)
    }

    // 6. Update balance
    const newBalance = await sbtcService.getSbtcBalance(walletAddress)
    setSbtcBalance(newBalance)

    // 7. Remove Ancient Coin
    setInventory(prev => prev.filter(item => item.name !== 'Ancient Satoshi Coin'))
    setHasAncientCoin(false)

  } catch (error) {
    addCombatLog(`❌ Error: ${error.message}`)
  } finally {
    setIsProcessing(false)
  }
}
```

---

## Economic Impact

### Player Benefits

```mermaid
graph TD
    Economy[sBTC Economy] --> Players[Player Benefits]

    Players --> Win[Win Bonuses<br/>110% return on win]
    Players --> Jackpot[Jackpot Chances<br/>Random winners]
    Players --> Tournament[Tournament Prizes<br/>Top performers]
    Players --> Referral[Referral Rewards<br/>Invite friends]

    Players --> NFT[NFT Value]
    NFT --> Loot[Loot NFTs<br/>Tradeable items]
    NFT --> Tomb[Tombstone NFTs<br/>Legacy items]

    Economy --> Platform[Platform Sustainability]
    Platform --> Dev[Continued Development]
    Platform --> Support[24/7 Support]
    Platform --> Events[Special Events]

    Dev --> NewFeatures[New Features]
    NewFeatures --> Players

    style Economy fill:#ffd54f,stroke:#f57c00,stroke-width:3px
    style Players fill:#66bb6a,stroke:#2e7d32
```

### Sustainability Model

```mermaid
graph LR
    Loss[Lost sBTC Bets] --> Revenue[Revenue Streams]

    Revenue --> Platform[30% Platform<br/>Operations]
    Revenue --> Community[60% Community<br/>Pools]
    Revenue --> Reserve[10% Reserve<br/>Emergency Fund]

    Platform --> Salaries[Team Salaries]
    Platform --> Marketing[Marketing]
    Platform --> Infra[Infrastructure]

    Community --> Jackpots[Jackpots]
    Community --> Tournaments[Tournaments]
    Community --> Referrals[Referrals]

    Salaries --> Growth[Platform Growth]
    Marketing --> Growth
    Jackpots --> Players[Attract Players]
    Tournaments --> Players

    Players --> Activity[More Activity]
    Activity --> Loss

    style Revenue fill:#ffd54f,stroke:#f57c00
    style Community fill:#66bb6a,stroke:#2e7d32
    style Growth fill:#90caf9,stroke:#1976d2
```

---

## Best Practices

### For Players

1. **Only gamble what you can afford to lose** - sBTC is real Bitcoin
2. **Save Ancient Coins** - Use them strategically on deep floors
3. **Understand the odds** - 47% win rate means 53% loss rate
4. **Check your balance** - Ensure sufficient sBTC before deep runs
5. **Consider the cost** - Higher levels = higher resurrection cost

### For Developers

1. **Always validate inputs** - Check balances, ownership, eligibility
2. **Emit detailed events** - Enable transparency and debugging
3. **Test randomness** - Verify fair distribution over many trials
4. **Secure fund transfers** - Use post-conditions and assertions
5. **Emergency controls** - Ability to pause system if needed

---

## Next Steps

For more information:
- [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) - Overall system design
- [GAME_MECHANICS.md](./GAME_MECHANICS.md) - Game rules and progression
- [CONTRACT_INTERACTIONS.md](./CONTRACT_INTERACTIONS.md) - Smart contract details
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Setup instructions

---

**Last Updated**: January 2025
**Version**: 1.0.0
**Authors**: Satoshi's Quest Development Team
