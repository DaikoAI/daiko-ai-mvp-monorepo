import type { solanaAgentState } from "./state";
import { END } from "@langchain/langgraph";

export const managerRouter = (
    state: typeof solanaAgentState.State,
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
