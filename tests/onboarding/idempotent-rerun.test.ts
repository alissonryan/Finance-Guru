/**
 * Integration Test: Idempotent Re-run
 * Tests that the onboarding system can be re-run without errors (idempotency)
 */

import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { existsSync, rmSync } from "fs";
import { join } from "path";

const PROJECT_ROOT = process.cwd();
const TEST_STATE_FILE = join(PROJECT_ROOT, ".onboarding-state.json");

describe("Idempotent Re-run Integration Test", () => {
  beforeEach(() => {
    // Clean up any existing test state
    if (existsSync(TEST_STATE_FILE)) {
      rmSync(TEST_STATE_FILE, { force: true });
    }
  });

  afterEach(() => {
    // Clean up test state
    if (existsSync(TEST_STATE_FILE)) {
      rmSync(TEST_STATE_FILE, { force: true });
    }
  });

  test("createNewState is idempotent - creates consistent structure", async () => {
    const { createNewState } = await import("../../scripts/onboarding/modules/progress");

    const state1 = createNewState();
    const state2 = createNewState();

    // Structure should be identical (timestamps will differ)
    expect(state1.version).toBe(state2.version);
    expect(state1.completed_sections).toEqual(state2.completed_sections);
    expect(state1.current_section).toBe(state2.current_section);
    expect(typeof state1.data).toBe(typeof state2.data);
  });

  test("multiple save/load cycles preserve data integrity", async () => {
    const {
      createNewState,
      saveState,
      loadState,
      markSectionComplete,
      saveSectionData
    } = await import("../../scripts/onboarding/modules/progress");

    // First cycle
    const state1 = createNewState();
    saveSectionData(state1, "liquid_assets", { total: 10000 });
    markSectionComplete(state1, "liquid_assets", "investments");
    saveState(state1);

    const loaded1 = loadState();
    expect(loaded1?.data.liquid_assets.total).toBe(10000);
    expect(loaded1?.current_section).toBe("investments");

    // Second cycle - save again with additional data
    saveSectionData(loaded1!, "investments", { total_value: 50000 });
    markSectionComplete(loaded1!, "investments", "cash_flow");
    saveState(loaded1!);

    const loaded2 = loadState();
    expect(loaded2?.data.liquid_assets.total).toBe(10000); // Original data preserved
    expect(loaded2?.data.investments.total_value).toBe(50000);
    expect(loaded2?.current_section).toBe("cash_flow");

    // Third cycle - verify all data intact
    saveState(loaded2!);
    const loaded3 = loadState();

    expect(loaded3?.data.liquid_assets.total).toBe(10000);
    expect(loaded3?.data.investments.total_value).toBe(50000);
    expect(loaded3?.completed_sections).toHaveLength(2);
  });

  test("re-running validation functions produces same results", async () => {
    const { validateCurrency, validateRiskTolerance, validateNonEmpty } =
      await import("../../scripts/onboarding/modules/input-validator");

    // Run validations multiple times
    const inputs = ["$1,234.56", "aggressive", "test value"];

    for (let i = 0; i < 5; i++) {
      expect(validateCurrency(inputs[0])).toBe(1234.56);
      expect(validateRiskTolerance(inputs[1])).toBe("aggressive");
      expect(validateNonEmpty(inputs[2])).toBe("test value");
    }
  });

  test("re-running YAML generation produces consistent structure", async () => {
    const { generateUserProfile } = await import("../../scripts/onboarding/modules/yaml-generator");

    const testData = {
      user_name: "TestUser",
      liquid_assets_total: 10000,
      liquid_assets_count: 2,
      portfolio_value: 100000,
      risk_tolerance: "moderate"
    };

    const yaml1 = generateUserProfile(testData);
    const yaml2 = generateUserProfile(testData);
    const yaml3 = generateUserProfile(testData);

    // All outputs should contain the same key data (timestamps will differ)
    expect(yaml1).toContain("User: TestUser");
    expect(yaml1).toContain("total: 10000");
    expect(yaml1).toContain("total_value: 100000");
    expect(yaml1).toContain('risk_tolerance: "moderate"');

    expect(yaml2).toContain("User: TestUser");
    expect(yaml2).toContain("total: 10000");
    expect(yaml2).toContain("total_value: 100000");
    expect(yaml2).toContain('risk_tolerance: "moderate"');

    expect(yaml3).toContain("User: TestUser");
    expect(yaml3).toContain("total: 10000");
    expect(yaml3).toContain("total_value: 100000");
    expect(yaml3).toContain('risk_tolerance: "moderate"');
  });

  test("completing same section multiple times is safe", async () => {
    const {
      createNewState,
      markSectionComplete,
      getSectionData,
      saveSectionData
    } = await import("../../scripts/onboarding/modules/progress");

    const state = createNewState();

    // Save section data
    saveSectionData(state, "liquid_assets", {
      checking: 5000,
      savings: 10000,
      total: 15000
    });

    // Mark complete
    markSectionComplete(state, "liquid_assets", "investments");
    expect(state.completed_sections).toContain("liquid_assets");

    // Update the same section data (idempotent update)
    saveSectionData(state, "liquid_assets", {
      checking: 5000,
      savings: 10000,
      total: 15000
    });

    // Data should be preserved
    const data = getSectionData(state, "liquid_assets");
    expect(data?.total).toBe(15000);
    expect(state.completed_sections).toContain("liquid_assets");
    expect(state.completed_sections.filter(s => s === "liquid_assets")).toHaveLength(1);
  });

  test("state can handle complete flow re-run", async () => {
    const {
      createNewState,
      saveState,
      loadState,
      clearState,
      markSectionComplete,
      isComplete
    } = await import("../../scripts/onboarding/modules/progress");

    // First complete run
    const state1 = createNewState();
    const sections: Array<[string, string | null]> = [
      ["liquid_assets", "investments"],
      ["investments", "cash_flow"],
      ["cash_flow", "debt"],
      ["debt", "preferences"],
      ["preferences", "summary"],
      ["summary", "mcp_config"],
      ["mcp_config", "env_setup"],
      ["env_setup", null]
    ];

    for (const [section, next] of sections) {
      markSectionComplete(state1, section as any, next as any);
    }
    expect(isComplete(state1)).toBe(true);
    saveState(state1);

    // Clear and re-run
    clearState();

    const state2 = createNewState();
    for (const [section, next] of sections) {
      markSectionComplete(state2, section as any, next as any);
    }
    expect(isComplete(state2)).toBe(true);
    saveState(state2);

    // Both runs should produce complete state
    const loaded = loadState();
    expect(isComplete(loaded!)).toBe(true);
    expect(loaded?.completed_sections).toHaveLength(8);
  });

  test("loading non-existent state returns null consistently", async () => {
    const { loadState, hasExistingState } =
      await import("../../scripts/onboarding/modules/progress");

    // Ensure no state exists
    expect(hasExistingState()).toBe(false);

    // Multiple loads should all return null
    expect(loadState()).toBeNull();
    expect(loadState()).toBeNull();
    expect(loadState()).toBeNull();
  });

  test("section data updates are idempotent", async () => {
    const {
      createNewState,
      saveSectionData,
      getSectionData
    } = await import("../../scripts/onboarding/modules/progress");

    const state = createNewState();
    const testData = { value: 100, name: "Test" };

    // Save same data multiple times
    saveSectionData(state, "test_section", testData);
    saveSectionData(state, "test_section", testData);
    saveSectionData(state, "test_section", testData);

    const retrieved = getSectionData(state, "test_section");
    expect(retrieved).toEqual(testData);

    // State.data should only have one entry for this section
    expect(Object.keys(state.data).filter(k => k === "test_section")).toHaveLength(1);
  });

  test("clearState is idempotent - clearing multiple times is safe", async () => {
    const {
      createNewState,
      saveState,
      clearState,
      hasExistingState
    } = await import("../../scripts/onboarding/modules/progress");

    // Create and save state
    const state = createNewState();
    saveState(state);
    expect(hasExistingState()).toBe(true);

    // Clear multiple times
    clearState();
    expect(hasExistingState()).toBe(false);

    clearState(); // Should not error
    expect(hasExistingState()).toBe(false);

    clearState(); // Should still not error
    expect(hasExistingState()).toBe(false);
  });

  test("validation errors are consistent across re-runs", async () => {
    const { validateCurrency, validateRiskTolerance } =
      await import("../../scripts/onboarding/modules/input-validator");

    // Run invalid inputs multiple times
    for (let i = 0; i < 3; i++) {
      expect(() => validateCurrency("invalid")).toThrow();
      expect(() => validateCurrency("")).toThrow();
      expect(() => validateRiskTolerance("invalid")).toThrow();
    }
  });

  test("complex data structure preservation across multiple cycles", async () => {
    const {
      createNewState,
      saveState,
      loadState,
      saveSectionData
    } = await import("../../scripts/onboarding/modules/progress");

    const complexData = {
      portfolio: {
        equities: [
          { ticker: "TSLA", shares: 100, cost_basis: 200 },
          { ticker: "PLTR", shares: 500, cost_basis: 20 }
        ],
        metadata: {
          last_updated: "2026-01-16",
          source: "test"
        }
      }
    };

    // First cycle
    const state1 = createNewState();
    saveSectionData(state1, "investments", complexData);
    saveState(state1);

    // Second cycle - load and re-save
    const state2 = loadState();
    saveState(state2!);

    // Third cycle - load and re-save again
    const state3 = loadState();
    saveState(state3!);

    // Final verification
    const finalState = loadState();
    expect(finalState?.data.investments.portfolio.equities).toHaveLength(2);
    expect(finalState?.data.investments.portfolio.equities[0].ticker).toBe("TSLA");
    expect(finalState?.data.investments.portfolio.metadata.source).toBe("test");
  });
});
