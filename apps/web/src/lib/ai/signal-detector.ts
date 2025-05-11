import { openai } from "@ai-sdk/openai";
import type { FormattedTweetForLlm } from "@daiko-ai/shared"; // Adjust path if necessary
import { Logger, LogLevel } from "@daiko-ai/shared"; // Assuming Logger is available
import { generateObject } from "ai"; // Removed 'type CoreTool' as it's not used
import { z } from "zod";

const logger = new Logger({ level: LogLevel.INFO }); // Changed to INFO for less verbose default logging

// Define a type for the known tokens to be passed to the LLM
export type KnownTokenType = {
  address: string;
  symbol: string;
  name: string;
};

// Zod schema for the expected LLM response, moved from signal-processing.ts
// Added optional 'reasonInvalid' for better debugging when signalDetected is false.
export const LlmSignalResponseSchema = z.object({
  signalDetected: z.boolean(),
  tokenAddress: z
    .string()
    .describe("The token contract address relevant to the signal. Empty if not applicable or signalDetected is false."),
  sources: z
    .array(z.object({ url: z.string(), label: z.string() }))
    .describe("Primary sources (tweets or external links) informing the signal. Empty if signalDetected is false."),
  sentimentScore: z
    .number()
    .min(-1)
    .max(1)
    .describe("Overall sentiment (-1.0 to 1.0). 0.0 if signalDetected is false."),
  suggestionType: z
    .enum(["buy", "sell", "hold", "close_position", "stake"])
    .describe("Suggested action. Default to 'buy' if signalDetected is false as a placeholder."),
  strength: z.number().min(1).max(100).describe("Signal strength (1-100). 1 if signalDetected is false."),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .nullable()
    .describe("Confidence in the signal (0.0-1.0). Null if signalDetected is false."),
  reasoning: z.string().describe("Explanation for the signal detection or why no signal was detected."),
  relatedTweetIds: z.array(z.string()).describe("IDs of all analyzed tweets."),
  reasonInvalid: z
    .string()
    .optional()
    .describe("If signalDetected is false, a brief reason why (e.g., 'generic content', 'no specific token')."),
  impactScore: z
    .number()
    .min(1)
    .max(10)
    .nullable()
    .describe(
      "Potential market impact of the signal (1-10, higher is more impact). Null if not applicable or signalDetected is false.",
    ),
});

export type LlmSignalResponseType = z.infer<typeof LlmSignalResponseSchema>;

const MAX_LLM_RETRY_ATTEMPTS = 3;
const LLM_RETRY_DELAY_MS = 1000;

/**
 * Generates the prompt for the LLM based on the provided tweets.
 * This prompt is specifically engineered to improve detection quality and reduce false positives.
 */
