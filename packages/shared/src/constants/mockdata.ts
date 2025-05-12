import type { SignalSelect, TokenPriceSelect, TweetSelect, UserBalanceSelect, UserSelect } from "../db/schema";

export const mockUser: UserSelect = {
  id: "user-test",
  name: "Test User",
  email: "test@example.com",
  emailVerified: new Date("2023-01-01T00:00:00Z"),
  age: 30,
  image: null,
  tradeStyle: "Test Style",
  totalAssetUsd: 100000,
  cryptoInvestmentUsd: 50000,
  walletAddress: "0xTestWalletAddress",
  riskTolerance: "medium",
  notificationEnabled: false,
};

const now = new Date();

export const mockSignal: SignalSelect = {
  id: "signal-test",
  tokenAddress: "So11111111111111111111111111111111111111112",
  detectedAt: now,
  sources: [
    { label: "Source Test", url: "https://example.com" },
    { label: "Source Test 2", url: "https://example.com/2" },
  ],
  sentimentType: "positive",
  suggestionType: "buy",
  confidence: 0.9,
  rationaleSummary: "This is a test rationale summary.",
  expiresAt: new Date(now.getTime() + 1000 * 60 * 60), // 1 hour from now
  createdAt: now,
  updatedAt: now,
};

export const mockTokenPrices: TokenPriceSelect[] = [
  {
    id: "06db8bbf-a32d-41a7-98c1-581d3a5730cb",
    tokenAddress: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
    priceUsd: "0.525385",
    lastUpdated: new Date("2025-05-12T18:50:02.570Z"),
    source: "jupiter",
  },
  {
    id: "1feb6702-f8cd-465e-8c36-a26145fbc791",
    tokenAddress: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
    priceUsd: "2.842472",
    lastUpdated: new Date("2025-05-12T18:50:02.570Z"),
    source: "jupiter",
  },
  {
    id: "3c95399f-e7d4-49e0-9799-0bbeaf500b9b",
    tokenAddress: "GJAFwWjJ3vnTsrQVabjBVK2TYB1YtRCQXRDfDgUnpump",
    priceUsd: "0.071346",
    lastUpdated: new Date("2025-05-12T18:50:02.570Z"),
    source: "jupiter",
  },
  {
    id: "44d0f878-2396-4ce0-9fc7-133ee21ccbf8",
    tokenAddress: "85VBFQZC9TZkfaptBWjvUw7YbZjy52A6mjtPGjstQAmQ",
    priceUsd: "0.099817",
    lastUpdated: new Date("2025-05-12T18:50:02.570Z"),
    source: "jupiter",
  },
  {
    id: "473b4d40-efd5-4bbc-b02b-7649fb43231b",
    tokenAddress: "HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3",
    priceUsd: "0.175522",
    lastUpdated: new Date("2025-05-12T18:50:02.570Z"),
    source: "jupiter",
  },
  {
    id: "4a5a6d29-01de-44d7-a6b5-f389affa8452",
    tokenAddress: "So11111111111111111111111111111111111111112",
    priceUsd: "168.483347500",
    lastUpdated: new Date("2025-05-12T18:50:02.570Z"),
    source: "jupiter",
  },
  {
    id: "50d3eac6-e37c-45da-b426-22441e960a6b",
    tokenAddress: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    priceUsd: "0.0000210564",
    lastUpdated: new Date("2025-05-12T18:50:02.570Z"),
    source: "jupiter",
  },
  {
    id: "54cfbaa4-9cca-41c5-b768-3d87152aa726",
    tokenAddress: "jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL",
    priceUsd: "1.946704124",
    lastUpdated: new Date("2025-05-12T18:50:02.570Z"),
    source: "jupiter",
  },
  {
    id: "688456b4-1880-4714-95c0-82fe35de9cfb",
    tokenAddress: "orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE",
    priceUsd: "2.763237",
    lastUpdated: new Date("2025-05-12T18:50:02.570Z"),
    source: "jupiter",
  },
  {
    id: "7fb88f1f-ec98-4741-8cfb-1eb531cf4fa2",
    tokenAddress: "bioJ9JTqW62MLz7UKHU69gtKhPpGi1BQhccj2kmSvUJ",
    priceUsd: "0.082395925",
    lastUpdated: new Date("2025-05-12T18:50:02.570Z"),
    source: "jupiter",
  },
  {
    id: "82738b56-143c-437b-b99e-ccf0e90d8d6e",
    tokenAddress: "7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr",
    priceUsd: "0.507150620",
    lastUpdated: new Date("2025-05-12T18:50:02.570Z"),
    source: "jupiter",
  },
  {
    id: "82749b2a-58c6-4040-a56a-67fe0aa57a9b",
    tokenAddress: "5oVNBeEEQvYi1cX3ir8Dx5n1P7pdxydbGF2X4TxVusJm",
    priceUsd: "222.125992132",
    lastUpdated: new Date("2025-05-12T18:50:02.570Z"),
    source: "jupiter",
  },
  {
    id: "9e7cebd7-46d2-4d99-a9e6-d287e33faa0f",
    tokenAddress: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
    priceUsd: "1.072595",
    lastUpdated: new Date("2025-05-12T18:50:02.570Z"),
    source: "jupiter",
  },
  {
    id: "acf2f60a-7460-4b49-a471-93150769bdd4",
    tokenAddress: "6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN",
    priceUsd: "12.190184",
    lastUpdated: new Date("2025-05-12T18:50:02.570Z"),
    source: "jupiter",
  },
  {
    id: "afe0f7e1-bf00-41ed-a965-b1cdac507990",
    tokenAddress: "MEW1gQWJ3nEXg2qgERiKu7FAFj79PHvQVREQUzScPP5",
    priceUsd: "0.00370089",
    lastUpdated: new Date("2025-05-12T18:50:02.570Z"),
    source: "jupiter",
  },
  {
    id: "b8327e5e-6285-4d80-abdc-434206dc38f7",
    tokenAddress: "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn",
    priceUsd: "202.409103570",
    lastUpdated: new Date("2025-05-12T18:50:02.570Z"),
    source: "jupiter",
  },
  {
    id: "bb21e0fa-3ca1-43dc-aa5f-9baa398ce0d9",
    tokenAddress: "hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux",
    priceUsd: "3.80758947",
    lastUpdated: new Date("2025-05-12T18:50:02.570Z"),
    source: "jupiter",
  },
  {
    id: "bb4e40e6-f8f6-4c88-b126-d36df29ca813",
    tokenAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    priceUsd: "0.999720",
    lastUpdated: new Date("2025-05-12T18:50:02.570Z"),
    source: "jupiter",
  },
  {
    id: "bfb3f534-7290-411d-9c5e-02677838eee5",
    tokenAddress: "ZEUS1aR7aX8DFFJf5QjWj2ftDDdNTroMNGo8YoQm3Gq",
    priceUsd: "0.272306",
    lastUpdated: new Date("2025-05-12T18:50:02.570Z"),
    source: "jupiter",
  },
  {
    id: "c385f261-8d17-4183-b54f-c9d633e0729a",
    tokenAddress: "14zP2ToQ79XWvc7FQpm4bRnp9d6Mp1rFfsUW3gpLcRX",
    priceUsd: "0.20265904",
    lastUpdated: new Date("2025-05-12T18:50:02.570Z"),
    source: "jupiter",
  },
  {
    id: "d145ef71-9c3e-4c06-8c58-cc4fe6bcfa02",
    tokenAddress: "LAYER4xPpTCb3QL8S9u41EAhAX7mhBn8Q6xMTwY2Yzc",
    priceUsd: "1.109246157",
    lastUpdated: new Date("2025-05-12T18:50:02.570Z"),
    source: "jupiter",
  },
  {
    id: "d8d08adc-70b1-4bad-ab0a-6b8bc4e6b277",
    tokenAddress: "KMNo3nJsBXfcpJTVhZcXLW7RmTwTt4GVFE7suUBo9sS",
    priceUsd: "0.072279",
    lastUpdated: new Date("2025-05-12T18:50:02.570Z"),
    source: "jupiter",
  },
  {
    id: "d92b70e7-d9f6-47ad-af00-79fd1a8dd35e",
    tokenAddress: "9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E",
    priceUsd: "4088.797343",
    lastUpdated: new Date("2025-05-12T18:50:02.570Z"),
    source: "jupiter",
  },
  {
    id: "d97aa29f-530b-4d42-a2a8-9fa8981c4223",
    tokenAddress: "9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump",
    priceUsd: "1.285833",
    lastUpdated: new Date("2025-05-12T18:50:02.570Z"),
    source: "jupiter",
  },
  {
    id: "fe28d30f-eca7-4bf9-8312-1470f9d1a5a0",
    tokenAddress: "jupSoLaHXQiZZTSfEWMTRRgpnyFm8f6sZdosWBjx93v",
    priceUsd: "186.569207456",
    lastUpdated: new Date("2025-05-12T18:50:02.570Z"),
    source: "jupiter",
  },
];

