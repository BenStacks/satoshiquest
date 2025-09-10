;; =============================================================================
;; TEST DIA ORACLE CONTRACT
;; =============================================================================
;;
;; A simple mock oracle contract for testing purposes.
;; Provides predictable price data for testing resurrection contract.
;; =============================================================================

;; Mock price data storage
(define-map price-feeds
    (string-ascii 64) ;; symbol (e.g., "sBTC/USD")
    {
        value: uint,
        timestamp: uint,
        round-id: uint
    }
)

;; Contract owner
(define-data-var contract-owner principal tx-sender)

;; Initialize with default sBTC price
(map-set price-feeds "sBTC/USD" {
    value: u5000000000, ;; $50,000 with 8 decimals (50000 * 10^8)
    timestamp: u1640995200, ;; Jan 1, 2022
    round-id: u1
})

;; Get price value (compatible with DIA Oracle interface)
(define-read-only (get-value (symbol (string-ascii 64)))
    (match (map-get? price-feeds symbol)
        price-data (ok price-data)
        (err u404) ;; Not found
    )
)

;; Set price (for testing purposes)
(define-public (set-price 
        (symbol (string-ascii 64))
        (value uint)
        (timestamp uint)
        (round-id uint)
    )
    (begin
        (asserts! (is-eq tx-sender (var-get contract-owner)) (err u403))
        (map-set price-feeds symbol {
            value: value,
            timestamp: timestamp,
            round-id: round-id
        })
        (ok true)
    )
)

;; Transfer ownership
(define-public (transfer-ownership (new-owner principal))
    (begin
        (asserts! (is-eq tx-sender (var-get contract-owner)) (err u403))
        (var-set contract-owner new-owner)
        (ok true)
    )
)

;; Get all supported symbols (for debugging)
(define-read-only (get-supported-symbols)
    (list "sBTC/USD")
)
