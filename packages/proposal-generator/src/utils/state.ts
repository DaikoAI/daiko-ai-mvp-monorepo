import type {
  ProposalInsert,
  SignalSelect,
  TokenPriceSelect,
  TweetSelect,
  UserBalanceSelect,
  UserSelect,
} from "@daiko-ai/shared";
import type { BaseMessage } from "@langchain/core/messages";
import { Annotation, MemorySaver, messagesStateReducer } from "@langchain/langgraph";

export const memory = new MemorySaver();

export const proposalGeneratorState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),

  user: Annotation<UserSelect | null>({
    reducer: (oldValue, newValue) => newValue ?? oldValue,
    default: () => null,
  }),

  // シグナル情報
  signal: Annotation<SignalSelect | null>({
    reducer: (oldValue, newValue) => newValue ?? oldValue,
    default: () => null,
  }),

  tokenPrices: Annotation<TokenPriceSelect[] | null>({
    reducer: (oldValue, newValue) => newValue ?? oldValue,
    default: () => null,
  }),

  latestTweets: Annotation<TweetSelect[] | null>({
    reducer: (oldValue, newValue) => newValue ?? oldValue,
    default: () => null,
  }),

  userBalance: Annotation<UserBalanceSelect | null>({
    reducer: (oldValue, newValue) => newValue ?? oldValue,
    default: () => null,
  }),

  proposal: Annotation<ProposalInsert | null>({
    reducer: (oldValue, newValue) => newValue ?? oldValue,
    default: () => null,
  }),
});
