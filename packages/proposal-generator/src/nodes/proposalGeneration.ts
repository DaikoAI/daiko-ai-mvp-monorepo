import { proposalGeneratorState } from "../utils/state";
import { RunnableSequence } from "@langchain/core/runnables";
import { gpt4oMini } from "../utils/model";
import { proposalGenerationPrompt, parser } from "../prompts/proposalGeneration";
import { LangGraphRunnableConfig } from "@langchain/langgraph";

const proposalGenerationChain = RunnableSequence.from([proposalGenerationPrompt, gpt4oMini, parser]);

export const proposalGenerationNode = async (
  state: typeof proposalGeneratorState.State,
  options: LangGraphRunnableConfig,
) => {
  const threadId = options.configurable?.thread_id;
  if (!threadId) {
    throw new Error("thread_id is missing in config");
  }

  const { signal, user, tokenPrices, latestTweets, userBalance } = state;

  if (!signal || !user || !tokenPrices || !latestTweets || !userBalance) {
    throw new Error("Required data (signal, user, tokenPrices, latestTweets, userBalance) is missing in state.");
  }

  // 提案生成チェーンを実行
  const result = await proposalGenerationChain.invoke({
    signal,
    user,
    tokenPrices,
    latestTweets,
    userBalance,
    userId: threadId,
  });

  if (!result.proposal) {
    throw new Error("Failed to generate proposal.");
  }

  return {
    proposal: result.proposal,
  };
};
