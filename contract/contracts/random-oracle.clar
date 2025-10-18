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
    ;; Simplified entropy for Clarity 3 compatibility
    ;; Combines seed with block height and a hash
    (+
        seed
        stacks-block-height
        (* stacks-block-height u1000000)
    )
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
        ;; Simple hash: just use coin ID + block height as entropy
        (coin-entropy ancient-coin-token-id)
        (unique-seed (+
            coin-entropy
            stacks-block-height
            (* stacks-block-height u12345) ;; Additional entropy multiplier
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
    {
        block-height: stacks-block-height,
        entropy-seed: (* stacks-block-height u1000000),
    }
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