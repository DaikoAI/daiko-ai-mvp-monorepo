import { RunnableSequence } from "@langchain/core/runnables";
import { gpt4o } from "../utils/model";
import type { solanaAgentState } from "../utils/state";
import { prompt, parser } from "../prompts/manager";

const chain = RunnableSequence.from([prompt, gpt4o, parser]);

export const managerNode = async (state: typeof solanaAgentState.State) => {
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
