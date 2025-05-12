import { PromptTemplate } from "@langchain/core/prompts";
import { LlmSignalResponseSchema } from "./schema";
import type { KnownTokenType } from "./types";

/**
 * Builds the known tokens block for the LLM prompt.
 * @param knownTokens Array of known tokens to prioritize.
 */
export function buildKnownTokensBlock(knownTokens: KnownTokenType[]): string {
  if (!knownTokens || knownTokens.length === 0) {
    return "No specific tokens are pre-identified; analyze for any relevant crypto signals.";
  }
  const tokensJson = JSON.stringify(
    knownTokens.map(({ symbol, name, address }) => ({ symbol, name, address })),
    null,
    2,
  );
  return `You MUST prioritize signals related to the following known tokens. If a tweet mentions one of these, focus your analysis there:\nSTART_KNOWN_TOKENS_BLOCK\n${tokensJson}\nEND_KNOWN_TOKENS_BLOCK`;
}

/**
 * Prompt template for signal detection.
 * Variables:
 *  - formattedTweets: JSON string of tweets.
 *  - knownTokensBlock: prebuilt string block for known tokens.
 */
export const signalPromptTemplate = new PromptTemplate({
  template: `
You are an expert crypto market analyst. Analyze the following recent tweets.
Each tweet object in the JSON array includes an 'id', 'text', 'author', 'time', and 'url'.

Tweets:
START_JSON_BLOCK
{formattedTweets}
END_JSON_BLOCK

{knownTokensBlock}

Based solely on the information within these tweets, generate a single JSON object.
Adhere strictly to the following schema:
${LlmSignalResponseSchema.toString()}

Output only the JSON object.
  `,
  inputVariables: ["formattedTweets", "knownTokensBlock"],
});
