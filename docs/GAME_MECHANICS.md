# Satoshi's Quest - Game Mechanics Documentation

## Table of Contents
1. [Overview](#overview)
2. [Character System](#character-system)
3. [Combat System](#combat-system)
4. [Loot System](#loot-system)
5. [Progression System](#progression-system)
6. [Death & Permadeath](#death--permadeath)
7. [Floor System](#floor-system)
8. [Ancient Satoshi Coin](#ancient-satoshi-coin)

---

## Overview

Satoshi's Quest is a **rogue-like dungeon crawler** with permanent consequences. Every decision matters because death is permanent and recorded on the Bitcoin blockchain.

### Game Genre
- **Rogue-like**: Procedurally generated dungeons, permadeath, turn-based combat
- **Blockchain-Native**: All significant events are recorded on-chain
- **Bitcoin-Backed**: Real economic value through sBTC integration

### Core Loop

```mermaid
graph LR
    A[Explore Dungeon] --> B[Find Treasure/Monsters]
    B --> C[Combat or Loot]
    C --> D[Gain XP/Items]
    D --> E[Level Up]
    E --> F[Descend Deeper]
    F --> A

    C -.Death.-> G[Permadeath]
    G --> H[Tombstone NFT]
    H -.sBTC Gamble.-> I{Resurrection?}
    I -->|Win| A
    I -->|Lose| J[Game Over]

    style G fill:#ef5350,stroke:#c62828
    style I fill:#ffd54f,stroke:#f57c00
    style J fill:#424242,stroke:#212121
```

---

## Character System

### Character Stats

```mermaid
graph TD
    Character[Character Stats]

    Character --> Core[Core Stats]
    Character --> Combat[Combat Stats]
    Character --> Progression[Progression]

    Core --> Name[Name: string]
    Core --> Level[Level: uint]
    Core --> Wallet[Wallet: principal]

    Combat --> Health[Health: uint]
    Combat --> MaxHealth[Max Health: uint]
    Combat --> Attack[Attack: uint]
    Combat --> Defense[Defense: uint]

    Progression --> XP[Experience: uint]
    Progression --> XPNext[XP to Next Level: uint]
    Progression --> Floor[Current Floor: uint]
    Progression --> DeepestFloor[Deepest Floor: uint]

    Character --> Equipment[Equipment]
    Equipment --> Equipped[Equipped Items: list]
    Equipment --> Inventory[Inventory: list]

    style Combat fill:#ef9a9a,stroke:#c62828
    style Progression fill:#a5d6a7,stroke:#2e7d32
    style Equipment fill:#90caf9,stroke:#1976d2
```

### Starting Stats

```typescript
const initialCharacter: GameCharacter = {
  id: 'player-{wallet-hash}',
  name: 'Hero of Bitcoin',
  level: 1,
  health: 100,
  maxHealth: 100,
  attack: 10,
  defense: 5,
  experience: 0,
  experienceToNext: 100,
  currentFloor: 1,
  deepestFloor: 1,
  equipped: [],
  isAlive: true,
  wallet: walletAddress
}
```

### Stat Scaling

```mermaid
graph LR
    subgraph "Level Up Bonuses"
        L[Level +1] --> HP[+10 Max HP]
        L --> ATK[+2 Attack]
        L --> DEF[+1 Defense]
        L --> XP[XP Required = Level × 100]
    end

    subgraph "Equipment Bonuses"
        E[Equip Item] --> EATK[Attack Bonus]
        E --> EDEF[Defense Bonus]
        E --> EHP[Health Bonus]
    end

    HP --> Total[Total Stats]
    ATK --> Total
    DEF --> Total
    EATK --> Total
    EDEF --> Total
    EHP --> Total

    style L fill:#ffd54f,stroke:#f57c00
    style E fill:#90caf9,stroke:#1976d2
```

---

## Combat System

### Combat Flow

```mermaid
sequenceDiagram
    participant Player
    participant Monster
    participant Game

    Note over Player,Monster: Combat Initiated

    loop Each Turn
        Player->>Game: Choose Action (Attack/Defend/Flee)

        alt Attack
            Game->>Game: Calculate Damage<br/>max(1, ATK - Monster.DEF + rand(0-5))
            Game->>Monster: Apply Damage
        else Defend
            Game->>Game: Reduced Damage<br/>max(1, ATK/2 - Monster.DEF)
            Game->>Monster: Apply Damage
            Note over Player: +50% Defense this turn
        else Flee
            Game->>Game: 70% Success Rate
            alt Success
                Game-->>Player: Escape!
            else Fail
                Note over Player: Take full damage
            end
        end

        alt Monster Defeated
            Game->>Player: XP = Monster.Level × 20
            Game->>Player: Roll for Loot
            Note over Player,Monster: Combat Ends
        else Monster Alive
            Monster->>Game: Attack Player
            Game->>Game: Calculate Damage<br/>max(1, Monster.ATK - Player.DEF + rand(0-3))
            Game->>Player: Apply Damage

            alt Player Defeated
                Note over Player: DEATH
            end
        end
    end
```

### Combat Formulas

#### Player Damage
```typescript
// Attack Action
playerDamage = max(1, player.attack - monster.defense + random(0, 5))

// Defend Action
playerDamage = max(1, floor(player.attack / 2) - monster.defense)
monsterDamage = max(1, monster.attack - (player.defense * 1.5)) // Player takes less damage

// Flee Action
fleeSuccess = random(0, 100) < 70 // 70% chance
```

#### Monster Damage
```typescript
monsterDamage = max(1, monster.attack - player.defense + random(0, 3))
```

### Monster Scaling

```mermaid
graph TD
    Floor[Floor Number] --> Difficulty[Difficulty Calculation]

    Difficulty --> Level[Monster Level = Floor]
    Difficulty --> Health[Health = 20 + Floor × 10]
    Difficulty --> Attack[Attack = 5 + Floor × 2]
    Difficulty --> Defense[Defense = 2 + Floor × 1]

    Floor --> Rarity[Monster Rarity]
    Rarity --> Common[Common 60%]
    Rarity --> Uncommon[Uncommon 25%]
    Rarity --> Rare[Rare 10%]
    Rarity --> Elite[Elite 5%]

    Elite --> Bonus[+50% All Stats]

    style Floor fill:#ffd54f,stroke:#f57c00
    style Elite fill:#ef5350,stroke:#c62828
```

---

## Loot System

### Loot Rarity Tiers

```mermaid
graph TD
    Chest[Treasure Chest] --> Roll[Loot Roll]

    Roll --> Common[Common<br/>60% Drop Rate]
    Roll --> Uncommon[Uncommon<br/>25% Drop Rate]
    Roll --> Rare[Rare<br/>10% Drop Rate]
    Roll --> Epic[Epic<br/>3% Drop Rate]
    Roll --> Legendary[Legendary<br/>1.5% Drop Rate]
    Roll --> Mythic[Mythic<br/>0.5% Drop Rate]

    Common --> C[+1-3 ATK/DEF/HP]
    Uncommon --> U[+4-7 ATK/DEF/HP]
    Rare --> R[+8-12 ATK/DEF/HP]
    Epic --> E[+13-18 ATK/DEF/HP]
    Legendary --> L[+19-25 ATK/DEF/HP]
    Mythic --> M[Ancient Satoshi Coin<br/>+30 ATK/DEF/HP]

    style Common fill:#9e9e9e,stroke:#616161
    style Uncommon fill:#66bb6a,stroke:#2e7d32
    style Rare fill:#42a5f5,stroke:#1565c0
    style Epic fill:#ab47bc,stroke:#6a1b9a
    style Legendary fill:#ff9800,stroke:#e65100
    style Mythic fill:#f44336,stroke:#b71c1c
```

### Loot Generation Algorithm

```typescript
function generateLoot(floor: number): LootItem {
  const rarityRoll = random(0, 1000)

  // Rarity determination (0.1% increments)
  let rarity: LootRarity
  if (rarityRoll < 5) rarity = 'mythic'        // 0.5%
  else if (rarityRoll < 20) rarity = 'legendary' // 1.5%
  else if (rarityRoll < 50) rarity = 'epic'      // 3%
  else if (rarityRoll < 150) rarity = 'rare'     // 10%
  else if (rarityRoll < 400) rarity = 'uncommon' // 25%
  else rarity = 'common'                          // 60%

  // Special case: Ancient Satoshi Coin
  if (rarity === 'mythic' && floor >= 10) {
    return createAncientSatoshiCoin()
  }

  // Stat bonuses based on rarity
  const bonusRanges = {
    common: [1, 3],
    uncommon: [4, 7],
    rare: [8, 12],
    epic: [13, 18],
    legendary: [19, 25],
    mythic: [30, 40]
  }

  const [min, max] = bonusRanges[rarity]

  return {
    id: generateUniqueId(),
    name: generateItemName(rarity, floor),
    rarity,
    attackBonus: random(min, max),
    defenseBonus: random(min, max),
    healthBonus: random(min * 5, max * 5),
    floor,
    mintedAsNFT: false
  }
}
```

### NFT Minting Criteria

```mermaid
graph TD
    LootFound[Loot Item Found] --> Check{Blockchain Connected?}

    Check -->|No| Local[Store Locally Only]
    Check -->|Yes| Rarity{Check Rarity}

    Rarity --> Common[Common/Uncommon]
    Rarity --> Valuable[Rare/Epic/Legendary/Mythic]

    Common --> Option[Player Choice:<br/>Mint or Skip]
    Valuable --> AutoMint[Auto-Mint as NFT]

    Option --> Mint[Mint NFT]
    AutoMint --> Mint

    Mint --> Tx[Create Transaction]
    Tx --> Sign[User Signs]
    Sign --> Broadcast[Broadcast to Stacks]
    Broadcast --> NFT[SIP-009 NFT Created]

    NFT --> Metadata[Metadata:<br/>- Name<br/>- Rarity<br/>- Stats<br/>- Floor Found<br/>- Timestamp]

    style Valuable fill:#ff9800,stroke:#e65100
    style NFT fill:#66bb6a,stroke:#2e7d32
```

---

## Progression System

### Experience & Leveling

```mermaid
graph TD
    Combat[Defeat Monster] --> XP[Gain XP]
    XP --> Calc[XP = Monster.Level × 20]

    Calc --> Check{Current XP >= Required?}
    Check -->|Yes| LevelUp[LEVEL UP!]
    Check -->|No| Continue[Continue Playing]

    LevelUp --> Stats[Stat Increases]
    Stats --> HP[+10 Max HP]
    Stats --> ATK[+2 Attack]
    Stats --> DEF[+1 Defense]

    LevelUp --> NewReq[New XP Required<br/>= New Level × 100]

    NewReq --> Continue

    style LevelUp fill:#ffd54f,stroke:#f57c00,stroke-width:3px
```

### Level Progression Table

| Level | XP Required | Total XP | Max HP | Attack | Defense |
|-------|-------------|----------|--------|--------|---------|
| 1     | 100         | 0        | 100    | 10     | 5       |
| 2     | 200         | 100      | 110    | 12     | 6       |
| 3     | 300         | 300      | 120    | 14     | 7       |
| 5     | 500         | 1000     | 140    | 18     | 9       |
| 10    | 1000        | 4500     | 190    | 28     | 14      |
| 20    | 2000        | 19000    | 290    | 48     | 24      |
| 50    | 5000        | 122500   | 590    | 108    | 54      |

### Floor Progression

```mermaid
graph TD
    Start[Floor 1] --> Play[Explore & Combat]
    Play --> Stairs{Find Stairs?}

    Stairs -->|Yes| Descend[Descend to Next Floor]
    Stairs -->|No| Play

    Descend --> NewFloor[Floor = Floor + 1]
    NewFloor --> Scale[Scale Difficulty]

    Scale --> Monsters[Stronger Monsters]
    Scale --> Loot[Better Loot]
    Scale --> Danger[Higher Risk]

    Monsters --> Play
    Loot --> Play
    Danger --> Play

    Descend --> Record{New Deepest Floor?}
    Record -->|Yes| Update[Update deepestFloor]
    Record -->|No| Continue

    Update --> Blockchain[Record on Blockchain]

    style Descend fill:#90caf9,stroke:#1976d2
    style Blockchain fill:#66bb6a,stroke:#2e7d32
```

---

## Death & Permadeath

### Death Mechanics

```mermaid
stateDiagram-v2
    [*] --> Alive: Game Start
    Alive --> Combat: Encounter Monster
    Combat --> Alive: Victory
    Combat --> Dead: Health = 0

    Dead --> DeathScreen: Stop Game
    DeathScreen --> Countdown: Start Timer

    Countdown --> CheckCoin: Has Ancient Coin?

    CheckCoin --> NoResurrection: No Coin
    CheckCoin --> CheckBalance: Has Coin

    CheckBalance --> NoResurrection: Insufficient sBTC
    CheckBalance --> ResurrectionAttempt: Sufficient sBTC

    ResurrectionAttempt --> Gamble: Player Chooses

    Gamble --> Win: 47% Chance
    Gamble --> Lose: 53% Chance

    Win --> Alive: Revived!
    Lose --> Tombstone
    NoResurrection --> Tombstone
    Countdown --> Tombstone: Timer Expires

    Tombstone --> NFTMinted: Create Tombstone NFT
    NFTMinted --> [*]: Game Over
```

### Death Countdown

```mermaid
graph LR
    Death[Player Dies] --> Type{Blockchain Connected?}

    Type -->|Yes| Long[5 Minute Countdown]
    Type -->|No| Short[30 Second Countdown]

    Long --> Actions[Player Can:<br/>- Attempt Resurrection<br/>- View Stats<br/>- Accept Fate]
    Short --> Actions

    Actions --> Expire{Timer Expires?}
    Expire -->|Yes| End[Force End Game]
    Expire -->|No| Decision{Player Action?}

    Decision -->|Resurrect| Gamble[sBTC Gambling]
    Decision -->|Give Up| End

    style Long fill:#ffd54f,stroke:#f57c00
    style Gamble fill:#ef5350,stroke:#c62828
```

### Tombstone NFT

```mermaid
graph TD
    Death[Character Death] --> Create[Create Tombstone Data]

    Create --> Metadata[Tombstone Metadata]

    Metadata --> Name[Character Name]
    Metadata --> Level[Final Level]
    Metadata --> Floor[Deepest Floor Reached]
    Metadata --> XP[Total Experience]
    Metadata --> Time[Play Time]
    Metadata --> Cause[Death Cause]
    Metadata --> Score[Final Score]
    Metadata --> Items[Burned Items Count]
    Metadata --> Block[Death Block Height]

    Metadata --> Mint[Mint SIP-009 NFT]
    Mint --> Blockchain[Stacks Blockchain]
    Blockchain --> Bitcoin[Anchored to Bitcoin]

    Bitcoin --> Permanent[Permanently Recorded<br/>Forever]

    style Create fill:#ef5350,stroke:#c62828
    style Permanent fill:#ff6f00,stroke:#e65100,stroke-width:3px
```

---

## Floor System

### Floor Generation

Each floor is **procedurally generated** with:

```mermaid
graph TD
    Generate[Generate Floor] --> Layout[Create Layout]

    Layout --> Rooms[5-10 Rooms]
    Layout --> Corridors[Connecting Corridors]

    Rooms --> Populate[Populate Floor]

    Populate --> Monsters[Place Monsters]
    Populate --> Treasures[Place Treasures]
    Populate --> Stairs[Place Stairs Down]

    Monsters --> Count[Monster Count<br/>= Floor × 2]
    Treasures --> TCount[Treasure Count<br/>= Floor + random(1-3)]
    Stairs --> OneStairs[Always 1 Staircase]

    Count --> Difficulty[Monster Difficulty<br/>= Floor Level]

    style Generate fill:#90caf9,stroke:#1976d2
```

### Floor Difficulty Scaling

```typescript
interface FloorConfig {
  floorNumber: number
  monsterCount: number
  treasureCount: number
  monsterLevelRange: [number, number]
  eliteChance: number
  ancientCoinChance: number
}

function getFloorConfig(floor: number): FloorConfig {
  return {
    floorNumber: floor,
    monsterCount: floor * 2,
    treasureCount: floor + random(1, 3),
    monsterLevelRange: [floor, floor + 2],
    eliteChance: min(0.05 + floor * 0.01, 0.25), // Max 25%
    ancientCoinChance: floor >= 10 ? 0.005 : 0  // 0.5% after floor 10
  }
}
```

---

## Ancient Satoshi Coin

### The Rarest Item

The **Ancient Satoshi Coin** is a mythic item with special properties:

```mermaid
graph TD
    Coin[Ancient Satoshi Coin] --> Properties[Properties]

    Properties --> Stats[Stat Bonuses]
    Properties --> Special[Special Ability]
    Properties --> Rarity[Extreme Rarity]

    Stats --> ATK[+30 Attack]
    Stats --> DEF[+30 Defense]
    Stats --> HP[+150 Health]

    Special --> Resurrect[Enables sBTC<br/>Resurrection Gambling]

    Rarity --> Drop[0.5% Drop Rate]
    Rarity --> Floor[Only Floor 10+]
    Rarity --> Unique[One Per Run]

    Resurrect --> Consumed[Consumed on Use<br/>Win or Lose]

    style Coin fill:#f44336,stroke:#b71c1c,stroke-width:4px
    style Resurrect fill:#ffd54f,stroke:#f57c00,stroke-width:3px
```

### Finding the Ancient Coin

```mermaid
sequenceDiagram
    participant Player
    participant Floor
    participant Chest
    participant Loot
    participant Blockchain

    Note over Player: Floor 10+

    Player->>Floor: Open Treasure Chest
    Floor->>Loot: Roll Loot (0.5% for mythic)

    alt Mythic Roll Success
        Loot->>Loot: Generate Ancient Satoshi Coin
        Loot->>Player: Item Found!
        Player->>Player: Epic Loot Notification 🪙

        Note over Player: Stats Massively Boosted!

        Player->>Blockchain: Mint as NFT
        Blockchain-->>Player: NFT Confirmed

        Note over Player: Resurrection Enabled
    else Normal Loot
        Loot->>Player: Regular Item
    end
```

### Usage in Resurrection

```mermaid
graph LR
    Die[Player Dies] --> Check{Has Ancient Coin?}

    Check -->|No| NoRes[Cannot Resurrect]
    Check -->|Yes| sBTC{Has sBTC Balance?}

    sBTC -->|No| NoRes
    sBTC -->|Yes| Enable[Enable Resurrection<br/>Gambling]

    Enable --> Gamble[Player Gambles sBTC]
    Gamble --> Consumed[Ancient Coin<br/>CONSUMED]

    Consumed --> Result{Win or Lose?}
    Result -->|Win| Revive[Character Revived<br/>75% HP, Floor -2]
    Result -->|Lose| Dead[Permanent Death]

    NoRes --> Tombstone[Create Tombstone]
    Dead --> Tombstone

    style Enable fill:#ffd54f,stroke:#f57c00
    style Consumed fill:#ef5350,stroke:#c62828
    style Revive fill:#66bb6a,stroke:#2e7d32
```

---

## Game Balance

### Risk vs Reward

```mermaid
graph TD
    Deeper[Go Deeper] --> Risk[Higher Risk]
    Deeper --> Reward[Higher Reward]

    Risk --> Death[More Likely to Die]
    Reward --> Loot[Better Loot Drops]
    Reward --> XP[More XP per Kill]
    Reward --> Coin[Higher Ancient Coin Chance]

    Death --> Tombstone[Permanent Loss]
    Tombstone --> sBTC[sBTC Gamble Option]

    Loot --> NFT[Valuable NFTs]
    Coin --> Resurrect[Resurrection Backup]

    NFT --> Economy[Player Economy]
    sBTC --> Economy

    style Risk fill:#ef5350,stroke:#c62828
    style Reward fill:#66bb6a,stroke:#2e7d32
    style Economy fill:#ffd54f,stroke:#f57c00
```

### Difficulty Curve

| Floor Range | Difficulty | Recommended Level | Notable Features |
|-------------|------------|-------------------|------------------|
| 1-5         | Easy       | 1-5              | Tutorial floors, common loot |
| 6-10        | Medium     | 6-10             | Rare loot starts appearing |
| 11-20       | Hard       | 11-20            | Ancient Coins possible, epic loot |
| 21-50       | Very Hard  | 21-50            | Legendary loot, elite monsters |
| 51+         | Extreme    | 51+              | Endgame content |

---

## Strategy Guide

### Optimal Play Patterns

```mermaid
graph TD
    Start[Start Game] --> Early[Early Game: Floors 1-5]

    Early --> Farm[Farm XP & Equipment]
    Farm --> Level[Reach Level 5-7]
    Level --> Mid[Mid Game: Floors 6-15]

    Mid --> Hunt[Hunt for Ancient Coin]
    Hunt --> Found{Coin Found?}

    Found -->|No| Continue[Keep Exploring]
    Found -->|Yes| Safe[PLAY SAFE!]

    Safe --> Deep[Push to Floor 20+]
    Deep --> Risk[Risk Management]

    Risk --> Die{Die?}
    Die -->|No| Deep
    Die -->|Yes| Resurrect{Use Coin?}

    Resurrect -->|Win| Revived[Revived! Push Harder]
    Resurrect -->|Lose| End[Game Over]

    Continue --> Mid

    style Safe fill:#66bb6a,stroke:#2e7d32
    style Resurrect fill:#ffd54f,stroke:#f57c00
    style End fill:#ef5350,stroke:#c62828
```

---

## Next Steps

For more information:
- [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) - Overall system design
- [SBTC_RESURRECTION_FLOW.md](./SBTC_RESURRECTION_FLOW.md) - sBTC gambling mechanics
- [CONTRACT_INTERACTIONS.md](./CONTRACT_INTERACTIONS.md) - Smart contract details
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Setup instructions

---

**Last Updated**: January 2025
**Version**: 1.0.0
**Authors**: Satoshi's Quest Development Team
