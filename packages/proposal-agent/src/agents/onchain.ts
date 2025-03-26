import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { gpt4oMini } from "../utils/model";
import { memory, type solanaAgentState } from "../utils/state";
import type { Tool } from "@langchain/core/tools";
import {
    // SolanaAlloraGetPriceInference,
    // SolanaFetchTokenReportSummaryTool,
    // SolanaFetchPriceTool,
    // SolanaTokenDataByTickerTool,
    // SolanaOrcaFetchPositions,
} from "solana-agent-kit/dist/langchain";
import { SolanaGetAllAssetsByOwner } from "../tools/getAllAssetsByOwner";
import { solanaAgent } from "../utils/solanaAgent";
import { onchainPrompt } from "../prompts/onchain";

// Initialize tools array
const tools: Tool[] = [
    new SolanaGetAllAssetsByOwner(solanaAgent),
    // new SolanaAlloraGetPriceInference(solanaAgent),
    // new SolanaFetchTokenReportSummaryTool(solanaAgent),
    // new SolanaFetchPriceTool(solanaAgent),
    // new SolanaTokenDataByTickerTool(solanaAgent),
    // new SolanaOrcaFetchPositions(solanaAgent),
];

export const onchainAgent = createReactAgent({
    llm: gpt4oMini,
    tools,
    checkpointSaver: memory,
    prompt: onchainPrompt,
});

export const onchainNode = async (state: typeof solanaAgentState.State) => {
    const { messages } = state;
    console.log("onchainNode:", messages);

    const result = await onchainAgent.invoke({ messages });
    console.log("onchain result", result);

    return { messages: [...result.messages] };
};
