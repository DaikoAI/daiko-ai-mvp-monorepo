/// <reference types="vitest" />
import { mockSignal, mockTokenPrices, mockTweets, mockUser, mockUserBalances } from "@daiko-ai/shared";
import { describe, expect, it, vi } from "vitest";

// Mock the shared db module to return our static test data
vi.mock("@daiko-ai/shared", async () => {
  const actual = (await vi.importActual("@daiko-ai/shared")) as any;
  return {
    ...actual,
    db: {
      query: {
        usersTable: { findFirst: vi.fn().mockResolvedValue(mockUser) },
        signalsTable: { findFirst: vi.fn().mockResolvedValue(mockSignal) },
        tokenPricesTable: { findMany: vi.fn().mockResolvedValue(mockTokenPrices) },
        tweetTable: { findMany: vi.fn().mockResolvedValue(mockTweets) },
        userBalancesTable: { findMany: vi.fn().mockResolvedValue(mockUserBalances) },
      },
    },
  };
});

describe("generateProposal with mock DB", () => {
  it("should generate a proposal string containing the rationale summary", async () => {
    const { initProposalGeneratorGraph } = await import("../src/index");
    const { graph, config } = await initProposalGeneratorGraph("signal-test", "user-test");

    const result = await graph.invoke({}, config);

    console.log("%o", result.proposal);

    expect(result.proposal).toBeDefined();
    // Proposal should be an object matching the output schema
    expect(typeof result.proposal!).toBe("object");
    // Check essential fields in the proposal object
    expect(result.proposal!).toHaveProperty("summary");
    expect(typeof result.proposal!.summary).toBe("string");
    expect(result.proposal!).toHaveProperty("title");
    expect(typeof result.proposal!.title).toBe("string");
    // Check that userId and triggerEventId are set correctly
    expect(result.proposal!.userId).toBe(mockUser.id);
    expect(result.proposal!.triggerEventId).toBe(mockSignal.id);
  }, 60000);
});
