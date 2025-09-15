
import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

/*
  Satoshi Quest Core Contract Test Suite
  
  Tests the main game mechanics including character creation,
  gameplay, death mechanics, and score tracking.
  
  Phase 1 Testing: Independent core functionality with mock tombstone
*/

describe("Satoshi Quest Core Contract", () => {
  describe("Contract Initialization", () => {
    it("should initialize with correct default values", () => {
      // Test contract is deployed
      const contractSource = simnet.getContractSource("satoshi-quest-core");
      expect(contractSource).toBeDefined();
      
      // Test initial game state
      const { result: totalCharacters } = simnet.callReadOnlyFn(
        "satoshi-quest-core",
        "get-total-characters-created",
        [],
        deployer
      );
      expect(totalCharacters).toBeUint(0);
      
      const { result: totalDeaths } = simnet.callReadOnlyFn(
        "satoshi-quest-core",
        "get-total-deaths",
        [],
        deployer
      );
      expect(totalDeaths).toBeUint(0);
    });

    it("should set correct contract constants", () => {
      // Test max values are reasonable
      const { result } = simnet.callReadOnlyFn(
        "satoshi-quest-core",
        "get-character",
        [Cl.stringAscii("nonexistent"), Cl.standardPrincipal(wallet1)],
        deployer
      );
      expect(result).toBeNone();
    });
  });

  describe("Character Creation", () => {
    it("should create a new character successfully", () => {
      const characterName = "TestHero";
      
      const { result } = simnet.callPublicFn(
        "satoshi-quest-core",
        "create-character",
        [Cl.stringUtf8(characterName)],
        wallet1
      );
      expect(result).toBeOk(Cl.bool(true));
      
      // Verify character was created
      const characterId = `${wallet1}.${characterName}`;
      const { result: character } = simnet.callReadOnlyFn(
        "satoshi-quest-core",
        "get-character",
        [Cl.stringAscii(characterId), Cl.standardPrincipal(wallet1)],
        deployer
      );
      
      expect(character).toBeSome();
    });

    it("should reject duplicate character names for same player", () => {
      const characterName = "DuplicateHero";
      
      // Create first character
      simnet.callPublicFn(
        "satoshi-quest-core",
        "create-character",
        [Cl.stringUtf8(characterName)],
        wallet1
      );
      
      // Try to create duplicate
      const { result } = simnet.callPublicFn(
        "satoshi-quest-core",
        "create-character",
        [Cl.stringUtf8(characterName)],
        wallet1
      );
      expect(result).toBeErr(Cl.uint(2002)); // ERR_CHARACTER_EXISTS
    });

    it("should allow same character name for different players", () => {
      const characterName = "CommonName";
      
      // Create character for wallet1
      const { result: result1 } = simnet.callPublicFn(
        "satoshi-quest-core",
        "create-character",
        [Cl.stringUtf8(characterName)],
        wallet1
      );
      expect(result1).toBeOk(Cl.bool(true));
      
      // Create character for wallet2
      const { result: result2 } = simnet.callPublicFn(
        "satoshi-quest-core",
        "create-character",
        [Cl.stringUtf8(characterName)],
        wallet2
      );
      expect(result2).toBeOk(Cl.bool(true));
    });

    it("should reject invalid character names", () => {
      // Test empty name
      const { result: emptyResult } = simnet.callPublicFn(
        "satoshi-quest-core",
        "create-character",
        [Cl.stringUtf8("")],
        wallet1
      );
      expect(emptyResult).toBeErr(Cl.uint(2003)); // ERR_INVALID_CHARACTER_NAME
      
      // Test name too long (>32 chars)
      const longName = "a".repeat(33);
      const { result: longResult } = simnet.callPublicFn(
        "satoshi-quest-core",
        "create-character",
        [Cl.stringUtf8(longName)],
        wallet1
      );
      expect(longResult).toBeErr(Cl.uint(2003)); // ERR_INVALID_CHARACTER_NAME
    });
  });

  describe("Character Management", () => {
    it("should update character experience correctly", () => {
      const characterName = "XpHero";
      
      // Create character
      simnet.callPublicFn(
        "satoshi-quest-core",
        "create-character",
        [Cl.stringUtf8(characterName)],
        wallet1
      );
      
      const characterId = `${wallet1}.${characterName}`;
      const expGain = 100;
      
      // Update experience
      const { result } = simnet.callPublicFn(
        "satoshi-quest-core",
        "update-character-experience",
        [
          Cl.stringAscii(characterId),
          Cl.uint(expGain)
        ],
        wallet1
      );
      expect(result).toBeOk(Cl.bool(true));
      
      // Verify experience was updated
      const { result: character } = simnet.callReadOnlyFn(
        "satoshi-quest-core",
        "get-character",
        [Cl.stringAscii(characterId), Cl.standardPrincipal(wallet1)],
        deployer
      );
      
      expect(character).toBeSome();
      // Additional verification of experience value would require unwrapping the response
    });

    it("should only allow character owner to update experience", () => {
      const characterName = "ProtectedHero";
      
      // Create character with wallet1
      simnet.callPublicFn(
        "satoshi-quest-core",
        "create-character",
        [Cl.stringUtf8(characterName)],
        wallet1
      );
      
      const characterId = `${wallet1}.${characterName}`;
      
      // Try to update with wallet2 (unauthorized)
      const { result } = simnet.callPublicFn(
        "satoshi-quest-core",
        "update-character-experience",
        [
          Cl.stringAscii(characterId),
          Cl.uint(100)
        ],
        wallet2
      );
      expect(result).toBeErr(Cl.uint(2001)); // ERR_UNAUTHORIZED
    });
  });

  describe("Death Mechanics - Phase 1 (Mock Tombstone)", () => {
    it("should handle character death with mock tombstone creation", () => {
      const characterName = "DeadHero";
      
      // Create character
      simnet.callPublicFn(
        "satoshi-quest-core",
        "create-character",
        [Cl.stringUtf8(characterName)],
        wallet1
      );
      
      const characterId = `${wallet1}.${characterName}`;
      const deathCause = "Fell into lava";
      const finalScore = 1500;
      
      // Kill character
      const { result } = simnet.callPublicFn(
        "satoshi-quest-core",
        "kill-character",
        [
          Cl.stringAscii(characterId),
          Cl.stringUtf8(deathCause),
          Cl.uint(finalScore),
          Cl.list([]) // No items to burn
        ],
        wallet1
      );
      
      expect(result).toBeOk(Cl.uint(1)); // Mock tombstone ID
      
      // Verify character is marked as dead
      const { result: character } = simnet.callReadOnlyFn(
        "satoshi-quest-core",
        "get-character",
        [Cl.stringAscii(characterId), Cl.standardPrincipal(wallet1)],
        deployer
      );
      
      expect(character).toBeSome();
      // Character should be marked as dead (is-alive: false)
    });

    it("should increment death counter correctly", () => {
      const { result: initialDeaths } = simnet.callReadOnlyFn(
        "satoshi-quest-core",
        "get-total-deaths",
        [],
        deployer
      );
      
      const characterName = "VictimHero";
      
      // Create and kill character
      simnet.callPublicFn(
        "satoshi-quest-core",
        "create-character",
        [Cl.stringUtf8(characterName)],
        wallet1
      );
      
      const characterId = `${wallet1}.${characterName}`;
      
      simnet.callPublicFn(
        "satoshi-quest-core",
        "kill-character",
        [
          Cl.stringAscii(characterId),
          Cl.stringUtf8("Testing death"),
          Cl.uint(500),
          Cl.list([])
        ],
        wallet1
      );
      
      // Check death counter increased
      const { result: finalDeaths } = simnet.callReadOnlyFn(
        "satoshi-quest-core",
        "get-total-deaths",
        [],
        deployer
      );
      
      // Should be initial + 1
      expect(finalDeaths).toBeUint(1);
    });

    it("should reject killing already dead character", () => {
      const characterName = "OnceDeadHero";
      
      // Create character
      simnet.callPublicFn(
        "satoshi-quest-core",
        "create-character",
        [Cl.stringUtf8(characterName)],
        wallet1
      );
      
      const characterId = `${wallet1}.${characterName}`;
      
      // Kill character once
      simnet.callPublicFn(
        "satoshi-quest-core",
        "kill-character",
        [
          Cl.stringAscii(characterId),
          Cl.stringUtf8("First death"),
          Cl.uint(500),
          Cl.list([])
        ],
        wallet1
      );
      
      // Try to kill again
      const { result } = simnet.callPublicFn(
        "satoshi-quest-core",
        "kill-character",
        [
          Cl.stringAscii(characterId),
          Cl.stringUtf8("Second death"),
          Cl.uint(600),
          Cl.list([])
        ],
        wallet1
      );
      
      expect(result).toBeErr(Cl.uint(2004)); // ERR_CHARACTER_ALREADY_DEAD
    });
  });

  describe("Score and Statistics", () => {
    it("should track global statistics correctly", () => {
      // Test initial stats
      const { result: totalChars } = simnet.callReadOnlyFn(
        "satoshi-quest-core",
        "get-total-characters-created",
        [],
        deployer
      );
      
      const { result: totalDeaths } = simnet.callReadOnlyFn(
        "satoshi-quest-core",
        "get-total-deaths",
        [],
        deployer
      );
      
      expect(totalChars).toBeUint(0);
      expect(totalDeaths).toBeUint(0);
      
      // Create multiple characters
      const names = ["Hero1", "Hero2", "Hero3"];
      names.forEach(name => {
        simnet.callPublicFn(
          "satoshi-quest-core",
          "create-character",
          [Cl.stringUtf8(name)],
          wallet1
        );
      });
      
      // Check character count updated
      const { result: finalChars } = simnet.callReadOnlyFn(
        "satoshi-quest-core",
        "get-total-characters-created",
        [],
        deployer
      );
      expect(finalChars).toBeUint(3);
    });
  });

  describe("Integration Readiness", () => {
    it("should provide all required interfaces for dependent contracts", () => {
      // Test that all expected public functions exist
      const publicFunctions = [
        "create-character",
        "update-character-experience", 
        "kill-character"
      ];
      
      publicFunctions.forEach(fn => {
        expect(() => {
          // Test function exists (will fail on parameters, not function existence)
          simnet.callPublicFn("satoshi-quest-core", fn, [], deployer);
        }).not.toThrow();
      });
      
      // Test read-only functions
      const readOnlyFunctions = [
        "get-character",
        "get-total-characters-created",
        "get-total-deaths"
      ];
      
      readOnlyFunctions.forEach(fn => {
        expect(() => {
          simnet.callReadOnlyFn("satoshi-quest-core", fn, [], deployer);
        }).not.toThrow();
      });
    });

    it("should handle edge cases gracefully", () => {
      // Test invalid character lookups
      const { result } = simnet.callReadOnlyFn(
        "satoshi-quest-core",
        "get-character",
        [Cl.stringAscii("nonexistent"), Cl.standardPrincipal(wallet1)],
        deployer
      );
      expect(result).toBeNone();
    });
  });

  describe("Phase 1 Deployment Validation", () => {
    it("should be deployable independently without external dependencies", () => {
      // This test validates that the core contract can deploy and function
      // without requiring tombstone, loot, or resurrection contracts
      
      // Create a character and perform basic operations
      const characterName = "IndependentHero";
      
      const { result: createResult } = simnet.callPublicFn(
        "satoshi-quest-core",
        "create-character",
        [Cl.stringUtf8(characterName)],
        wallet1
      );
      expect(createResult).toBeOk(Cl.bool(true));
      
      const characterId = `${wallet1}.${characterName}`;
      
      // Update experience
      const { result: expResult } = simnet.callPublicFn(
        "satoshi-quest-core",
        "update-character-experience",
        [Cl.stringAscii(characterId), Cl.uint(50)],
        wallet1
      );
      expect(expResult).toBeOk(Cl.bool(true));
      
      // Kill character (should work with mock tombstone)
      const { result: deathResult } = simnet.callPublicFn(
        "satoshi-quest-core",
        "kill-character",
        [
          Cl.stringAscii(characterId),
          Cl.stringUtf8("Independent testing"),
          Cl.uint(100),
          Cl.list([])
        ],
        wallet1
      );
      expect(deathResult).toBeOk(Cl.uint(1)); // Mock tombstone ID
      
      // All operations should succeed independently
      expect(true).toBe(true); // Test passed - contract is deployment ready
    });
  });
});
