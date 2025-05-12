import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { defaultSignalChatModel } from "./model";
import { buildKnownTokensBlock, signalPromptTemplate } from "./prompt";
import { LlmSignalResponseSchema } from "./schema";
import type { DetectorParams, LlmSignalResponse } from "./types";

// Create a parser that validates and parses the LLM output
const parser = StructuredOutputParser.fromZodSchema(LlmSignalResponseSchema);

/**
 * Detects market signals from formatted tweets using LangChain.
 * @param params DetectorParams containing tweets and known tokens
 * @returns Parsed LLM response conforming to LlmSignalResponse schema
 */
export async function detectSignalWithLlm(params: DetectorParams): Promise<LlmSignalResponse> {
  const { formattedTweets, knownTokens } = params;
  const tweetsJson = JSON.stringify(formattedTweets, null, 2);
  const knownTokensBlock = buildKnownTokensBlock(knownTokens);

  // Build and run the chain: prompt -> LLM -> parser
  const chain = RunnableSequence.from([signalPromptTemplate, defaultSignalChatModel, parser]);

  // Invoke the chain with the template variables
  const response = await chain.invoke({
    formattedTweets: tweetsJson,
    knownTokensBlock,
  });

  return response;
}
