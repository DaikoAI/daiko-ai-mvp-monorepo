import { RunnableSequence } from "@langchain/core/runnables";
import { parser, prompt } from "../prompts/manager";
import { gpt4o } from "../utils/model";
import type { proposalAgentState } from "../utils/state";

const chain = RunnableSequence.from([prompt, gpt4o, parser]);

export const managerNode = async (state: typeof proposalAgentState.State) => {
  const { messages } = state;

  const result = await chain.invoke({
    formatInstructions: parser.getFormatInstructions(),
    messages: messages,
  });

  const { isDataFetchOperatorNodeQuery, isGeneralQuery } = result;

  return {
    isDataFetchOperatorNodeQuery,
    isGeneralQuery,
  };
};
