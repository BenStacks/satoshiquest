
import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;
const deployer = accounts.get("deployer")!;

const contractName = "satoshi-quest-tombstone";

describe("Satoshi Quest Tombstone Contract Tests", () => {
  beforeEach(() => {
    // Reset state for each test
  });

  describe("Contract Deployment", () => {
    it("should deploy successfully", () => {
      expect(simnet.blockHeight).toBeDefined();
    });

    it("should initialize with correct owner", () => {
      const result = simnet.callReadOnlyFn(
        "satoshi-quest-tombstone",
        "get-contract-owner",
        [],
        address1
      );
      expect(result.result).toStrictEqual(Cl.principal(deployer));
    });

    it("should start with zero tombstones", () => {
      const { result } = simnet.callReadOnlyFn(
        contractName,
        "get-global-stats",
        [],
        address1
      );
      expect(result).toStrictEqual(
        Cl.tuple({
          "total-tombstones": Cl.uint(0),
          "highest-level": Cl.uint(0),
          "deepest-floor": Cl.uint(0),
          "highest-score": Cl.uint(0),
        })
      );
    });
  });

  describe("Tombstone Minting", () => {
    const validMetadata = {
      "character-name": Cl.stringUtf8("TestHero"),
      "final-level": Cl.uint(10),
      "deepest-floor": Cl.uint(5),
      "total-experience": Cl.uint(1000),
      "play-time": Cl.uint(3600),
      "death-cause": Cl.stringUtf8("Defeated by test monster"),
      "final-score": Cl.uint(5000),
      "burned-items-count": Cl.uint(3),
      "death-block": Cl.uint(100),
    };

    it("should allow admin to mint test tombstone", () => {
      const { result } = simnet.callPublicFn(
        contractName,
        "admin-mint-test-tombstone",
        [Cl.principal(address1)],
        deployer
      );
      expect(result).toBeOk(Cl.uint(1));
    });

    it("should reject minting from non-authorized address", () => {
      const { result } = simnet.callPublicFn(
        contractName,
        "mint-tombstone",
        [Cl.principal(address1), Cl.tuple(validMetadata)],
        address1
      );
      expect(result).toBeErr(Cl.uint(3001)); // ERR_UNAUTHORIZED
    });

    it("should allow admin to mint with valid metadata", () => {
      const { result } = simnet.callPublicFn(
        contractName,
        "mint-tombstone",
        [Cl.principal(address1), Cl.tuple(validMetadata)],
        deployer
      );
      expect(result).toBeOk(Cl.uint(1));
    });

    it("should reject invalid metadata - empty character name", () => {
      const invalidMetadata = {
        ...validMetadata,
        "character-name": Cl.stringUtf8(""),
      };
      const { result } = simnet.callPublicFn(
        contractName,
        "mint-tombstone",
        [Cl.principal(address1), Cl.tuple(invalidMetadata)],
        deployer
      );
      expect(result).toBeErr(Cl.uint(3004)); // ERR_INVALID_METADATA
    });

    it("should reject invalid metadata - level too high", () => {
      const invalidMetadata = {
        ...validMetadata,
        "final-level": Cl.uint(1001), // MAX_LEVEL is 1000
      };
      const { result } = simnet.callPublicFn(
        contractName,
        "mint-tombstone",
        [Cl.principal(address1), Cl.tuple(invalidMetadata)],
        deployer
      );
      expect(result).toBeErr(Cl.uint(3004)); // ERR_INVALID_METADATA
    });

    it("should reject invalid metadata - zero level", () => {
      const invalidMetadata = {
        ...validMetadata,
        "final-level": Cl.uint(0),
      };
      const { result } = simnet.callPublicFn(
        contractName,
        "mint-tombstone",
        [Cl.principal(address1), Cl.tuple(invalidMetadata)],
        deployer
      );
      expect(result).toBeErr(Cl.uint(3004)); // ERR_INVALID_METADATA
    });

    it("should update global statistics after minting", () => {
      simnet.callPublicFn(
        contractName,
        "mint-tombstone",
        [Cl.principal(address1), Cl.tuple(validMetadata)],
        deployer
      );

      const { result } = simnet.callReadOnlyFn(
        contractName,
        "get-global-stats",
        [],
        address1
      );
      expect(result).toStrictEqual(
        Cl.tuple({
          "total-tombstones": Cl.uint(1),
          "highest-level": Cl.uint(10),
          "deepest-floor": Cl.uint(5),
          "highest-score": Cl.uint(5000),
        })
      );
    });
  });

  describe("NFT Operations", () => {
    beforeEach(() => {
      // Mint a tombstone for testing
      simnet.callPublicFn(
        contractName,
        "admin-mint-test-tombstone",
        [Cl.principal(address1)],
        deployer
      );
    });

    it("should return correct owner", () => {
      const { result } = simnet.callReadOnlyFn(
        contractName,
        "get-owner",
        [Cl.uint(1)],
        address1
      );
      expect(result).toBeOk(Cl.some(Cl.principal(address1)));
    });

    it("should allow owner to transfer tombstone", () => {
      const { result } = simnet.callPublicFn(
        contractName,
        "transfer",
        [Cl.uint(1), Cl.principal(address1), Cl.principal(address2)],
        address1
      );
      expect(result).toBeOk(Cl.bool(true));

      // Verify new owner
      const { result: ownerResult } = simnet.callReadOnlyFn(
        contractName,
        "get-owner",
        [Cl.uint(1)],
        address1
      );
      expect(ownerResult).toBeOk(Cl.some(Cl.principal(address2)));
    });

    it("should reject transfer from non-owner", () => {
      const { result } = simnet.callPublicFn(
        contractName,
        "transfer",
        [Cl.uint(1), Cl.principal(address1), Cl.principal(address2)],
        address2 // Wrong sender
      );
      expect(result).toBeErr(Cl.uint(3001)); // ERR_UNAUTHORIZED
    });

    it("should reject transfer of non-existent token", () => {
      const { result } = simnet.callPublicFn(
        contractName,
        "transfer",
        [Cl.uint(999), Cl.principal(address1), Cl.principal(address2)],
        address1
      );
      expect(result).toBeErr(Cl.uint(3006)); // ERR_INVALID_TOKEN_ID
    });
  });

  describe("Metadata and Queries", () => {
    beforeEach(() => {
      // Mint tombstones with different names
      const metadata1 = {
        "character-name": Cl.stringUtf8("Hero1"),
        "final-level": Cl.uint(15),
        "deepest-floor": Cl.uint(8),
        "total-experience": Cl.uint(2000),
        "play-time": Cl.uint(7200),
        "death-cause": Cl.stringUtf8("Dragon attack"),
        "final-score": Cl.uint(8000),
        "burned-items-count": Cl.uint(5),
        "death-block": Cl.uint(150),
      };

      const metadata2 = {
        "character-name": Cl.stringUtf8("Hero1"), // Same character, different death
        "final-level": Cl.uint(20),
        "deepest-floor": Cl.uint(12),
        "total-experience": Cl.uint(5000),
        "play-time": Cl.uint(10800),
        "death-cause": Cl.stringUtf8("Fell into lava"),
        "final-score": Cl.uint(12000),
        "burned-items-count": Cl.uint(7),
        "death-block": Cl.uint(200),
      };

      simnet.callPublicFn(
        contractName,
        "mint-tombstone",
        [Cl.principal(address1), Cl.tuple(metadata1)],
        deployer
      );

      simnet.callPublicFn(
        contractName,
        "mint-tombstone",
        [Cl.principal(address1), Cl.tuple(metadata2)],
        deployer
      );
    });

    it("should return correct tombstone metadata", () => {
      const { result } = simnet.callReadOnlyFn(
        contractName,
        "get-tombstone-metadata",
        [Cl.uint(1)],
        address1
      );
      
      const expectedMetadata = {
        "character-name": Cl.stringUtf8("Hero1"),
        "final-level": Cl.uint(15),
        "final-score": Cl.uint(8000),
        "deepest-floor": Cl.uint(8),
        "death-block": Cl.uint(150),
        "death-cause": Cl.stringUtf8("Dragon attack"),
        "total-experience": Cl.uint(2000),
        "play-time": Cl.uint(7200),
        "burned-items-count": Cl.uint(5),
        "mint-block": Cl.uint(6),
        "owner-at-death": Cl.principal(address1),
      };
      
      expect(result).toStrictEqual(Cl.some(Cl.tuple(expectedMetadata)));
    });

    it("should track character tombstones correctly", () => {
      const { result } = simnet.callReadOnlyFn(
        contractName,
        "get-character-tombstones",
        [Cl.stringUtf8("Hero1")],
        address1
      );
      expect(result).toStrictEqual(Cl.list([Cl.uint(1), Cl.uint(2)]));
    });

    it("should return correct death count", () => {
      const { result } = simnet.callReadOnlyFn(
        contractName,
        "get-death-count",
        [Cl.stringUtf8("Hero1")],
        address1
      );
      expect(result).toBeUint(2);
    });

    it("should detect if character has tombstone", () => {
      const { result } = simnet.callReadOnlyFn(
        contractName,
        "has-tombstone",
        [Cl.stringUtf8("Hero1")],
        address1
      );
      expect(result).toBeBool(true);

      const { result: noTombstoneResult } = simnet.callReadOnlyFn(
        contractName,
        "has-tombstone",
        [Cl.stringUtf8("NonExistentHero")],
        address1
      );
      expect(noTombstoneResult).toBeBool(false);
    });

    it("should update highest records correctly", () => {
      const { result } = simnet.callReadOnlyFn(
        contractName,
        "get-global-stats",
        [],
        address1
      );
      expect(result).toStrictEqual(Cl.tuple({
        "highest-level": Cl.uint(20),
        "deepest-floor": Cl.uint(12),
        "highest-score": Cl.uint(12000),
        "total-tombstones": Cl.uint(2),
      }));
    });
  });

  describe("Admin Functions", () => {
    it("should allow admin to set token URI base", () => {
      const newUri = "https://new-api.satoshiquest.io/metadata/tombstone/";
      const { result } = simnet.callPublicFn(
        contractName,
        "set-token-uri-base",
        [Cl.stringUtf8(newUri)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("should reject empty URI from admin", () => {
      const { result } = simnet.callPublicFn(
        contractName,
        "set-token-uri-base",
        [Cl.stringUtf8("")],
        deployer
      );
      expect(result).toBeErr(Cl.uint(3004)); // ERR_INVALID_METADATA
    });

    it("should reject URI change from non-admin", () => {
      const newUri = "https://malicious.com/";
      const { result } = simnet.callPublicFn(
        contractName,
        "set-token-uri-base",
        [Cl.stringUtf8(newUri)],
        address1
      );
      expect(result).toBeErr(Cl.uint(3001)); // ERR_UNAUTHORIZED
    });

    it("should allow admin to transfer ownership", () => {
      const { result } = simnet.callPublicFn(
        contractName,
        "transfer-ownership",
        [Cl.principal(address1)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("should reject ownership transfer from non-admin", () => {
      const { result } = simnet.callPublicFn(
        contractName,
        "transfer-ownership",
        [Cl.principal(address2)],
        address1
      );
      expect(result).toBeErr(Cl.uint(3001)); // ERR_UNAUTHORIZED
    });
  });

  describe("Edge Cases and Security", () => {
    it("should reject minting too many tombstones per character", () => {
      const metadata = {
        "character-name": Cl.stringUtf8("SpamHero"),
        "final-level": Cl.uint(1),
        "deepest-floor": Cl.uint(1),
        "total-experience": Cl.uint(100),
        "play-time": Cl.uint(600),
        "death-cause": Cl.stringUtf8("Spam death"),
        "final-score": Cl.uint(100),
        "burned-items-count": Cl.uint(0),
        "death-block": Cl.uint(50),
      };

      // Mint maximum allowed tombstones (10)
      for (let i = 0; i < 10; i++) {
        const { result } = simnet.callPublicFn(
          contractName,
          "mint-tombstone",
          [Cl.principal(address1), Cl.tuple(metadata)],
          deployer
        );
        expect(result).toBeOk(Cl.uint(i + 1));
      }

      // 11th should fail
      const { result } = simnet.callPublicFn(
        contractName,
        "mint-tombstone",
        [Cl.principal(address1), Cl.tuple(metadata)],
        deployer
      );
      expect(result).toBeErr(Cl.uint(3003)); // ERR_ALREADY_EXISTS
    });

    it("should handle Unicode character names correctly", () => {
      const unicodeMetadata = {
        "character-name": Cl.stringUtf8("サトシ"), // "Satoshi" in Japanese
        "final-level": Cl.uint(5),
        "deepest-floor": Cl.uint(3),
        "total-experience": Cl.uint(500),
        "play-time": Cl.uint(1800),
        "death-cause": Cl.stringUtf8("モンスターに倒された"), // "Defeated by monster" in Japanese
        "final-score": Cl.uint(2500),
        "burned-items-count": Cl.uint(2),
        "death-block": Cl.uint(75),
      };

      const { result } = simnet.callPublicFn(
        contractName,
        "mint-tombstone",
        [Cl.principal(address1), Cl.tuple(unicodeMetadata)],
        deployer
      );
      expect(result).toBeOk(Cl.uint(1));
    });

    it("should provide correct token URI", () => {
      // First mint a tombstone
      simnet.callPublicFn(
        contractName,
        "admin-mint-test-tombstone",
        [Cl.principal(address1)],
        deployer
      );

      const { result } = simnet.callReadOnlyFn(
        contractName,
        "get-token-uri",
        [Cl.uint(1)],
        address1
      );
      expect(result).toBeOk(
        Cl.some(Cl.stringUtf8("https://api.satoshiquest.io/metadata/tombstone/1"))
      );
    });
  });
});
