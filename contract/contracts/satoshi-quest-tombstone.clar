;; =============================================================================
;; SATOSHI QUEST TOMBSTONE NFT CONTRACT (SIP-009)
;; =============================================================================
;;
;; Enterprise-grade NFT contract for character tombstones.
;; Each tombstone NFT represents a fallen character's legacy, preserving their
;; achievements, stats, and story for eternity on the blockchain.
;;
;; Features:
;; - SIP-009 compliant NFT implementation
;; - On-chain metadata with character legacy data
;; - Only game core contract can mint tombstones
;; - Immutable records of character achievements
;; - Comprehensive tombstone statistics and history
;; =============================================================================

;; TODO: Import NFT trait when deployed to testnet/mainnet
;; (impl-trait 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-trait.nft-trait)

;; =============================================================================
;; CONSTANTS
;; =============================================================================

(define-constant CONTRACT_OWNER tx-sender)
(define-constant SATOSHI_QUEST_CORE_CONTRACT .satoshi-quest-core)

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
    (is-eq contract-caller SATOSHI_QUEST_CORE_CONTRACT)
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

        ;; Mint the NFT
        (try! (nft-mint? satoshi-quest-tombstone token-id recipient))

        ;; Store metadata
        (map-set tombstone-metadata token-id
            (merge metadata {
                mint-block: stacks-block-height,
                owner-at-death: recipient,
            })
        )

        ;; Update character tombstones list
        (let ((existing-tombstones (default-to (list) (map-get? character-tombstones character-name))))
            (map-set character-tombstones character-name
                (unwrap-panic (as-max-len? (append existing-tombstones token-id) u10))
            )
        )

        ;; Update global statistics
        (var-set token-id-nonce token-id)
        (var-set total-tombstones-minted (+ (var-get total-tombstones-minted) u1))

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

;; =============================================================================
;; ADMIN FUNCTIONS
;; =============================================================================

;; Update token URI base (owner only)
(define-public (set-token-uri-base (new-base (string-utf8 256)))
    (begin
        (asserts! (is-contract-owner) ERR_UNAUTHORIZED)
        (var-set token-uri-base new-base)
        (ok true)
    )
)

;; Transfer contract ownership (owner only)
(define-public (transfer-ownership (new-owner principal))
    (begin
        (asserts! (is-contract-owner) ERR_UNAUTHORIZED)
        (var-set contract-owner new-owner)
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
        contract: "satoshi-quest-tombstone",
        version: "1.0.0",
        owner: CONTRACT_OWNER,
    })
)
