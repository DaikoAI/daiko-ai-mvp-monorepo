import { END, START, StateGraph } from "@langchain/langgraph";
import { managerRouter } from "../utils/route";
import { solanaAgentState } from "../utils/state";
import { analyzerNode } from "./analyzer";
import { dataFetchOperatorNode } from "./dataFetchOperator";
import { generalistNode } from "./general";
import { managerNode } from "./manager";
import { onchainNode } from "./onchain";

export async function initProposalAgentGraph(userId: string) {
  try {
    const config = { configurable: { thread_id: userId } };

    const workflow = new StateGraph(solanaAgentState)
      .addNode("generalist", generalistNode)
      .addNode("analyzer", analyzerNode)
      .addNode("onchain", onchainNode)
      .addNode("manager", managerNode)
      .addNode("dataFetchOperator", dataFetchOperatorNode)
      .addEdge(START, "manager")
      .addConditionalEdges("manager", managerRouter)
      .addEdge("dataFetchOperator", "onchain")
      .addEdge("onchain", "analyzer")
      .addEdge("analyzer", END)
      .addEdge("generalist", END);

    const graph = workflow.compile();

    return { agent: graph, config };
  } catch (error) {
    console.error("Failed to initialize agent:", error);
    throw error;
  }
}
