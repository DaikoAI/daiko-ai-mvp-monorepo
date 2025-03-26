import { Annotation, MemorySaver } from "@langchain/langgraph";
import type { BaseMessage } from "@langchain/core/messages";
import { messagesStateReducer } from "@langchain/langgraph";
import type { UserProfile } from "../types/db";

export const memory = new MemorySaver();

export const solanaAgentState = Annotation.Root({
    messages: Annotation<BaseMessage[]>({
        reducer: messagesStateReducer,
        default: () => [],
    }),

    userProfile: Annotation<UserProfile | null>({
        reducer: (oldValue, newValue) => newValue ?? oldValue,
        default: () => null,
    }),

    isDataFetchOperatorNodeQuery: Annotation<boolean>({
        reducer: (oldValue, newValue) => newValue ?? oldValue,
        default: () => false,
    }),

    isGeneralQuery: Annotation<boolean>({
        reducer: (oldValue, newValue) => newValue ?? oldValue,
        default: () => false,
    }),
});
