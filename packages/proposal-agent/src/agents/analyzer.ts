import { RunnableSequence } from "@langchain/core/runnables";
import { analyzerPrompt, parser } from "../prompts/analyzer";
import { gpt4oMini } from "../utils/model";
import { type proposalAgentState } from "../utils/state";

const chain = RunnableSequence.from([analyzerPrompt, gpt4oMini, parser]);

export const analyzerNode = async (state: typeof proposalAgentState.State) => {
  const { messages } = state;

  const result = await chain.invoke({
    messages,
    formatInstructions: parser.getFormatInstructions(),
  });
  const { proposal } = result;

  return { proposal };
};
