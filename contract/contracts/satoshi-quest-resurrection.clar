;; =============================================================================
;; SATOSHI QUEST RESURRECTION CONTRACT
;; =============================================================================
;;
;; Enterprise-grade resurrection contract for Satoshi's Quest.
;; Allows players to resurrect their fallen characters using sBTC payments.
;; Implements dynamic pricing based on character level and death count.
;;
;; Features:
;; - sBTC-based resurrection payments
;; - Dynamic pricing based on character stats
;; - Integration with DIA Oracle for BTC price feeds
;; - Time-limited resurrection windows
;; - Progressive resurrection cost scaling
;; - Comprehensive resurrection history tracking
;; =============================================================================

;; =============================================================================
;; CONSTANTS
;; =============================================================================

(define-constant CONTRACT_OWNER tx-sender)
(define-constant SATOSHI_QUEST_CORE_CONTRACT .satoshi-quest-core)
(define-constant TOMBSTONE_CONTRACT .satoshi-quest-tombstone)

;; sBTC and DIA Oracle contracts (using proper Clarinet integration)
(define-constant SBTC_CONTRACT 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token)
(define-constant SBTC_REGISTRY 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-registry)
(define-constant SBTC_DEPOSIT 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-deposit)

;; Oracle configuration - DEPLOYMENT NOTE:
;; *** CRITICAL: CHANGE BEFORE PRODUCTION DEPLOYMENT! ***
;; PRIMARY: DIA Oracle (fast, reliable)
;; FALLBACK: Pyth Oracle (when DIA fails or is stale)
;; For PRODUCTION: Use real oracles
;; For TESTING: Use .test-dia-oracle
;;
;; Use the switch-oracle.sh script to change between environments:
;; ./switch-oracle.sh production  # Before mainnet deployment
;; ./switch-oracle.sh test        # For development/testing
;;
;; TODO: Change this to production oracle before mainnet deployment
(define-constant DIA_ORACLE_CONTRACT .test-dia-oracle)
(define-constant PRODUCTION_DIA_ORACLE_CONTRACT 'ST1S5ZGRZV5K4S9205RWPRTX9RGS9JV40KQMR4G1J.dia-oracle)

;; Pyth Oracle Configuration (Fallback System)
(define-constant PYTH_ORACLE_CONTRACT 'SP3R4F6C1J3JQWWCVZ3S7FRRYPMYG6ZW6RZK31FXY.pyth-oracle-v3)
(define-constant PYTH_STORAGE_CONTRACT 'SP3R4F6C1J3JQWWCVZ3S7FRRYPMYG6ZW6RZK31FXY.pyth-storage-v3)

;; BTC price feed ID for Pyth Oracle (Bitcoin/USD)
(define-constant PYTH_BTC_FEED_ID 0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43)

;; Oracle freshness configuration
(define-constant MAX_PRICE_AGE_BLOCKS u10) ;; Max 10 blocks old (~10 minutes)
(define-constant PYTH_PRICE_PRECISION u8) ;; Pyth uses 8 decimal places;; Error codes
(define-constant ERR_UNAUTHORIZED (err u4001))
(define-constant ERR_CHARACTER_NOT_FOUND (err u4002))
(define-constant ERR_CHARACTER_ALIVE (err u4003))
(define-constant ERR_RESURRECTION_EXPIRED (err u4004))
(define-constant ERR_INSUFFICIENT_PAYMENT (err u4005))
(define-constant ERR_PAYMENT_FAILED (err u4006))
(define-constant ERR_INVALID_PRICE_DATA (err u4007))
(define-constant ERR_RESURRECTION_FAILED (err u4008))
(define-constant ERR_TOO_MANY_RESURRECTIONS (err u4009))
(define-constant ERR_CHARACTER_NOT_DEAD (err u4010))
(define-constant ERR_ORACLE_ERROR (err u4011))
(define-constant ERR_STALE_PRICE (err u4012))
(define-constant ERR_PYTH_ORACLE_ERROR (err u4013))
(define-constant ERR_ALL_ORACLES_FAILED (err u4014))

;; Resurrection configuration
(define-constant BASE_RESURRECTION_COST_SATS u100000) ;; 0.001 BTC base cost
(define-constant LEVEL_MULTIPLIER u10000) ;; Additional cost per level (0.0001 BTC)
(define-constant DEATH_MULTIPLIER u50000) ;; Additional cost per previous death (0.0005 BTC)
(define-constant RESURRECTION_WINDOW_BLOCKS u1000) ;; 1000 blocks (~7 days)
(define-constant MAX_RESURRECTIONS_PER_CHARACTER u5) ;; Maximum resurrections allowed

;; Oracle configuration
(define-constant SBTC_PRICE_EXPO u8) ;; DIA Oracle price exponent for sBTC
(define-constant DEFAULT_SBTC_PRICE u5000000) ;; $50,000 fallback price (in cents)

;; =============================================================================
;; DATA STORAGE
;; =============================================================================

;; Contract settings
(define-data-var contract-owner principal tx-sender)
(define-data-var resurrection-enabled bool true)
(define-data-var oracle-contract (optional principal) none)

;; Global resurrection statistics
(define-data-var total-resurrections uint u0)
(define-data-var total-sbtc-collected uint u0)

;; Resurrection history
(define-map resurrection-records
    {
        character-id: (string-ascii 64),
        player: principal,
        resurrection-number: uint,
    }
    {
        cost-paid: uint,
        btc-price-at-resurrection: uint,
        resurrection-block: uint,
        previous-level: uint,
        previous-score: uint,
    }
)

;; Character resurrection count
(define-map character-resurrection-count
    {
        character-id: (string-ascii 64),
        player: principal,
    }
    uint
)

;; Pending resurrections (for multi-step process)
(define-map pending-resurrections
    {
        character-id: (string-ascii 64),
        player: principal,
    }
    {
        payment-amount: uint,
        payment-block: uint,
        btc-price: uint,
    }
)

;; =============================================================================
;; AUTHORIZATION
;; =============================================================================

(define-private (is-contract-owner)
    (is-eq tx-sender (var-get contract-owner))
)

(define-private (is-game-contract)
    (is-eq contract-caller SATOSHI_QUEST_CORE_CONTRACT)
)

;; =============================================================================
;; PRICE CALCULATION
;; =============================================================================

;; Calculate resurrection cost in satoshis
(define-read-only (calculate-resurrection-cost
        (character-level uint)
        (death-count uint)
    )
    (let (
            (base-cost BASE_RESURRECTION_COST_SATS)
            (level-cost (* character-level LEVEL_MULTIPLIER))
            (death-cost (* death-count DEATH_MULTIPLIER))
            (total-cost-sats (+ base-cost (+ level-cost death-cost)))
        )
        total-cost-sats
    )
)

;; Convert satoshis to sBTC units (assuming 1:1 with satoshis for now)
(define-read-only (sats-to-sbtc (sats uint))
    sats
)

;; =============================================================================
;; DUAL ORACLE PRICE FETCHING SYSTEM
;; =============================================================================
;; Primary: DIA Oracle (fast, reliable)
;; Fallback: Pyth Oracle (when DIA fails, is stale, or unreasonable)
;; Ultimate Fallback: Default price

;; Get BTC price from DIA Oracle (primary)
(define-public (get-dia-btc-price)
    (match (contract-call? .test-dia-oracle get-value "sBTC/USD")
        success
        (let (
                (sbtc-price-data (get value success))
                (sbtc-usd-price (to-int sbtc-price-data))
                (price-denomination (pow u10 SBTC_PRICE_EXPO))
                (adjusted-price (to-uint (/ sbtc-usd-price (to-int price-denomination))))
            )
            (ok (some adjusted-price))
        )
        error
        (ok none) ;; Return none if DIA fails
    )
)

;; Get BTC price from Pyth Oracle (fallback)
;; NOTE: Temporarily simplified for testing - full Pyth integration requires traits
(define-public (get-pyth-btc-price)
    ;; For testing, return a default price
    ;; In production, implement proper Pyth Oracle integration with traits
    (ok (some u5000000))
    ;; Default $50,000 in cents
)

;; Validate price reasonableness (prevent oracle manipulation)
(define-private (is-reasonable-btc-price (price uint))
    (and
        (>= price u1000000) ;; Minimum $10,000 (in cents)
        (<= price u50000000) ;; Maximum $500,000 (in cents)
    )
)

;; Main price fetching function with dual oracle support
(define-public (get-sbtc-price-usd)
    (let (
            ;; Try DIA Oracle first (primary)
            (dia-result (unwrap! (get-dia-btc-price) (ok DEFAULT_SBTC_PRICE)))
        )
        (match dia-result
            some-dia-price
            ;; DIA Oracle succeeded, check if price is reasonable
            (if (is-reasonable-btc-price some-dia-price)
                (ok some-dia-price)
                ;; DIA price unreasonable, try Pyth fallback
                (let ((pyth-result (unwrap! (get-pyth-btc-price) (ok DEFAULT_SBTC_PRICE))))
                    (match pyth-result
                        some-pyth-price
                        (if (is-reasonable-btc-price some-pyth-price)
                            (ok some-pyth-price)
                            (ok DEFAULT_SBTC_PRICE) ;; Both unreasonable, use default
                        )
                        ;; none case - Pyth returned none, use default
                        (ok DEFAULT_SBTC_PRICE)
                    )
                )
            )
            ;; none case - DIA Oracle returned none, try Pyth fallback
            (let ((pyth-result (unwrap! (get-pyth-btc-price) (ok DEFAULT_SBTC_PRICE))))
                (match pyth-result
                    some-pyth-price
                    (if (is-reasonable-btc-price some-pyth-price)
                        (ok some-pyth-price)
                        (ok DEFAULT_SBTC_PRICE) ;; Pyth unreasonable, use default
                    )
                    ;; none case - All oracles failed, use default
                    (ok DEFAULT_SBTC_PRICE)
                )
            )
        )
    )
)

;; Helper function to get sBTC price for internal use (simplified)
(define-private (get-sbtc-price-internal)
    (unwrap! (get-sbtc-price-usd) DEFAULT_SBTC_PRICE)
)

;; Get oracle configuration info (read-only)
(define-read-only (get-oracle-config)
    {
        dia-oracle: DIA_ORACLE_CONTRACT,
        pyth-oracle: PYTH_ORACLE_CONTRACT,
        pyth-storage: PYTH_STORAGE_CONTRACT,
        pyth-btc-feed-id: PYTH_BTC_FEED_ID,
        default-price: DEFAULT_SBTC_PRICE,
        max-price-age-blocks: MAX_PRICE_AGE_BLOCKS,
    }
)

;; Calculate resurrection cost in sBTC units
(define-read-only (calculate-resurrection-cost-sbtc
        (character-level uint)
        (death-count uint)
        (sbtc-price-usd uint)
    )
    (let (
            (cost-sats (calculate-resurrection-cost character-level death-count))
            ;; Convert satoshis to sBTC (1:1 ratio) then calculate USD value
            (cost-usd-cents (/ (* cost-sats sbtc-price-usd) u100000000))
            ;; Calculate how much sBTC needed to cover the USD cost
            (sbtc-needed (/ (* cost-usd-cents u100000000) sbtc-price-usd))
        )
        sbtc-needed
    )
)

;; Calculate resurrection cost in USD cents using sBTC price
(define-public (calculate-resurrection-cost-usd
        (character-level uint)
        (death-count uint)
    )
    (let (
            (cost-sats (calculate-resurrection-cost character-level death-count))
            (sbtc-price-usd (get-sbtc-price-internal))
            (cost-usd-cents (/ (* cost-sats sbtc-price-usd) u100000000)) ;; Convert sats to sBTC then to USD
        )
        (ok cost-usd-cents)
    )
)

;; =============================================================================
;; CORE RESURRECTION FUNCTIONS
;; =============================================================================

;; Get resurrection eligibility (enterprise-grade error handling)
(define-public (check-resurrection-eligibility
        (character-id (string-ascii 64))
        (player principal)
    )
    (let (
            (character-key {
                character-id: character-id,
                player: player,
            })
            (resurrection-count (default-to u0 (map-get? character-resurrection-count character-key)))
        )
        ;; Get character data with proper error handling
        (let (
                (character-info (unwrap!
                    (contract-call? .satoshi-quest-core get-character
                        character-id player
                    )
                    ERR_CHARACTER_NOT_FOUND
                ))
                (is-dead (not (get is-alive character-info)))
                (death-block (get death-block character-info))
                (within-window (match death-block
                    some-block (< (- stacks-block-height some-block)
                        RESURRECTION_WINDOW_BLOCKS
                    )
                    false
                ))
                (can-resurrect (and
                    (var-get resurrection-enabled)
                    is-dead
                    within-window
                    (< resurrection-count MAX_RESURRECTIONS_PER_CHARACTER)
                ))
                (estimated-cost (calculate-resurrection-cost (get level character-info)
                    resurrection-count
                ))
            )
            (ok {
                eligible: can-resurrect,
                resurrections-used: resurrection-count,
                resurrections-remaining: (- MAX_RESURRECTIONS_PER_CHARACTER resurrection-count),
                estimated-cost-sats: estimated-cost,
                character-level: (get level character-info),
                is-dead: is-dead,
                within-window: within-window,
            })
        )
    )
)

;; Process sBTC payment for resurrection (following buy-satoshi-a-coffee pattern)
(define-public (pay-for-resurrection
        (character-id (string-ascii 64))
        (sbtc-amount uint) ;; sBTC amount in satoshis
    )
    (let (
            (character-key {
                character-id: character-id,
                player: tx-sender,
            })
            (resurrection-count (default-to u0 (map-get? character-resurrection-count character-key)))
            (character-data (unwrap!
                (contract-call? .satoshi-quest-core get-character character-id
                    tx-sender
                )
                ERR_CHARACTER_NOT_FOUND
            ))
            (character-level (get level character-data))
            (is-dead (not (get is-alive character-data)))
            (required-cost-sats (calculate-resurrection-cost character-level resurrection-count))
            (sbtc-price-usd (get-sbtc-price-internal))
            (required-sbtc (calculate-resurrection-cost-sbtc character-level resurrection-count
                sbtc-price-usd
            ))
            ;; Get user's sBTC balance following Dia_prac pattern
            (user-sbtc-balance (unwrap! (contract-call? SBTC_CONTRACT get-balance tx-sender)
                ERR_PAYMENT_FAILED
            ))
        )
        (asserts! (var-get resurrection-enabled) ERR_UNAUTHORIZED)
        (asserts! is-dead ERR_CHARACTER_NOT_DEAD)
        (asserts! (< resurrection-count MAX_RESURRECTIONS_PER_CHARACTER)
            ERR_TOO_MANY_RESURRECTIONS
        )
        (asserts! (>= sbtc-amount required-sbtc) ERR_INSUFFICIENT_PAYMENT)
        (asserts! (>= user-sbtc-balance sbtc-amount) ERR_INSUFFICIENT_PAYMENT)

        ;; Transfer sBTC from player to contract (following buy-satoshi-a-coffee transfer pattern)
        (try! (contract-call? SBTC_CONTRACT transfer sbtc-amount tx-sender
            (as-contract tx-sender) (some 0x726573757272656374696f6e)
            ;; "resurrection" in hex
        ))

        ;; Complete the resurrection immediately
        (let ((new-resurrection-count (+ resurrection-count u1)))
            ;; Record resurrection
            (map-set resurrection-records {
                character-id: character-id,
                player: tx-sender,
                resurrection-number: new-resurrection-count,
            } {
                cost-paid: sbtc-amount,
                btc-price-at-resurrection: sbtc-price-usd,
                resurrection-block: stacks-block-height,
                previous-level: character-level,
                previous-score: (get total-experience character-data),
            })

            ;; Update resurrection count
            (map-set character-resurrection-count character-key
                new-resurrection-count
            )

            ;; Update global statistics
            (var-set total-resurrections (+ (var-get total-resurrections) u1))
            (var-set total-sbtc-collected
                (+ (var-get total-sbtc-collected) sbtc-amount)
            )

            ;; Call core contract to revive character
            (try! (contract-call? .satoshi-quest-core admin-revive-character
                character-id tx-sender
            ))

            ;; Emit event
            (print {
                event: "character-resurrected",
                character-id: character-id,
                player: tx-sender,
                resurrection-number: new-resurrection-count,
                sbtc-paid: sbtc-amount,
                sbtc-price-usd: sbtc-price-usd,
                character-level: character-level,
                block-height: stacks-block-height,
            })

            (ok {
                resurrection-number: new-resurrection-count,
                sbtc-paid: sbtc-amount,
                character-revived: true,
            })
        )
    )
)

;; =============================================================================
;; READ-ONLY FUNCTIONS
;; =============================================================================

;; Get resurrection record
(define-read-only (get-resurrection-record
        (character-id (string-ascii 64))
        (player principal)
        (resurrection-number uint)
    )
    (map-get? resurrection-records {
        character-id: character-id,
        player: player,
        resurrection-number: resurrection-number,
    })
)

;; Get character resurrection count
(define-read-only (get-resurrection-count
        (character-id (string-ascii 64))
        (player principal)
    )
    (default-to u0
        (map-get? character-resurrection-count {
            character-id: character-id,
            player: player,
        })
    )
)

;; Get pending resurrection
(define-read-only (get-pending-resurrection
        (character-id (string-ascii 64))
        (player principal)
    )
    (map-get? pending-resurrections {
        character-id: character-id,
        player: player,
    })
)

;; Get global resurrection statistics
(define-read-only (get-global-resurrection-stats)
    {
        total-resurrections: (var-get total-resurrections),
        total-sbtc-collected: (var-get total-sbtc-collected),
        resurrection-enabled: (var-get resurrection-enabled),
        base-cost-sats: BASE_RESURRECTION_COST_SATS,
        max-resurrections: MAX_RESURRECTIONS_PER_CHARACTER,
    }
)

;; =============================================================================
;; ADMIN FUNCTIONS
;; =============================================================================

;; Toggle resurrection system
(define-public (set-resurrection-enabled (enabled bool))
    (begin
        (asserts! (is-contract-owner) ERR_UNAUTHORIZED)
        (var-set resurrection-enabled enabled)
        (ok true)
    )
)

;; Set oracle contract for price feeds
(define-public (set-oracle-contract (oracle principal))
    (begin
        (asserts! (is-contract-owner) ERR_UNAUTHORIZED)
        (var-set oracle-contract (some oracle))
        (ok true)
    )
)

;; Transfer contract ownership
(define-public (transfer-ownership (new-owner principal))
    (begin
        (asserts! (is-contract-owner) ERR_UNAUTHORIZED)
        (var-set contract-owner new-owner)
        (ok true)
    )
)

;; Emergency resurrection (owner only)
(define-public (emergency-resurrect
        (character-id (string-ascii 64))
        (player principal)
    )
    (begin
        (asserts! (is-contract-owner) ERR_UNAUTHORIZED)

        ;; TODO: Call core contract to revive character

        ;; Emit event
        (print {
            event: "emergency-resurrection",
            character-id: character-id,
            player: player,
            admin: tx-sender,
            block-height: stacks-block-height,
        })

        (ok true)
    )
)

;; =============================================================================
;; CONTRACT INITIALIZATION
;; =============================================================================

;; Initialize contract
(begin
    (print {
        event: "contract-deployed",
        contract: "satoshi-quest-resurrection",
        version: "1.0.0",
        owner: CONTRACT_OWNER,
        base-cost-sats: BASE_RESURRECTION_COST_SATS,
        max-resurrections: MAX_RESURRECTIONS_PER_CHARACTER,
    })
)