function buildPrompt(formattedTweets: FormattedTweetForLlm[], knownTokens: KnownTokenType[]): string {
  const promptInputText = JSON.stringify(formattedTweets, null, 2);
  const knownTokensText =
    knownTokens.length > 0
      ? `You MUST prioritize signals related to the following known tokens. If a tweet mentions one of these, focus your analysis there:\nSTART_KNOWN_TOKENS_BLOCK\n${JSON.stringify(
          knownTokens.map((t) => ({ symbol: t.symbol, name: t.name, address: t.address })),
          null,
          2,
        )}\nEND_KNOWN_TOKENS_BLOCK\n`
      : "No specific tokens are pre-identified; analyze for any relevant crypto signals.";

  return `
You are an expert crypto market analyst. Analyze the following recent tweets.
Each tweet object in the JSON array includes an 'id', 'text', 'author', 'time', and 'url'.

Tweets:
START_JSON_BLOCK
${promptInputText}
END_JSON_BLOCK

${knownTokensText}

Based *solely* on the information within these tweets, generate a single JSON object.
Adhere strictly to the provided schema. Do NOT include any text before or after the JSON.

**Crucial Instructions for Analysis:**
1.  **Signal Detection (signalDetected):**
    *   Set to true ONLY if there's a strong, clear, and actionable market signal directly inferable from the tweets. This requires specific information like:
        *   Mentions of specific token symbols (e.g., $ETH, BTC) or contract addresses, ideally matching one of the known tokens if provided.
        *   Discussions of significant price movements, potential pumps/dumps.
        *   Announcements of major project news (partnerships, mainnet launches, airdrops, security incidents, tokenomic changes, significant FUD, hacks, exploits, delistings, regulatory issues).
        *   Explicit buy/sell recommendations for a *specific* token from credible sources (if discernible).
    *   Set to false if tweets are:
        *   Generic greetings (e.g., "gm", "good morning").
        *   Vague sentiments or general crypto discussions without specific, actionable details.
        *   Memes, jokes, or off-topic content.
        *   Questions without providing new information.
        *   Simple statements of holding a token without further market context.
2.  **Token Address (tokenAddress):**
    *   If signalDetected is true, provide the *primary* token contract address. This address MUST correspond to one of the addresses provided in the KNOWN_TOKENS_BLOCK if the signal relates to one of those tokens.
    *   If a symbol like $ETH is mentioned and it's a known token, use its address.
    *   If the signal is strong for a token not in the known list, you can still report it, but clearly state this in the reasoning.
    *   If signalDetected is false or no specific token is central to a detected signal, use an empty string "".
3.  **Sources (sources):**
    *   If signalDetected is true:
        *   For each tweet directly contributing to the signal: use its 'url' and label it "Tweet from account [author] (ID: [id])".
        *   If a tweet mentions an external URL (news, blog) *and* that external information (as described/implied in the tweet) is *critical* to the signal, include that external URL and label it (e.g., "News article linked in tweet [id]").
    *   If signalDetected is false, this array MUST be empty.
4.  **Sentiment Score (sentimentScore):**
    *   Reflect sentiment *towards the specific token/project* if a signal is detected.
    *   If signalDetected is false, use 0.0. Be conservative; avoid extreme scores without strong evidence.
5.  **Suggestion Type (suggestionType):**
    *   If signalDetected is true, choose the most fitting action (buy, sell, hold, close_position, stake).
    *   A "sell" signal is particularly important. Identify sell signals based on negative news like:
        *   **FUD (Fear, Uncertainty, Doubt):** Strong, credible FUD campaigns.
        *   **Hacks/Exploits:** Reports of security breaches affecting a project or token.
        *   **Delistings:** Announcements of a token being delisted from major exchanges.
        *   **Regulatory Issues:** News of significant negative regulatory actions.
        *   **Team Issues:** Major negative news about the core team (e.g., departures, internal conflict with market impact).
        *   **Tokenomics Failure:** Clear evidence of failing tokenomics (e.g., hyperinflationary pressure not by design).
        *   **Rug Pulls/Scams:** Evidence suggesting a project is a scam or a rug pull is imminent/happening.
    *   If signalDetected is false, use "buy" as a schema-required placeholder.
6.  **Strength (strength):**
    *   If signalDetected is true, score from 1-100 based on the clarity, specificity, and potential market impact. Vague or weak signals get low scores.
    *   If signalDetected is false, use 1.
7.  **Confidence (confidence):**
    *   If signalDetected is true, your confidence (0.0-1.0) in the accuracy of the detected signal and its parameters.
    *   If signalDetected is false, use null.
8.  **Reasoning (reasoning):**
    *   If signalDetected is true: Justify ALL fields. Explain what specific information from which tweets led to the signal, sentiment, suggestion, strength, confidence, and impact score. Be specific, especially for sell signals, detailing *why* it's a sell (e.g., "Tweet X directly reports a confirmed hack on Project Y, leading to a sell signal due to expected price decline."). If the token was from the known list, mention it.
    *   If signalDetected is false: Clearly explain *why* no signal was detected based on the criteria above.
9.  **Related Tweet IDs (relatedTweetIds):** Include IDs of ALL tweets you analyzed.
10. **Reason Invalid (reasonInvalid):** If signalDetected is false, provide a short, structured reason.
11. **Impact Score (impactScore):**
    *   If signalDetected is true, estimate the potential market impact of this signal on a scale of 1 (very low) to 10 (very high/market-moving).
    *   Consider factors like the credibility of the source, the specificity of the information, the size/prominence of the token/project, and the nature of the event (e.g., a major exchange hack has higher impact than minor FUD).
    *   For "sell" signals based on credible negative events (hacks, major delistings), this score should generally be higher.
    *   If signalDetected is false, use null.

Output ONLY the JSON object.
`;
}

/**
 * Detects market signals from a list of tweets using an LLM.
 * Includes retry logic and post-processing to improve quality.
 * @param formattedTweets - Array of tweets formatted for the LLM.
 * @param knownTokens - Array of known tokens to prioritize.
 * @returns The LLM's response, potentially post-processed, or null if an error occurs.
 */
