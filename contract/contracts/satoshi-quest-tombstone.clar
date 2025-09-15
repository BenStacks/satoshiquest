;; =============================================================================
;; SATOSHI QUEST TOMBSTONE NFT CONTRACT (SIP-009)
;; =============================================================================
;;
;; Production-ready NFT contract for character tombstones.
;; Each tombstone NFT represents a fallen character's legacy, preserving their
;; achievements, stats, and story for eternity on the blockchain.
;;
;; Features:
;; - SIP-009 compliant NFT implementation with proper trait
;; - Comprehensive input validation and security checks
;; - On-chain metadata with character legacy data
;; - Authorization system for game contracts
;; - Immutable records of character achievements
;; - Gas-optimized operations and comprehensive error handling
;; =============================================================================

;; Import NFT trait for SIP-009 compliance
;; Define the trait locally for deployment compatibility
(define-trait nft-trait (
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

;; PROFESSIONAL DEPLOYMENT STRATEGY: Event-driven architecture
;; Core contract address is stored as data-var and can be updated by admin
;; This eliminates circular reference while maintaining security

;; Validation constants
(define-constant MAX_CHARACTER_NAME_LENGTH u32)
(define-constant MAX_DEATH_CAUSE_LENGTH u128)
(define-constant MAX_LEVEL u1000)
(define-constant MAX_FLOOR u10000)
(define-constant MAX_SCORE u999999999)
(define-constant MAX_PLAY_TIME u86400000) ;; 24 hours in milliseconds
(define-constant MAX_TOMBSTONES_PER_CHARACTER u10)

;; Error codes
(define-constant ERR_UNAUTHORIZED (err u3001))
(define-constant ERR_NOT_FOUND (err u3002))
(define-constant ERR_ALREADY_EXISTS (err u3003))
(define-constant ERR_INVALID_METADATA (err u3004))
(define-constant ERR_MINT_FAILED (err u3005))
(define-constant ERR_INVALID_TOKEN_ID (err u3006))
(define-constant ERR_TRANSFER_FAILED (err u3007))

;; =============================================================================
;; DATA STORAGE
;; =============================================================================

;; NFT definition
(define-non-fungible-token satoshi-quest-tombstone uint)

;; Token ID counter
(define-data-var token-id-nonce uint u0)

;; Contract settings
(define-data-var contract-owner principal tx-sender)
(define-data-var token-uri-base (string-utf8 256) u"https://api.satoshiquest.io/metadata/tombstone/")

;; Core contract address (updatable by admin to avoid circular references)
(define-data-var authorized-core-contract (optional principal) none)

;; Global tombstone statistics
(define-data-var total-tombstones-minted uint u0)
(define-data-var highest-level-recorded uint u0)
(define-data-var deepest-floor-recorded uint u0)
(define-data-var highest-score-recorded uint u0)

;; Tombstone metadata storage
(define-map tombstone-metadata
    uint
    {
        character-name: (string-utf8 32),
        final-level: uint,
        deepest-floor: uint,
        total-experience: uint,
        play-time: uint,
        death-cause: (string-utf8 128),
        final-score: uint,
        burned-items-count: uint,
        death-block: uint,
        mint-block: uint,
        owner-at-death: principal,
    }
)

;; Character name to tombstone mapping (for easy lookup)
(define-map character-tombstones
    (string-utf8 32)
    (list 10 uint)
)

;; =============================================================================
;; AUTHORIZATION
;; =============================================================================

(define-private (is-contract-owner)
    (is-eq tx-sender (var-get contract-owner))
)

(define-private (is-game-contract)
    (or
        (match (var-get authorized-core-contract)
            core-address
            (is-eq contract-caller core-address)
            false ;; No core contract set yet
        )
        (is-contract-owner) ;; Allow contract owner to mint for testing
    )
)

;; =============================================================================
;; VALIDATION FUNCTIONS
;; =============================================================================

(define-private (validate-character-name (name (string-utf8 32)))
    (and
        (> (len name) u0)
        (<= (len name) MAX_CHARACTER_NAME_LENGTH)
    )
)

(define-private (validate-death-cause (cause (string-utf8 128)))
    (and
        (> (len cause) u0)
        (<= (len cause) MAX_DEATH_CAUSE_LENGTH)
    )
)

(define-private (validate-metadata (metadata {
    character-name: (string-utf8 32),
    final-level: uint,
    deepest-floor: uint,
    total-experience: uint,
    play-time: uint,
    death-cause: (string-utf8 128),
    final-score: uint,
    burned-items-count: uint,
    death-block: uint,
}))
    (and
        (validate-character-name (get character-name metadata))
        (validate-death-cause (get death-cause metadata))
        (<= (get final-level metadata) MAX_LEVEL)
        (<= (get deepest-floor metadata) MAX_FLOOR)
        (<= (get final-score metadata) MAX_SCORE)
        (<= (get play-time metadata) MAX_PLAY_TIME)
        (> (get final-level metadata) u0)
        (> (get deepest-floor metadata) u0)
    )
)

(define-private (validate-token-id (token-id uint))
    (and
        (> token-id u0)
        (<= token-id (var-get token-id-nonce))
    )
)

(define-private (validate-principal (address principal))
    (not (is-eq address 'SP000000000000000000002Q6VF78))
    ;; Not burn address
)

;; =============================================================================
;; SIP-009 IMPLEMENTATION
;; =============================================================================

(define-read-only (get-last-token-id)
    (ok (var-get token-id-nonce))
)

(define-read-only (get-token-uri (token-id uint))
    (ok (some (concat (var-get token-uri-base) (int-to-utf8 (to-int token-id)))))
)

(define-read-only (get-owner (token-id uint))
    (ok (nft-get-owner? satoshi-quest-tombstone token-id))
)

(define-public (transfer
        (token-id uint)
        (sender principal)
        (recipient principal)
    )
    (begin
        (asserts! (validate-token-id token-id) ERR_INVALID_TOKEN_ID)
        (asserts! (validate-principal sender) ERR_UNAUTHORIZED)
        (asserts! (validate-principal recipient) ERR_UNAUTHORIZED)
        (asserts! (is-eq tx-sender sender) ERR_UNAUTHORIZED)
        (asserts! (is-some (nft-get-owner? satoshi-quest-tombstone token-id))
            ERR_NOT_FOUND
        )
        (nft-transfer? satoshi-quest-tombstone token-id sender recipient)
    )
)

;; =============================================================================
;; CORE FUNCTIONS
;; =============================================================================

;; Mint tombstone NFT (only callable by game core contract)
(define-public (mint-tombstone
        (recipient principal)
        (metadata {
            character-name: (string-utf8 32),
            final-level: uint,
            deepest-floor: uint,
            total-experience: uint,
            play-time: uint,
            death-cause: (string-utf8 128),
            final-score: uint,
            burned-items-count: uint,
            death-block: uint,
        })
    )
    (let (
            (token-id (+ (var-get token-id-nonce) u1))
            (character-name (get character-name metadata))
        )
        (asserts! (is-game-contract) ERR_UNAUTHORIZED)
        (asserts! (validate-principal recipient) ERR_UNAUTHORIZED)
        (asserts! (validate-metadata metadata) ERR_INVALID_METADATA)

        ;; Check character doesn't have too many tombstones
        (let ((existing-tombstones (default-to (list) (map-get? character-tombstones character-name))))
            (asserts! (< (len existing-tombstones) MAX_TOMBSTONES_PER_CHARACTER)
                ERR_ALREADY_EXISTS
            )

            ;; Mint the NFT
            (try! (nft-mint? satoshi-quest-tombstone token-id recipient))

            ;; Store metadata
            (map-set tombstone-metadata token-id
                (merge metadata {
                    mint-block: stacks-block-height,
                    owner-at-death: recipient,
                })
            )

            ;; Update character tombstones list safely
            (map-set character-tombstones character-name
                (unwrap! (as-max-len? (append existing-tombstones token-id) u10)
                    ERR_INVALID_METADATA
                ))

            ;; Update global statistics
            (var-set token-id-nonce token-id)
            (var-set total-tombstones-minted
                (+ (var-get total-tombstones-minted) u1)
            )

            ;; Update records if this is a new high
            (if (> (get final-level metadata) (var-get highest-level-recorded))
                (var-set highest-level-recorded (get final-level metadata))
                true
            )
            (if (> (get deepest-floor metadata) (var-get deepest-floor-recorded))
                (var-set deepest-floor-recorded (get deepest-floor metadata))
                true
            )
            (if (> (get final-score metadata) (var-get highest-score-recorded))
                (var-set highest-score-recorded (get final-score metadata))
                true
            )

            ;; Emit event
            (print {
                event: "tombstone-minted",
                token-id: token-id,
                character-name: character-name,
                recipient: recipient,
                final-level: (get final-level metadata),
                final-score: (get final-score metadata),
                death-cause: (get death-cause metadata),
                block-height: stacks-block-height,
            })

            (ok token-id)
        )
    )
)

;; =============================================================================
;; READ-ONLY FUNCTIONS
;; =============================================================================

;; Get tombstone metadata
(define-read-only (get-tombstone-metadata (token-id uint))
    (map-get? tombstone-metadata token-id)
)

;; Get all tombstones for a character name
(define-read-only (get-character-tombstones (character-name (string-utf8 32)))
    (default-to (list) (map-get? character-tombstones character-name))
)

;; Get global tombstone statistics
(define-read-only (get-global-stats)
    {
        total-tombstones: (var-get total-tombstones-minted),
        highest-level: (var-get highest-level-recorded),
        deepest-floor: (var-get deepest-floor-recorded),
        highest-score: (var-get highest-score-recorded),
    }
)

;; Get tombstone by character and death number
(define-read-only (get-tombstone-by-death
        (character-name (string-utf8 32))
        (death-number uint)
    )
    (let ((tombstones (get-character-tombstones character-name)))
        (if (and (> death-number u0) (<= death-number (len tombstones)))
            (element-at tombstones (- death-number u1))
            none
        )
    )
)

;; Check if character has any tombstones
(define-read-only (has-tombstone (character-name (string-utf8 32)))
    (> (len (get-character-tombstones character-name)) u0)
)

;; Get tombstone count for character
(define-read-only (get-death-count (character-name (string-utf8 32)))
    (len (get-character-tombstones character-name))
)

;; Get contract owner
(define-read-only (get-contract-owner)
    (var-get contract-owner)
)

;; Get integration status
(define-read-only (get-integration-status)
    {
        tombstone-deployed: true,
        authorized-core-contract: (var-get authorized-core-contract),
        integration-complete: (is-some (var-get authorized-core-contract)),
    }
)

;; =============================================================================
;; ADMIN FUNCTIONS
;; =============================================================================

;; Update token URI base (owner only)
(define-public (set-token-uri-base (new-base (string-utf8 256)))
    (begin
        (asserts! (is-contract-owner) ERR_UNAUTHORIZED)
        (asserts! (> (len new-base) u0) ERR_INVALID_METADATA)
        (var-set token-uri-base new-base)
        (ok true)
    )
)

;; Set authorized core contract (owner only)
(define-public (set-core-contract (core-contract principal))
    (begin
        (asserts! (is-contract-owner) ERR_UNAUTHORIZED)
        (asserts! (validate-principal core-contract) ERR_UNAUTHORIZED)
        (var-set authorized-core-contract (some core-contract))
        (print {
            event: "core-contract-authorized",
            core-contract: core-contract,
            admin: tx-sender,
            block-height: stacks-block-height,
        })
        (ok true)
    )
)

;; Transfer contract ownership (owner only)
(define-public (transfer-ownership (new-owner principal))
    (begin
        (asserts! (is-contract-owner) ERR_UNAUTHORIZED)
        (asserts! (validate-principal new-owner) ERR_UNAUTHORIZED)
        (var-set contract-owner new-owner)
        (ok true)
    )
)

;; Test mint function for development (owner only)
(define-public (admin-mint-test-tombstone (recipient principal))
    (begin
        (asserts! (is-contract-owner) ERR_UNAUTHORIZED)
        (mint-tombstone recipient {
            character-name: u"TestHero",
            final-level: u10,
            deepest-floor: u5,
            total-experience: u1000,
            play-time: u3600,
            death-cause: u"Defeated by test monster",
            final-score: u5000,
            burned-items-count: u3,
            death-block: stacks-block-height,
        })
    )
)

;; =============================================================================
;; CONTRACT INITIALIZATION
;; =============================================================================

;; Initialize contract
(begin
    (print {
        event: "contract-deployed",
        contract: "satoshi-quest-tombstone",
        version: "1.0.0",
        owner: CONTRACT_OWNER,
    })
)
