import type {
  chatMessagesTable,
  chatThreadsTable,
  ProposalSelect,
  TokenSelect,
  TransactionSelect,
  UserBalanceSelect,
  UserSelect,
} from "@daiko-ai/shared";
import { initialTokens, staticProposals } from "@daiko-ai/shared";

// Basic mock user
export const mockUser: UserSelect = {
  id: "user-mock-1",
  walletAddress: "mock-wallet-1111",
  name: "Mock User",
  email: "mock@example.com",
  age: 30,
  tradeStyle: "swing",
  totalAssetUsd: 0,
  cryptoInvestmentUsd: 0,
  notificationEnabled: false,
  riskTolerance: "medium",
  emailVerified: null,
  image: null,
};

// Tokens
export const mockTokens: TokenSelect[] = initialTokens.map((t) => ({
  ...t,
}));

// Balances
export const mockBalances: UserBalanceSelect[] = [
  {
    id: "bal-1",
    userId: mockUser.id,
    tokenAddress: mockTokens.find((t) => t.symbol === "SOL")?.address ?? mockTokens[0]!.address,
    balance: "0.8",
    updatedAt: new Date(),
  },
  {
    id: "bal-2",
    userId: mockUser.id,
    tokenAddress: mockTokens.find((t) => t.symbol === "USDC")?.address ?? mockTokens[1]!.address,
    balance: "1200",
    updatedAt: new Date(),
  },
];

// Proposals
export const mockProposals: ProposalSelect[] = staticProposals.map((p, idx) => ({
  id: `prop-${idx + 1}`,
  userId: mockUser.id,
  title: p.title,
  summary: p.summary,
  reason: p.reason,
  sources: p.sources,
  type: p.type ?? null,
  proposedBy: p.proposedBy ?? null,
  financialImpact: p.financialImpact ?? null,
  expiresAt: p.expiresAt,
  status: p.status ?? null,
  contractCall: p.contractCall ?? null,
  createdAt: new Date(),
  updatedAt: new Date(),
  triggerEventId: null,
}));

// Transactions
export const mockTransactions: TransactionSelect[] = [
  {
    id: "tx-1",
    userId: mockUser.id,
    transactionType: "swap",
    fromTokenAddress: mockBalances[0]!.tokenAddress,
    toTokenAddress: mockBalances[1]!.tokenAddress,
    amountFrom: "0.5",
    amountTo: "75",
    fee: "0.1",
    details: {},
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
  },
];

// Chat
const MOCK_THREAD_ID = "00000000-0000-4000-8000-000000000001";
export const mockThreads: (typeof chatThreadsTable.$inferSelect)[] = [
  {
    id: MOCK_THREAD_ID,
    userId: mockUser.id,
    title: "Mock Chat",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    updatedAt: new Date(),
  },
];

export const mockMessages: (typeof chatMessagesTable.$inferSelect)[] = [
  {
    id: "msg-1",
    threadId: MOCK_THREAD_ID,
    role: "user",
    parts: [{ type: "text", text: "Hello" }],
    attachments: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 23),
  },
];

// Simple in-memory token prices map (address -> price)
export const mockTokenPrices = new Map<string, string>([
  [mockTokens.find((t) => t.symbol === "SOL")?.address ?? "", "148.98"],
  [mockTokens.find((t) => t.symbol === "USDC")?.address ?? "", "1"],
]);
