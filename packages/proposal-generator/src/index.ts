import { END, START, StateGraph } from "@langchain/langgraph";
import { proposalGeneratorState } from "./utils/state";
import { dataFetchNode } from "./nodes/dataFetch";
import { signalValidationNode } from "./nodes/signalValidation";
import { proposalGenerationNode } from "./nodes/proposalGeneration";

export async function initProposalGeneratorGraph(signalId: string) {
  try {
    const config = { configurable: { signalId } };

    const workflow = new StateGraph(proposalGeneratorState)
      // 主要ノード
      .addNode("signalValidationNode", signalValidationNode)
      .addNode("dataFetchNode", dataFetchNode)
      .addNode("proposalGenerationNode", proposalGenerationNode)

      // エッジ定義
      .addEdge(START, "signalValidationNode")
      .addEdge("signalValidationNode", "dataFetchNode")
      .addEdge("dataFetchNode", "proposalGenerationNode")
      .addEdge("proposalGenerationNode", END);

    const graph = workflow.compile();

    return { graph, config };
  } catch (error) {
    console.error("Failed to initialize agent:", error);
    throw error;
  }
}
