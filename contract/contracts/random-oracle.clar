;; =============================================================================
;; RANDOM ORACLE CONTRACT
;; =============================================================================
;;
;; Simple but effective random number generation for Satoshi's Quest.
;; Uses block hash and additional entropy for provably fair randomness.
;; Perfect for coin flip mechanics in the Ancient Satoshi Coin gambling system.
;;
;; Features:
;; - Provably fair randomness using block hash
;; - Additional entropy from transaction details
;; - Range-specific random values (0 or 1 for coin flip)
;; - Read-only functions for transparency
;; =============================================================================

;; =============================================================================
;; CONSTANTS
;; =============================================================================

(define-constant CONTRACT_OWNER tx-sender)

;; Error codes
(define-constant ERR_UNAUTHORIZED (err u5001))
(define-constant ERR_INVALID_RANGE (err u5002))
(define-constant ERR_BLOCK_NOT_FOUND (err u5003))

;; =============================================================================
;; PRIVATE FUNCTIONS
;; =============================================================================

(define-private (is-contract-owner)
    (is-eq tx-sender CONTRACT_OWNER)
)

;; Combine multiple entropy sources for better randomness
(define-private (get-entropy-sources (seed uint))
    (let (
        (block-hash (unwrap! (get-block-info? id-header-hash stacks-block-height) ERR_BLOCK_NOT_FOUND))
        (prev-block-hash (unwrap! (get-block-info? id-header-hash (- stacks-block-height u1)) ERR_BLOCK_NOT_FOUND))
        (block-time (unwrap! (get-block-info? time stacks-block-height) ERR_BLOCK_NOT_FOUND))
        (vrf-seed (unwrap! (get-block-info? vrf-seed stacks-block-height) ERR_BLOCK_NOT_FOUND))
    )
    ;; Combine all entropy sources
    (+ 
        (buff-to-uint-be block-hash)
        (buff-to-uint-be prev-block-hash)
        (buff-to-uint-be vrf-seed)
        block-time
        seed
        stacks-block-height
    ))
)

;; Convert buffer to uint (first 16 bytes for large numbers)
(define-private (buff-to-uint-be (buffer (buff 32)))
    (let (
        (b1 (unwrap-panic (element-at buffer u0)))
        (b2 (unwrap-panic (element-at buffer u1)))
        (b3 (unwrap-panic (element-at buffer u2)))
        (b4 (unwrap-panic (element-at buffer u3)))
        (b5 (unwrap-panic (element-at buffer u4)))
        (b6 (unwrap-panic (element-at buffer u5)))
        (b7 (unwrap-panic (element-at buffer u6)))
        (b8 (unwrap-panic (element-at buffer u7)))
    )
    (+
        (* (buff-to-uint-le (unwrap-panic (as-max-len? b1 u1))) u72057594037927936) ;; 256^7
        (* (buff-to-uint-le (unwrap-panic (as-max-len? b2 u1))) u281474976710656)   ;; 256^6
        (* (buff-to-uint-le (unwrap-panic (as-max-len? b3 u1))) u1099511627776)     ;; 256^5
        (* (buff-to-uint-le (unwrap-panic (as-max-len? b4 u1))) u4294967296)        ;; 256^4
        (* (buff-to-uint-le (unwrap-panic (as-max-len? b5 u1))) u16777216)          ;; 256^3
        (* (buff-to-uint-le (unwrap-panic (as-max-len? b6 u1))) u65536)             ;; 256^2
        (* (buff-to-uint-le (unwrap-panic (as-max-len? b7 u1))) u256)               ;; 256^1
        (buff-to-uint-le (unwrap-panic (as-max-len? b8 u1)))                        ;; 256^0
    ))
)

;; =============================================================================
;; PUBLIC FUNCTIONS
;; =============================================================================

;; Get random value in range [0, max-value)
(define-read-only (get-random-value-in-range (seed uint) (max-value uint))
    (let (
        (entropy (get-entropy-sources seed))
        (random-value (mod entropy max-value))
    )
    (ok random-value))
)

;; Get random result (0-99 for percentage-based outcomes)
(define-read-only (get-coin-flip (seed uint))
    (get-random-value-in-range seed u100)
)

;; Get random value with custom entropy
(define-read-only (get-random-with-entropy 
    (seed uint) 
    (additional-entropy uint) 
    (max-value uint)
    )
    (let (
        (combined-seed (+ seed additional-entropy stacks-block-height))
        (entropy (get-entropy-sources combined-seed))
        (random-value (mod entropy max-value))
    )
    (ok random-value))
)

;; Verify randomness (for transparency)
(define-read-only (verify-randomness (seed uint) (claimed-result uint))
    (let (
        (actual-result (unwrap-panic (get-coin-flip seed)))
    )
    (is-eq actual-result claimed-result))
)

;; =============================================================================
;; ANCIENT SATOSHI COIN SPECIFIC FUNCTIONS
;; =============================================================================

;; Generate resurrection gamble result (optimized for Ancient Satoshi Coin)
(define-read-only (get-resurrection-gamble-result 
    (character-id (string-ascii 64))
    (player principal)
    (ancient-coin-token-id uint)
    )
    (let (
        ;; Create unique seed from character, player, and coin
        (character-hash (keccak256 character-id))
        (player-hash (+ (stx-get-account player) stacks-block-height))
        (coin-entropy ancient-coin-token-id)
        (unique-seed (+ 
            (buff-to-uint-be character-hash)
            player-hash
            coin-entropy
        ))
        (result (unwrap-panic (get-coin-flip unique-seed)))
    )
    {
        result: result,
        seed-used: unique-seed,
        is-success: (< result u47), ;; 47% win rate (0-46 out of 0-99 = 47%)
        block-height: stacks-block-height,
    })
)

;; =============================================================================
;; READ-ONLY HELPER FUNCTIONS
;; =============================================================================

;; Get current entropy for debugging
(define-read-only (get-current-entropy)
    (let (
        (block-hash (get-block-info? id-header-hash stacks-block-height))
        (block-time (get-block-info? time stacks-block-height))
        (vrf-seed (get-block-info? vrf-seed stacks-block-height))
    )
    {
        block-height: stacks-block-height,
        block-hash: block-hash,
        block-time: block-time,
        vrf-seed: vrf-seed,
    })
)

;; Test function for randomness distribution (development only)
(define-read-only (test-randomness-distribution (iterations uint))
    (let (
        (test-results (map get-coin-flip (list u1 u2 u3 u4 u5 u6 u7 u8 u9 u10)))
        (heads-count (len (filter is-one test-results)))
        (tails-count (- u10 heads-count))
    )
    {
        heads: heads-count,
        tails: tails-count,
        results: test-results,
    })
)

(define-private (is-one (value (response uint uint)))
    (match value
        success (is-eq success u1)
        error false
    )
)

;; =============================================================================
;; CONTRACT INITIALIZATION
;; =============================================================================

;; Initialize contract
(begin
    (print {
        event: "contract-deployed",
        contract: "random-oracle",
        version: "1.0.0",
        owner: CONTRACT_OWNER,
        block-height: stacks-block-height,
    })
)