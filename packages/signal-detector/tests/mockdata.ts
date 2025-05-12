import { FormattedTweetForLlm, initialTokens, mockTweets } from "@daiko-ai/shared";
import type { KnownTokenType } from "../src/types";

export const mockTweetsForDetector: FormattedTweetForLlm[] = mockTweets.map((tweet) => ({
  text: tweet.content,
  author: tweet.authorId,
  time: tweet.tweetTime.toISOString(),
  id: tweet.id,
  url: tweet.url,
}));

export const mockKnownTokens: KnownTokenType[] = initialTokens.map((token) => ({
  address: token.address,
  symbol: token.symbol,
  name: token.name,
  decimals: token.decimals,
  iconUrl: token.iconUrl,
}));
