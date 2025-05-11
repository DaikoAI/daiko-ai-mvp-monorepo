import { HumanMessage } from "@langchain/core/messages";
import { RunnableSequence } from "@langchain/core/runnables";
import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { parser, proposalGenerationPrompt } from "../prompts/proposalGeneration";
import { gpt4oMini } from "../utils/model";
import { proposalGeneratorState } from "../utils/state";

const proposalGenerationChain = RunnableSequence.from([proposalGenerationPrompt, gpt4oMini, parser]);

export const proposalGenerationNode = async (
  state: typeof proposalGeneratorState.State,
  options: LangGraphRunnableConfig,
) => {
  const signalId = options.configurable?.signalId;
  if (!signalId) {
    throw new Error("signalId is missing in config");
  }
  const userId = options.configurable?.userId;
  if (!userId) {
    throw new Error("userId is missing in config");
  }

  const { signal, user, tokenPrices, latestTweets, userBalance } = state;

  if (!signal || !user || !tokenPrices || !latestTweets || !userBalance) {
    throw new Error("Required data (signal, user, tokenPrices, latestTweets, userBalance) is missing in state.");
  }

  const inputText = `
Data for proposal generation:
User ID: ${userId}

Signal Details:
${JSON.stringify(signal, null, 2)}

User Profile:
${JSON.stringify(user, null, 2)}

Token Prices:
${JSON.stringify(tokenPrices, null, 2)}

Latest Tweets:
${JSON.stringify(latestTweets, null, 2)}

User Balance:
${JSON.stringify(userBalance, null, 2)}
`;

  // 提案生成チェーンを実行
  const result = await proposalGenerationChain.invoke({
    messages: [new HumanMessage(inputText)],
  });

  if (!result.proposal) {
    throw new Error("Failed to generate proposal.");
  }

  return {
    proposal: result.proposal,
  };
};