export const mockTweets: TweetSelect[] = [
  {
    id: "tweet1",
    authorId: "author1",
    url: "https://twitter.com/test/status/1",
    content: "Test tweet content 1",
    retweetCount: 10,
    replyCount: 5,
    likeCount: 20,
    tweetTime: new Date("2023-01-01T04:00:00Z"),
    metadata: {} as any,
    createdAt: new Date("2023-01-01T04:00:00Z"),
    updatedAt: new Date("2023-01-01T04:00:00Z"),
  },
  {
    id: "tweet2",
    authorId: "author2",
    url: "https://twitter.com/test/status/2",
    content: "Test tweet content 2",
    retweetCount: 2,
    replyCount: 1,
    likeCount: 5,
    tweetTime: new Date("2023-01-01T05:00:00Z"),
    metadata: {} as any,
    createdAt: new Date("2023-01-01T05:00:00Z"),
    updatedAt: new Date("2023-01-01T05:00:00Z"),
  },
];

export const mockUserBalances: UserBalanceSelect[] = [
  {
    id: "ub1",
    userId: "user-test",
    tokenAddress: "So11111111111111111111111111111111111111112", // SOL
    balance: "2000", // From defaultUsdBalances
    updatedAt: new Date("2023-01-01T06:00:00Z"),
  },
  {
    id: "ub2",
    userId: "user-test",
    tokenAddress: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN", // JUP
    balance: "1000",
    updatedAt: new Date("2023-01-01T06:00:00Z"),
  },
  {
    id: "ub3",
    userId: "user-test",
    tokenAddress: "jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL", // JTO
    balance: "1000",
    updatedAt: new Date("2023-01-01T06:00:00Z"),
  },
  {
    id: "ub4",
    userId: "user-test",
    tokenAddress: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R", // RAY
    balance: "1000",
    updatedAt: new Date("2023-01-01T06:00:00Z"),
  },
  {
    id: "ub5",
    userId: "user-test",
    tokenAddress: "hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux", // HNT
    balance: "1000",
    updatedAt: new Date("2023-01-01T06:00:00Z"),
  },
  {
    id: "ub6",
    userId: "user-test",
    tokenAddress: "HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3", // PYTH
    balance: "1000",
    updatedAt: new Date("2023-01-01T06:00:00Z"),
  },
  {
    id: "ub7",
    userId: "user-test",
    tokenAddress: "6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN", // TRUMP
    balance: "1000",
    updatedAt: new Date("2023-01-01T06:00:00Z"),
  },
  {
    id: "ub8",
    userId: "user-test",
    tokenAddress: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm", // WIF
    balance: "1000",
    updatedAt: new Date("2023-01-01T06:00:00Z"),
  },
  {
    id: "ub9",
    userId: "user-test",
    tokenAddress: "85VBFQZC9TZkfaptBWjvUw7YbZjy52A6mjtPGjstQAmQ", // W
    balance: "1000",
    updatedAt: new Date("2023-01-01T06:00:00Z"),
  },
  {
    id: "ub10",
    userId: "user-test",
    tokenAddress: "MEW1gQWJ3nEXg2qgERiKu7FAFj79PHvQVREQUzScPP5", // MEW
    balance: "1000",
    updatedAt: new Date("2023-01-01T06:00:00Z"),
  },
  {
    id: "ub11",
    userId: "user-test",
    tokenAddress: "7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr", // POPCAT
    balance: "1000",
    updatedAt: new Date("2023-01-01T06:00:00Z"),
  },
  {
    id: "ub12",
    userId: "user-test",
    tokenAddress: "orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE", // ORCA
    balance: "1000",
    updatedAt: new Date("2023-01-01T06:00:00Z"),
  },
  {
    id: "ub13",
    userId: "user-test",
    tokenAddress: "ZEUS1aR7aX8DFFJf5QjWj2ftDDdNTroMNGo8YoQm3Gq", // ZEUS
    balance: "1000",
    updatedAt: new Date("2023-01-01T06:00:00Z"),
  },
  {
    id: "ub14",
    userId: "user-test",
    tokenAddress: "KMNo3nJsBXfcpJTVhZcXLW7RmTwTt4GVFE7suUBo9sS", // KMNO
    balance: "1000",
    updatedAt: new Date("2023-01-01T06:00:00Z"),
  },
  {
    id: "ub15",
    userId: "user-test",
    tokenAddress: "9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E", // WBTC
    balance: "2000",
    updatedAt: new Date("2023-01-01T06:00:00Z"),
  },
  {
    id: "ub16",
    userId: "user-test",
    tokenAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
    balance: "2000",
    updatedAt: new Date("2023-01-01T06:00:00Z"),
  },
  {
    id: "ub17",
    userId: "user-test",
    tokenAddress: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263", // BONK
    balance: "1000",
    updatedAt: new Date("2023-01-01T06:00:00Z"),
  },
  // Note: WSUI is in defaultUsdBalances but not in tokens array. Skipping.
  {
    id: "ub18",
    userId: "user-test",
    tokenAddress: "bioJ9JTqW62MLz7UKHU69gtKhPpGi1BQhccj2kmSvUJ", // BIO
    balance: "1000",
    updatedAt: new Date("2023-01-01T06:00:00Z"),
  },
  {
    id: "ub19",
    userId: "user-test",
    tokenAddress: "LAYER4xPpTCb3QL8S9u41EAhAX7mhBn8Q6xMTwY2Yzc", // LAYER
    balance: "1000",
    updatedAt: new Date("2023-01-01T06:00:00Z"),
  },
  {
    id: "ub20",
    userId: "user-test",
    tokenAddress: "14zP2ToQ79XWvc7FQpm4bRnp9d6Mp1rFfsUW3gpLcRX", // AIXBT
    balance: "1000",
    updatedAt: new Date("2023-01-01T06:00:00Z"),
  },
  {
    id: "ub21",
    userId: "user-test",
    tokenAddress: "GJAFwWjJ3vnTsrQVabjBVK2TYB1YtRCQXRDfDgUnpump", // ACT
    balance: "1000",
    updatedAt: new Date("2023-01-01T06:00:00Z"),
  },
];
