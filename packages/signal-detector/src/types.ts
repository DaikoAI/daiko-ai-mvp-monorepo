import type { FormattedTweetForLlm } from "@daiko-ai/shared";

export type KnownTokenType = {
  address: string;
  symbol: string;
  name: string;
};

export type Source = {
  url: string;
  label: string;
};

export type SuggestionType = "buy" | "sell" | "hold" | "close_position" | "stake";

export interface LlmSignalResponse {
  signalDetected: boolean;
  tokenAddress: string;
  sources: Source[];
  sentimentScore: number;
  suggestionType: SuggestionType;
  strength: number | null;
  confidence: number | null;
  reasoning: string;
  relatedTweetIds: string[];
  reasonInvalid?: string;
  impactScore: number | null;
}

export interface DetectorParams {
  formattedTweets: FormattedTweetForLlm[];
  knownTokens: KnownTokenType[];
}
