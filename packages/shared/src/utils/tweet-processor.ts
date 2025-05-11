import type { TweetSelect } from "../db/schema"; // Adjust if TweetSelect path is different
// import { TWEET_SIGNAL_FILTER_STOP_WORDS } from "../constants/stop-words"; // Removed as per user request

const MIN_TWEET_LENGTH = 15; // Minimum character length for a tweet to be considered relevant

// Regex to identify common crypto-related keywords, cashtags, and addresses.
// This helps in filtering out tweets that are unlikely to contain market signals.
const CRYPTO_KEYWORD_REGEX = new RegExp(
  [
    "\\$[A-Za-z0-9_]+", // Cashtags (e.g., $BTC, $ETH)
    "0x[a-fA-F0-9]{40}", // Ethereum addresses
    "0x[a-fA-F0-9]{64}", // Transaction hashes or other long hex identifiers (e.g., Solana addresses)
    // English Keywords
    "buy",
    "sell",
    "trade",
    "trading",
    "bought",
    "sold",
    "airdrop",
    "whitelist",
    "presale",
    "ido",
    "ieo",
    "launch",
    "launchpad",
    "partnership",
    "partnered",
    "collaboration",
    "integrated",
    "mainnet",
    "testnet",
    "devnet",
    "tokenomics",
    "whitepaper",
    "roadmap",
    "announcement",
    "listed",
    "listing",
    "delist",
    "burn",
    "mint",
    "stake",
    "staking",
    "unstake",
    "yield",
    "farming",
    "rewards",
    "apr",
    "apy",
    "exploit",
    "hack",
    "hacked",
    "vulnerability",
    "rug pull",
    "scam",
    "upgrade",
    "update",
    "release",
    "version",
    "protocol",
    "platform",
    "ecosystem",
    "network",
    "dao",
    "governance",
    "proposal",
    "vote",
    "nft",
    "metaverse",
    "gamefi",
    "playtoearn",
    "p2e",
    "bullish",
    "bearish", // Keep these as they are strong sentiment indicators when combined with other context
    "pump",
    "dump", // Strong market action indicators
    "ath",
    "atl",
    "long",
    "short", // Trading positions
    "liquidity",
    "lp",
  ].join("|"),
  "i", // Case-insensitive
);

export interface FormattedTweetForLlm {
  id: string;
  text: string;
  author: string; // authorId from TweetSelect
  time: string; // ISO string format
  url: string;
}

/**
 * Filters an array of tweets to include only those deemed potentially relevant for signal detection.
 * @param tweets - An array of TweetSelect objects.
 * @returns An array of relevant TweetSelect objects.
 */
export function filterRelevantTweets(tweets: TweetSelect[]): TweetSelect[] {
  if (!tweets || tweets.length === 0) {
    return [];
  }

  return tweets.filter((tweet) => {
    const content = tweet.content;
    if (!content) return false;

    // 1. Filter out very short tweets
    if (content.length < MIN_TWEET_LENGTH) {
      // logger.debug(`Filtering out short tweet (ID: ${tweet.id}): "${content}"`);
      return false;
    }

    // 2. Stop word filtering removed as per user request
    // const words = content.toLowerCase().match(/\b(\w+)\b/g) || []; // Get whole words
    // const nonStopWords = words.filter(
    //   (word) => !TWEET_SIGNAL_FILTER_STOP_WORDS.includes(word)
    // );
    // if (nonStopWords.length === 0) {
    //   // logger.debug(`Filtering out stop-word-only tweet (ID: ${tweet.id}): "${content}"`);
    //   return false;
    // }

    // 3. Filter out tweets that don't contain any URLs in their content (external links)
    //    OR don't contain any relevant crypto keywords/cashtags/addresses.
    //    A tweet is kept if it has an external link OR crypto-specific terms.
    const contentHasExternalLink = /https?:\/\/[^\s]+/g.test(content);
    const hasCryptoKeywords = CRYPTO_KEYWORD_REGEX.test(content);

    // If a tweet has neither external links in its body nor crypto-specific keywords, filter it out.
    // We assume tweet.url is the direct link to the tweet itself and not an external link.
    if (!contentHasExternalLink && !hasCryptoKeywords) {
      // logger.debug(`Filtering out tweet (no external link or crypto keywords) (ID: ${tweet.id}): "${content}"`);
      return false;
    }

    // Potentially add more sophisticated filtering:
    // - Language detection and filtering (if focusing on specific languages)
    // - User blocklists or trust scores (if available)
    // - Regex for common spam patterns

    return true; // Tweet passes all filters
  });
}

/**
 * Formats an array of tweets into a structure suitable for LLM processing.
 * @param tweets - An array of TweetSelect objects, assumed to be already filtered.
 * @returns An array of FormattedTweetForLlm objects.
 */
export function formatTweetsForLlm(tweets: TweetSelect[]): FormattedTweetForLlm[] {
  if (!tweets || tweets.length === 0) {
    return [];
  }
  return tweets.map((t) => {
    // Ensure essential fields are present
    const id = String(t.id); // Ensure ID is a string
    const authorId = String(t.authorId); // Ensure authorId is a string
    const textContent = t.content ?? "";
    const tweetTime = t.tweetTime ? new Date(t.tweetTime).toISOString() : new Date().toISOString();
    // Construct a default URL if not provided, though `t.url` should ideally be the direct link.
    const url = t.url ?? `https://x.com/${authorId}/status/${id}`;

    return {
      id,
      text: textContent,
      author: authorId,
      time: tweetTime,
      url,
    };
  });
}
