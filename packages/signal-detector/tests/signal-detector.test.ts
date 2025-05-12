/// <reference types="vitest" />
import { describe, expect, it } from "vitest";
import { detectSignalWithLlm } from "../src/detector";
import { mockKnownTokens, mockTweetsForDetector } from "./mockdata";

describe("Signal Detector Tests", () => {
  it("should detect signals from tweets and known tokens", async () => {
    const result = await detectSignalWithLlm({
      formattedTweets: mockTweetsForDetector,
      knownTokens: mockKnownTokens,
    });

    console.log("%o", result);

    expect(result).toBeDefined();
    expect(result.signalDetected).toBe(true);
    expect(result.sources).toBeDefined();
  }, 60000);

  it("should not detect any signals from empty tweets", async () => {
    const result = await detectSignalWithLlm({
      formattedTweets: [],
      knownTokens: mockKnownTokens,
    });

    console.log("%o", result);

    expect(result).toBeDefined();
    expect(result.signalDetected).toBe(false);
  }, 60000);
});
