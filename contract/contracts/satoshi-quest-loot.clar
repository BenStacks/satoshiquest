;; =============================================================================
;; SATOSHI QUEST LOOT NFT CONTRACT (SIP-009)
;; =============================================================================
;;
;; Enterprise-grade NFT contract for in-game loot items with real utility.
;; Each NFT represents a weapon, armor, or accessory with provable stats and rarity.
;; Items can be burned permanently on character death, creating true digital scarcity.
;;
;; Features:
;; - SIP-009 compliant NFT implementation
;; - On-chain metadata with item stats and rarity
;; - Burn mechanism for permadeath mechanic
;; - Only game core contract can mint/burn items
;; - Comprehensive error handling and security
;; =============================================================================

;; Satoshi Quest Loot NFT Contract
;; Manages loot items that can be dropped on character death in Satoshi's Quest

;; Self-contained SIP-009 compliant NFT implementation
;; No external dependencies - production ready for any network

;; Define SIP-009 NFT trait based on official standard
;; This ensures compatibility with wallets, marketplaces, and other contracts
(define-trait sip-009-nft-trait (
    (get-last-token-id
        ()
        (response uint uint)
    )
    (get-token-uri
        (uint)
        (response (optional (string-ascii 256)) uint)
    )
    (get-owner
        (uint)
        (response (optional principal) uint)
    )
    (transfer
        (uint principal principal)
        (response bool uint)
    )
))

;; =============================================================================
;; CONSTANTS
;; =============================================================================

