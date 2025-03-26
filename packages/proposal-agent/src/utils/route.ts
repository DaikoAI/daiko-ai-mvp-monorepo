import { END } from "@langchain/langgraph";
import type { proposalAgentState } from "./state";

export const managerRouter = (
  state: typeof proposalAgentState.State,
): "dataFetchOperator" | "generalist" | typeof END => {
  const { isDataFetchOperatorNodeQuery, isGeneralQuery } = state;

  if (isDataFetchOperatorNodeQuery) {
    return "dataFetchOperator";
  }

  if (isGeneralQuery) {
    return "generalist";
  }

  return END;
};
