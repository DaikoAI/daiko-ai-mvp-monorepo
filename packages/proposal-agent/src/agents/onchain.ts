import type { Tool } from "@langchain/core/tools";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import {} from "solana-agent-kit/dist/langchain";
import { onchainPrompt } from "../prompts/onchain";
import { SolanaGetAllAssetsByOwner } from "../tools/getAllAssetsByOwner";
import { gpt4oMini } from "../utils/model";
import { solanaAgent } from "../utils/solanaAgent";
import { memory, type proposalAgentState } from "../utils/state";

// Initialize tools array
const tools: Tool[] = [new SolanaGetAllAssetsByOwner(solanaAgent)];

export const onchainAgent = createReactAgent({
  llm: gpt4oMini,
  tools,
  checkpointSaver: memory,
  prompt: onchainPrompt,
});

export const onchainNode = async (state: typeof proposalAgentState.State) => {
  const { messages } = state;
  console.log("onchainNode:", messages);

  const result = await onchainAgent.invoke({ messages });
  console.log("onchain result", result);

  return { messages: [...result.messages] };
};