export async function detectSignalWithLlm(
  formattedTweets: FormattedTweetForLlm[],
  knownTokens: KnownTokenType[],
): Promise<LlmSignalResponseType | null> {
  if (!formattedTweets || formattedTweets.length === 0) {
    logger.info("detectSignalWithLlm", "No tweets provided for signal detection.");
    return {
      signalDetected: false,
      tokenAddress: "",
      sources: [],
      sentimentScore: 0.0,
      suggestionType: "buy",
      strength: 1,
      confidence: null,
      reasoning: "No tweets were provided for analysis.",
      relatedTweetIds: [],
      reasonInvalid: "no_tweets_provided",
      impactScore: null,
    };
  }

  const prompt = buildPrompt(formattedTweets, knownTokens);
  let attempt = 0;

  while (attempt < MAX_LLM_RETRY_ATTEMPTS) {
    try {
      logger.debug("detectSignalWithLlm", `Attempt ${attempt + 1} to call LLM with ${formattedTweets.length} tweets.`);
      const { object: llmResponse } = await generateObject({
        model: openai("gpt-4o-mini"), // Consider making model configurable
        schema: LlmSignalResponseSchema,
        prompt,
        maxTokens: 1500, // Increased slightly for potentially more detailed reasoning
        temperature: 0.1, // Lower temperature for more deterministic and factual output
        mode: "json", // Ensure JSON output mode
      });

      logger.debug("detectSignalWithLlm", "LLM response received:", JSON.stringify(llmResponse));
      return postProcessLlmResponse(llmResponse as LlmSignalResponseType, knownTokens);
    } catch (error: any) {
      attempt++;
      logger.warn("detectSignalWithLlm", `Error calling LLM (attempt ${attempt}/${MAX_LLM_RETRY_ATTEMPTS})`, {
        error: error.message,
        // stack: error.stack, // uncomment for more detailed error logging
        tweetsCount: formattedTweets.length,
      });
      if (attempt >= MAX_LLM_RETRY_ATTEMPTS) {
        logger.error("detectSignalWithLlm", "Max LLM retry attempts reached. Returning null.", {
          lastError: error.message,
        });
        return null;
      }
      await new Promise((resolve) => setTimeout(resolve, LLM_RETRY_DELAY_MS * (attempt + 1))); // Basic exponential backoff
    }
  }
  return null; // This line is restored. It covers the theoretical case where the loop might not run.
}

/**
 * Post-processes the LLM response to enforce certain rules and improve signal quality.
 */
function postProcessLlmResponse(response: LlmSignalResponseType, knownTokens: KnownTokenType[]): LlmSignalResponseType {
  let modifiedResponse = { ...response };

  // Ensure relatedTweetIds is always an array, even if LLM fails to provide it.
  if (!Array.isArray(modifiedResponse.relatedTweetIds)) {
    modifiedResponse.relatedTweetIds = [];
  }

  if (modifiedResponse.signalDetected) {
    // Rule 1: If signalDetected is true, but tokenAddress is empty, it's likely a weak or invalid signal.
    if (!modifiedResponse.tokenAddress || modifiedResponse.tokenAddress.trim() === "") {
      logger.warn("postProcessLlmResponse", "Signal detected but tokenAddress is empty. Overriding to no signal.", {
        originalReasoning: modifiedResponse.reasoning,
      });
      modifiedResponse.signalDetected = false;
      modifiedResponse.reasoning = `Post-processing: Signal initially detected but tokenAddress was missing. Original reasoning: ${modifiedResponse.reasoning}`;
      modifiedResponse.reasonInvalid = "missing_token_address_after_detection";
      modifiedResponse.impactScore = null;
      // Reset fields to default "no signal" state
      modifiedResponse.sentimentScore = 0.0;
      modifiedResponse.suggestionType = "buy";
      modifiedResponse.strength = 1;
      modifiedResponse.confidence = null;
      modifiedResponse.sources = []; // Clear sources as they might be irrelevant now
    }

    // Rule 2: If signalDetected is true, but sources are empty. This might be acceptable if the signal comes from a single tweet's content directly and not external links.
    // However, if reasoning is also weak, it's a stronger case for invalidation.
    // For now, we rely on the reasoning check.

    // Rule 3: If reasoning is too short or generic despite signalDetected: true
    // Consider making the length check more dynamic or based on number of tweets.
    if (
      modifiedResponse.signalDetected &&
      (modifiedResponse.reasoning.length < 50 ||
        modifiedResponse.reasoning.toLowerCase().includes("no specific reason provided"))
    ) {
      logger.warn(
        "postProcessLlmResponse",
        "Signal detected but reasoning is too short or generic. Overriding to no signal.",
        { originalReasoning: modifiedResponse.reasoning },
      );
      modifiedResponse.signalDetected = false;
      modifiedResponse.reasoning = `Post-processing: Signal initially detected but reasoning was insufficient. Original reasoning: ${modifiedResponse.reasoning}`;
      modifiedResponse.reasonInvalid = "insufficient_reasoning_after_detection";
      modifiedResponse.impactScore = null;
      // Reset fields
      modifiedResponse.sentimentScore = 0.0;
      modifiedResponse.suggestionType = "buy";
      modifiedResponse.strength = 1;
      modifiedResponse.confidence = null;
      modifiedResponse.sources = [];
    }
  }

  // Ensure 'reasonInvalid' is set if signalDetected is false and it's not already set by LLM or post-processing rules.
  if (!modifiedResponse.signalDetected && !modifiedResponse.reasonInvalid) {
    modifiedResponse.reasonInvalid = "unknown_reason_for_no_signal_after_processing";
  }

  // Ensure all fields conform to schema defaults if signal is false after post-processing
  if (!modifiedResponse.signalDetected) {
    modifiedResponse.tokenAddress = "";
    modifiedResponse.sources = [];
    modifiedResponse.sentimentScore = 0.0;
    modifiedResponse.suggestionType = "buy";
    modifiedResponse.strength = 1;
    modifiedResponse.confidence = null;
    modifiedResponse.impactScore = null;
  }

  return modifiedResponse;
}
