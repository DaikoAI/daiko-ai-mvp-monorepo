import type {
  NewsSiteSelect,
  PortfolioSnapshot,
  ProposalSelect,
  SignalSelect,
  TokenPriceSelect,
  TweetSelect,
  UserSelect,
} from "@daiko-ai/shared";
import type { BaseMessage } from "@langchain/core/messages";
import { Annotation, MemorySaver, messagesStateReducer } from "@langchain/langgraph";

// dbData の型定義 (dataFetchNode の戻り値に基づく)
export interface DbData {
  marketData: TokenPriceSelect[];
  tweets: TweetSelect[];
  news: NewsSiteSelect[];
  portfolio: PortfolioSnapshot | undefined;
}

export const memory = new MemorySaver();

export const proposalGeneratorState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),

  // シグナル情報
  signalData: Annotation<SignalSelect | null>({
    reducer: (oldValue, newValue) => newValue ?? oldValue,
    default: () => null,
  }),

  dbData: Annotation<DbData | null>({
    reducer: (oldValue, newValue) => newValue ?? oldValue,
    default: () => null,
  }),

  proposal: Annotation<ProposalSelect | null>({
    reducer: (oldValue, newValue) => newValue ?? oldValue,
    default: () => null,
  }),

  user: Annotation<UserSelect | null>({
    reducer: (oldValue, newValue) => newValue ?? oldValue,
    default: () => null,
  }),
});
