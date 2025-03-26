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
// import { SolanaGetAllAssetsByOwner } from "../tools/getAllAssetsByOwner";
// import { solanaAgent } from "../utils/solanaAgent";
import { analyzerPrompt } from "../prompts/analyzer";

// Initialize tools array
const tools: Tool[] = [
    // new SolanaGetAllAssetsByOwner(solanaAgent),
    // new SolanaAlloraGetPriceInference(solanaAgent),
    // new SolanaFetchTokenReportSummaryTool(solanaAgent),
    // new SolanaFetchPriceTool(solanaAgent),
    // new SolanaTokenDataByTickerTool(solanaAgent),
    // new SolanaOrcaFetchPositions(solanaAgent),
];

export const analyzerAgent = createReactAgent({
    llm: gpt4oMini,
    tools,
    checkpointSaver: memory,
    prompt: analyzerPrompt,
});

export const analyzerNode = async (state: typeof solanaAgentState.State) => {
    console.log("analyzerNode", state);
    const { messages, userProfile } = state;

    const result = await analyzerAgent.invoke({ messages });
    console.log("analyzer result", result);

    return { messages: [...result.messages] };
};
