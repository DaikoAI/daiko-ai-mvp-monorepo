import type { solanaAgentState } from "../utils/state";

// This node is just for connecting other data fetching nodes so that they can be called in parallel
export const dataFetchOperatorNode = async (state: typeof solanaAgentState.State) => {
    console.log("dataFetchOperator", state);

    return state;
};
