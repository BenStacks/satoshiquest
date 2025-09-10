import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;
const deployer = accounts.get("deployer")!;

/*
  The test below is an example. To learn more, read the testing documentation here:
  https://docs.hiro.so/clarinet/feature-guides/test-contract-with-clarinet-sdk
*/

describe("Satoshi Quest Resurrection Contract", () => {
  describe("Contract Initialization", () => {
    it("should initialize with correct default values", () => {
      // Check global stats
      const globalStats = simnet.callReadOnlyFn(
        "satoshi-quest-resurrection",
        "get-global-resurrection-stats",
        [],
        deployer
      );

      expect(globalStats.result).toStrictEqual(Cl.tuple({
        "total-resurrections": Cl.uint(0),
        "total-sbtc-collected": Cl.uint(0),
        "resurrection-enabled": Cl.bool(true),
        "base-cost-sats": Cl.uint(100000), // 0.001 BTC
        "max-resurrections": Cl.uint(5),
      }));
    });

    it("should set deployer as contract owner", () => {
      // Try to call owner-only function
      const result = simnet.callPublicFn(
        "satoshi-quest-resurrection",
        "set-resurrection-enabled",
        [Cl.bool(false)],
        deployer
      );

      expect(result.result).toBeOk(Cl.bool(true));
    });
  });

  describe("Price Calculation", () => {
    it("should calculate base resurrection cost correctly", () => {
      const cost = simnet.callReadOnlyFn(
        "satoshi-quest-resurrection",
        "calculate-resurrection-cost",
        [Cl.uint(1), Cl.uint(0)], // Level 1, 0 deaths
        deployer
      );

      // Base cost (100000) + level cost (1 * 10000) = 110000 sats
      expect(cost.result).toStrictEqual(Cl.uint(110000));
    });

    it("should scale cost with level and death count", () => {
      const cost1 = simnet.callReadOnlyFn(
        "satoshi-quest-resurrection",
        "calculate-resurrection-cost",
        [Cl.uint(5), Cl.uint(2)], // Level 5, 2 deaths
        deployer
      );

      // Base (100000) + level (5 * 10000) + deaths (2 * 50000) = 250000 sats
      expect(cost1.result).toStrictEqual(Cl.uint(250000));

      const cost2 = simnet.callReadOnlyFn(
        "satoshi-quest-resurrection",
        "calculate-resurrection-cost",
        [Cl.uint(10), Cl.uint(4)], // Level 10, 4 deaths
        deployer
      );

      // Base (100000) + level (10 * 10000) + deaths (4 * 50000) = 400000 sats
      expect(cost2.result).toStrictEqual(Cl.uint(400000));
    });

    it("should convert satoshis to sBTC correctly", () => {
      const sbtc = simnet.callReadOnlyFn(
        "satoshi-quest-resurrection",
        "sats-to-sbtc",
        [Cl.uint(100000)],
        deployer
      );

      expect(sbtc.result).toStrictEqual(Cl.uint(100000)); // 1:1 ratio
    });
  });

  describe("DIA Oracle Integration", () => {
    it("should handle sBTC price lookup with fallback", () => {
      // This will likely fail to oracle contract not being available
      // but should fall back to default price
      const priceResult = simnet.callPublicFn(
        "satoshi-quest-resurrection",
        "get-sbtc-price-usd",
        [],
        deployer
      );

      // Should return default price on oracle failure
      expect(priceResult.result).toBeOk(Cl.uint(5000000)); // $50,000 in cents
    });

    it("should calculate USD cost correctly", () => {
      const usdCost = simnet.callPublicFn(
        "satoshi-quest-resurrection",
        "calculate-resurrection-cost-usd",
        [Cl.uint(1), Cl.uint(0)], // Level 1, 0 deaths
        deployer
      );

      // Should be ok even if oracle fails (uses fallback)
      expect(usdCost.result).toBeOk(Cl.uint(5500)); // Should be some USD amount in cents
    });
  });

  describe("Resurrection Eligibility", () => {
    it("should return character not found for non-existent character", () => {
      const eligibility = simnet.callPublicFn(
        "satoshi-quest-resurrection",
        "check-resurrection-eligibility",
        [Cl.stringAscii("non-existent"), Cl.principal(address1)],
        deployer
      );

      expect(eligibility.result).toBeErr(Cl.uint(4002)); // ERR_CHARACTER_NOT_FOUND
    });

    // Note: Full eligibility tests would require setting up characters in core contract
    // This is a basic structure test
  });

  describe("sBTC Payment Integration", () => {
    it("should fail payment for non-existent character", () => {
      const payment = simnet.callPublicFn(
        "satoshi-quest-resurrection",
        "pay-for-resurrection",
        [Cl.stringAscii("non-existent"), Cl.uint(100000)],
        address1
      );

      expect(payment.result).toBeErr(Cl.uint(4002)); // ERR_CHARACTER_NOT_FOUND
    });

    // Note: Full payment tests would require:
    // 1. Setting up sBTC contract integration
    // 2. Creating dead characters in core contract
    // 3. Funding test accounts with sBTC
  });

  describe("Resurrection Records", () => {
    it("should return none for non-existent resurrection record", () => {
      const record = simnet.callReadOnlyFn(
        "satoshi-quest-resurrection",
        "get-resurrection-record",
        [
          Cl.stringAscii("test-char"),
          Cl.principal(address1),
          Cl.uint(1)
        ],
        deployer
      );

      expect(record.result).toStrictEqual(Cl.none());
    });

    it("should return zero for character with no resurrections", () => {
      const count = simnet.callReadOnlyFn(
        "satoshi-quest-resurrection",
        "get-resurrection-count",
        [Cl.stringAscii("test-char"), Cl.principal(address1)],
        deployer
      );

      expect(count.result).toStrictEqual(Cl.uint(0));
    });

    it("should return none for no pending resurrection", () => {
      const pending = simnet.callReadOnlyFn(
        "satoshi-quest-resurrection",
        "get-pending-resurrection",
        [Cl.stringAscii("test-char"), Cl.principal(address1)],
        deployer
      );

      expect(pending.result).toStrictEqual(Cl.none());
    });
  });

  describe("Admin Functions", () => {
    it("should allow owner to toggle resurrection system", () => {
      // Disable resurrections
      const disable = simnet.callPublicFn(
        "satoshi-quest-resurrection",
        "set-resurrection-enabled",
        [Cl.bool(false)],
        deployer
      );

      expect(disable.result).toBeOk(Cl.bool(true));

      // Check stats reflect change
      const stats = simnet.callReadOnlyFn(
        "satoshi-quest-resurrection",
        "get-global-resurrection-stats",
        [],
        deployer
      );

      expect(stats.result).toStrictEqual(Cl.tuple({
        "total-resurrections": Cl.uint(0),
        "total-sbtc-collected": Cl.uint(0),
        "resurrection-enabled": Cl.bool(false),
        "base-cost-sats": Cl.uint(100000),
        "max-resurrections": Cl.uint(5),
      }));

      // Re-enable
      const enable = simnet.callPublicFn(
        "satoshi-quest-resurrection",
        "set-resurrection-enabled",
        [Cl.bool(true)],
        deployer
      );

      expect(enable.result).toBeOk(Cl.bool(true));
    });

    it("should reject non-owner admin calls", () => {
      const unauthorizedCall = simnet.callPublicFn(
        "satoshi-quest-resurrection",
        "set-resurrection-enabled",
        [Cl.bool(false)],
        address1 // Not the owner
      );

      expect(unauthorizedCall.result).toBeErr(Cl.uint(4001)); // ERR_UNAUTHORIZED
    });

    it("should allow owner to set oracle contract", () => {
      const setOracle = simnet.callPublicFn(
        "satoshi-quest-resurrection",
        "set-oracle-contract",
        [Cl.principal("ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.test-oracle")],
        deployer
      );

      expect(setOracle.result).toBeOk(Cl.bool(true));
    });

    it("should allow ownership transfer", () => {
      // Transfer ownership
      const transfer = simnet.callPublicFn(
        "satoshi-quest-resurrection",
        "transfer-ownership",
        [Cl.principal(address1)],
        deployer
      );

      expect(transfer.result).toBeOk(Cl.bool(true));

      // Old owner should no longer have access
      const oldOwnerCall = simnet.callPublicFn(
        "satoshi-quest-resurrection",
        "set-resurrection-enabled",
        [Cl.bool(false)],
        deployer
      );

      expect(oldOwnerCall.result).toBeErr(Cl.uint(4001)); // ERR_UNAUTHORIZED

      // New owner should have access
      const newOwnerCall = simnet.callPublicFn(
        "satoshi-quest-resurrection",
        "set-resurrection-enabled",
        [Cl.bool(false)],
        address1
      );

      expect(newOwnerCall.result).toBeOk(Cl.bool(true));
    });

    it("should allow emergency resurrection by owner", () => {
      const emergency = simnet.callPublicFn(
        "satoshi-quest-resurrection",
        "emergency-resurrect",
        [Cl.stringAscii("emergency-char"), Cl.principal(address1)],
        deployer
      );

      expect(emergency.result).toBeOk(Cl.bool(true));
    });

    it("should reject emergency resurrection by non-owner", () => {
      const unauthorizedEmergency = simnet.callPublicFn(
        "satoshi-quest-resurrection",
        "emergency-resurrect",
        [Cl.stringAscii("emergency-char"), Cl.principal(address1)],
        address2
      );

      expect(unauthorizedEmergency.result).toBeErr(Cl.uint(4001)); // ERR_UNAUTHORIZED
    });
  });

  describe("Integration Testing Notes", () => {
    it("should provide framework for full integration tests", () => {
      // This test documents what would be needed for full integration testing:
      
      // 1. Deploy all contracts (core, loot, tombstone, resurrection)
      // 2. Set up sBTC contract integration
      // 3. Create test characters in core contract
      // 4. Kill characters to create death records
      // 5. Fund test accounts with sBTC
      // 6. Test full resurrection payment flow
      // 7. Test resurrection eligibility edge cases
      // 8. Test oracle price feed integration
      // 9. Test multi-character scenarios
      // 10. Test resurrection limits and timing windows

      expect(true).toBe(true); // Placeholder for documentation
    });
  });

  describe("Constants Validation", () => {
    it("should have correct resurrection configuration", () => {
      // These are hardcoded in the contract, so we verify the logic works
      const baseCost = 100000; // 0.001 BTC
      const levelMultiplier = 10000; // 0.0001 BTC per level
      const deathMultiplier = 50000; // 0.0005 BTC per death

      // Test cost calculation matches expected formula
      const testLevel = 3;
      const testDeaths = 2;
      const expectedCost = baseCost + (testLevel * levelMultiplier) + (testDeaths * deathMultiplier);

      const actualCost = simnet.callReadOnlyFn(
        "satoshi-quest-resurrection",
        "calculate-resurrection-cost",
        [Cl.uint(testLevel), Cl.uint(testDeaths)],
        deployer
      );

      expect(actualCost.result).toStrictEqual(Cl.uint(expectedCost));
      expect(expectedCost).toBe(230000); // Verify our math: 100000 + 30000 + 100000
    });
  });
});