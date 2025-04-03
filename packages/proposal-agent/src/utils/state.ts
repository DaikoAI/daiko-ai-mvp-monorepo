import type { NewsSiteSelect, ProposalSelect, Tweet, UserSelect } from "@daiko-ai/shared";
import type { BaseMessage } from "@langchain/core/messages";
import { Annotation, MemorySaver, messagesStateReducer } from "@langchain/langgraph";

export const memory = new MemorySaver();

export const proposalAgentState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),

  proposal: Annotation<ProposalSelect | null>({
    reducer: (oldValue, newValue) => newValue ?? oldValue,
    default: () => null,
  }),

  user: Annotation<UserSelect | null>({
    reducer: (oldValue, newValue) => newValue ?? oldValue,
    default: () => null,
  }),

  newsSites: Annotation<NewsSiteSelect[]>({
    reducer: (oldValue, newValue) => newValue ?? oldValue,
    default: () => [],
  }),

  tweets: Annotation<Tweet[]>({
    reducer: (oldValue, newValue) => newValue ?? oldValue,
    default: () => [],
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