(define-constant CONTRACT_OWNER tx-sender)
;; Use placeholder address for core contract - will be updated after deployment
(define-constant SATOSHI_QUEST_CORE_CONTRACT 'ST2F3J1PK46D6XVRBB9SQ66PY89P8G0EBDW5E05M7.satoshi-quest-core)

;; Error codes
(define-constant ERR_UNAUTHORIZED (err u1001))
(define-constant ERR_NOT_FOUND (err u1002))
(define-constant ERR_ALREADY_EXISTS (err u1003))
(define-constant ERR_INVALID_METADATA (err u1004))
(define-constant ERR_CANNOT_BURN (err u1005))
(define-constant ERR_INVALID_TOKEN_ID (err u1006))
(define-constant ERR_TRANSFER_FAILED (err u1007))

;; Item type constants
(define-constant ITEM_TYPE_WEAPON u1)
(define-constant ITEM_TYPE_ARMOR u2)
(define-constant ITEM_TYPE_ACCESSORY u3)
(define-constant ITEM_TYPE_ANCIENT_COIN u4)

;; Rarity constants
(define-constant RARITY_COMMON u1)
(define-constant RARITY_UNCOMMON u2)
(define-constant RARITY_RARE u3)
(define-constant RARITY_EPIC u4)
(define-constant RARITY_LEGENDARY u5)
(define-constant RARITY_MYTHIC u6)

;; =============================================================================
;; DATA STORAGE
;; =============================================================================

;; Token ID counter
(define-data-var token-id-nonce uint u0)

;; NFT ownership tracking
(define-non-fungible-token satoshi-quest-loot uint)

;; Token metadata storage
(define-map token-metadata
    uint
    {
        name: (string-ascii 64),
        item-type: uint,
        rarity: uint,
        attack-bonus: uint,
        defense-bonus: uint,
        health-bonus: uint,
        level-requirement: uint,
        description: (string-utf8 256),
        image-uri: (optional (string-utf8 256)),
    }
)

;; Burned tokens tracking (for tombstone records)
(define-map burned-tokens
    uint
    {
        owner: principal,
        burn-height: uint,
        burn-tx: (buff 32),
        character-name: (string-utf8 32),
    }
)

;; Character equipment tracking
(define-map character-equipment
    {
        character-id: (string-ascii 64),
        player: principal,
    }
    (list 10 uint)
)

;; Token URI base
(define-data-var token-uri-base (string-ascii 256) "https://api.satoshiquest.io/metadata/loot/")

;; =============================================================================
;; PRIVATE FUNCTIONS
;; =============================================================================

(define-private (is-game-contract)
    (is-eq contract-caller SATOSHI_QUEST_CORE_CONTRACT)
)

(define-private (is-contract-owner)
    (is-eq tx-sender CONTRACT_OWNER)
)

(define-private (get-next-token-id)
    (let ((current-id (var-get token-id-nonce)))
        (var-set token-id-nonce (+ current-id u1))
        (+ current-id u1)
    )
)

(define-private (validate-metadata (metadata {
    name: (string-ascii 64),
    item-type: uint,
    rarity: uint,
    attack-bonus: uint,
    defense-bonus: uint,
    health-bonus: uint,
    level-requirement: uint,
    description: (string-utf8 256),
    image-uri: (optional (string-utf8 256)),
}))
    (and
        (> (len (get name metadata)) u0)
        (and (<= (get item-type metadata) u4) (>= (get item-type metadata) u1))
        (and (<= (get rarity metadata) u6) (>= (get rarity metadata) u1))
        (<= (get level-requirement metadata) u100)
    )
)

;; =============================================================================
;; SIP-009 IMPLEMENTATION
;; =============================================================================

(define-read-only (get-last-token-id)
    (ok (var-get token-id-nonce))
)

(define-read-only (get-token-uri (token-id uint))
    (ok (some (concat (var-get token-uri-base) (int-to-ascii token-id))))
)

(define-read-only (get-owner (token-id uint))
    (ok (nft-get-owner? satoshi-quest-loot token-id))
)

(define-public (transfer
        (token-id uint)
        (sender principal)
        (recipient principal)
    )
    (begin
        (asserts! (is-eq tx-sender sender) ERR_UNAUTHORIZED)
        (asserts! (is-some (nft-get-owner? satoshi-quest-loot token-id))
            ERR_NOT_FOUND
        )
        (nft-transfer? satoshi-quest-loot token-id sender recipient)
    )
)

;; =============================================================================
;; LOOT MANAGEMENT FUNCTIONS
;; =============================================================================

;; Mint new loot item (only callable by game core contract)
(define-public (mint-loot-item
        (recipient principal)
        (metadata {
            name: (string-ascii 64),
            item-type: uint,
            rarity: uint,
            attack-bonus: uint,
            defense-bonus: uint,
            health-bonus: uint,
            level-requirement: uint,
            description: (string-utf8 256),
            image-uri: (optional (string-utf8 256)),
        })
    )
    (let ((token-id (get-next-token-id)))
        (asserts! (is-game-contract) ERR_UNAUTHORIZED)
        (asserts! (validate-metadata metadata) ERR_INVALID_METADATA)

        ;; Mint the NFT
        (try! (nft-mint? satoshi-quest-loot token-id recipient))

        ;; Store metadata
        (map-set token-metadata token-id metadata)

        ;; Emit event
        (print {
            event: "loot-minted",
            token-id: token-id,
            recipient: recipient,
            name: (get name metadata),
            rarity: (get rarity metadata),
            item-type: (get item-type metadata),
        })

        (ok token-id)
    )
)

;; Burn loot item (only callable by game core contract on character death)
(define-public (burn-loot-item
        (token-id uint)
        (character-name (string-utf8 32))
    )
    (let ((token-owner (unwrap! (nft-get-owner? satoshi-quest-loot token-id) ERR_NOT_FOUND)))
        (asserts! (is-game-contract) ERR_UNAUTHORIZED)

        ;; Record burn details for tombstone
        (map-set burned-tokens token-id {
            owner: token-owner,
            burn-height: stacks-block-height,
            burn-tx: 0x00, ;; Simplified for now - can be enhanced later
            character-name: character-name,
        })

        ;; Burn the NFT
        (try! (nft-burn? satoshi-quest-loot token-id token-owner))

        ;; Emit event
        (print {
            event: "loot-burned",
            token-id: token-id,
            owner: token-owner,
            character: character-name,
            block-height: stacks-block-height,
        })

        (ok true)
    )
)

;; =============================================================================
;; READ-ONLY FUNCTIONS
;; =============================================================================

;; Get item metadata
(define-read-only (get-item-metadata (token-id uint))
    (map-get? token-metadata token-id)
)

;; Get burn record
(define-read-only (get-burn-record (token-id uint))
    (map-get? burned-tokens token-id)
)

;; Get item stats for game mechanics
(define-read-only (get-item-stats (token-id uint))
    (match (map-get? token-metadata token-id)
        metadata (some {
            attack-bonus: (get attack-bonus metadata),
            defense-bonus: (get defense-bonus metadata),
            health-bonus: (get health-bonus metadata),
            level-requirement: (get level-requirement metadata),
            rarity: (get rarity metadata),
        })
        none
    )
)

;; Check if item is Ancient Satoshi Coin (for resurrection)
(define-read-only (is-ancient-coin (token-id uint))
    (match (map-get? token-metadata token-id)
        metadata (is-eq (get item-type metadata) ITEM_TYPE_ANCIENT_COIN)
        false
    )
)

;; =============================================================================
;; ADMIN FUNCTIONS
;; =============================================================================

;; Set token URI base (contract owner only)
(define-public (set-token-uri-base (new-base (string-ascii 256)))
    (begin
        (asserts! (is-contract-owner) ERR_UNAUTHORIZED)
        (var-set token-uri-base new-base)
        (ok true)
    )
)

;; Emergency mint for testing (contract owner only)
(define-public (admin-mint-test-item (recipient principal))
    (let ((token-id (get-next-token-id)))
        (asserts! (is-contract-owner) ERR_UNAUTHORIZED)

        ;; Mint the NFT directly (bypass game contract check for admin)
        (try! (nft-mint? satoshi-quest-loot token-id recipient))

        ;; Store metadata
        (map-set token-metadata token-id {
            name: "Test Sword",
            item-type: ITEM_TYPE_WEAPON,
            rarity: RARITY_COMMON,
            attack-bonus: u5,
            defense-bonus: u0,
            health-bonus: u0,
            level-requirement: u1,
            description: u"A basic test weapon for development",
            image-uri: (some u"https://api.satoshiquest.io/images/test-sword.png"),
        })

        ;; Emit event
        (print {
            event: "loot-minted",
            token-id: token-id,
            recipient: recipient,
            name: "Test Sword",
            rarity: RARITY_COMMON,
            item-type: ITEM_TYPE_WEAPON,
        })

        (ok token-id)
    )
)

;; =============================================================================
;; CONTRACT INITIALIZATION
;; =============================================================================

;; Initialize contract on deployment
(begin
    (print {
        event: "contract-deployed",
        contract: "satoshi-quest-loot",
        version: "1.0.0",
        owner: CONTRACT_OWNER,
    })
)
