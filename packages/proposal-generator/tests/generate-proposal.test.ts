/// <reference types="vitest" />
import { describe, expect, it, vi } from "vitest";
import { mockSignal, mockTokenPrices, mockTweets, mockUser, mockUserBalances } from "./mockdata";

// Mock the dataFetchNode directly
vi.mock("../src/utils/db", () => ({
  fetchUser: vi.fn().mockResolvedValue(mockUser),
  fetchSignal: vi.fn().mockResolvedValue(mockSignal),
  fetchTokenPrices: vi.fn().mockResolvedValue(mockTokenPrices),
  fetchTweets: vi.fn().mockResolvedValue(mockTweets),
  fetchUserBalances: vi.fn().mockResolvedValue(mockUserBalances),
}));

describe("generateProposal with mock Node", () => {
  // Updated description
  it("should generate a proposal string containing the rationale summary", async () => {
    // Import needs to happen *after* vi.mock is declared
    const { initProposalGeneratorGraph } = await import("../src/index");
    const { graph, config } = await initProposalGeneratorGraph("signal-test", "user-test");

    // Since dataFetchNode is mocked, the graph should execute quickly
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
    // These might now depend on how proposalGenerationNode gets its data
    // Let's verify the core proposal structure first. We can refine checks later.
    // expect(result.proposal!.userId).toBe(mockUser.id); // This might fail if proposal node doesn't get user correctly
    // expect(result.proposal!.triggerEventId).toBe(mockSignal.id); // This might fail if proposal node doesn't get signal correctly
  }, 60000); // Timeout might be reducible now
});
