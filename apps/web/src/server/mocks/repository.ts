import type {
  ChatMessage,
  ProposalSelect,
  TokenSelect,
  TransactionSelect,
  UserBalanceSelect,
  UserSelect,
} from "@daiko-ai/shared";
import {
  mockBalances,
  mockMessages,
  mockProposals,
  mockThreads,
  mockTokenPrices,
  mockTokens,
  mockTransactions,
  mockUser,
} from "./data";
type ChatThread = { id: string; userId: string; title: string; createdAt: Date; updatedAt: Date };

export type MockRepo = {
  getUserByWallet(wallet: string): Promise<UserSelect | null>;
  ensureUser(wallet: string): Promise<UserSelect>;
  getUserBalances(userId: string): Promise<(UserBalanceSelect & { token: TokenSelect })[]>;
  getAllTokens(): Promise<TokenSelect[]>;
  getTokenBySymbol(symbol: string): Promise<TokenSelect | null>;
  getTokenByAddress(address: string): Promise<TokenSelect | null>;
  getTokenPrices(
    addresses?: string[],
  ): Promise<Array<{ token: TokenSelect; tokenAddress: string; priceUsd: string; lastUpdated: Date }>>;
  getProposals(userId: string, now: Date): Promise<ProposalSelect[]>;
  createProposal(input: Omit<ProposalSelect, "id" | "createdAt" | "updatedAt">): Promise<void>;
  getTransactions(userId: string): Promise<TransactionSelect[]>;
  getTransactionById(id: string): Promise<TransactionSelect | null>;
  createTransaction(tx: Omit<TransactionSelect, "id" | "createdAt" | "updatedAt">): Promise<TransactionSelect>;
  updateUserBalance(userId: string, tokenAddress: string, newBalance: string): Promise<void>;
  upsertBalance(userId: string, tokenAddress: string, balance: string): Promise<void>;
  updateUserPartial(userId: string, partial: Partial<UserSelect>): Promise<UserSelect | null>;
  // chat
  listThreads(userId: string): Promise<Array<Pick<ChatThread, "id" | "title" | "createdAt" | "updatedAt">>>;
  getThread(userId: string, threadId: string): Promise<ChatThread | null>;
  createThread(userId: string, title: string): Promise<ChatThread>;
  updateThread(userId: string, threadId: string, title: string): Promise<ChatThread | null>;
  listMessages(threadId: string, limit: number): Promise<ChatMessage[]>;
  createMessage(msg: ChatMessage): Promise<ChatMessage>;
  // collectibles (NFT-like)
  getNfts(
    userId: string,
  ): Promise<Array<{ id: string; name: string; image_url: string; collection: { name: string } }>>;
};

export function createMockRepo(): MockRepo {
  // In-memory state
  const users: UserSelect[] = [mockUser];
  const tokens: TokenSelect[] = mockTokens;
  const balances: (UserBalanceSelect & { token?: TokenSelect })[] = mockBalances.map((b) => ({
    ...b,
  }));
  const proposals: ProposalSelect[] = mockProposals;
  const transactions: TransactionSelect[] = [...mockTransactions];
  const threads: ChatThread[] = [...mockThreads];
  const messages: ChatMessage[] = [...mockMessages];
  const nftsByUser = new Map<
    string,
    Array<{ id: string; name: string; image_url: string; collection: { name: string } }>
  >();

  function seedAllTokenBalancesFor(userId: string, defaultAmount: string): void {
    const existing = new Set(balances.filter((b) => b.userId === userId).map((b) => b.tokenAddress));
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i]!;
      if (existing.has(t.address)) continue;
      const bal: UserBalanceSelect = {
        id: `bal-${userId}-${i}`,
        userId,
        tokenAddress: t.address,
        balance: defaultAmount,
        updatedAt: new Date(),
      };
      balances.push(bal);
    }
  }

  // Ensure the default mock user has balances for all tokens
  seedAllTokenBalancesFor(mockUser.id, "10");
  // Seed default collectibles for mock user
  nftsByUser.set(mockUser.id, [
    { id: "nft-1", name: "Mock Collectible #1", image_url: "/tokens/SOL.png", collection: { name: "Demo" } },
    { id: "nft-2", name: "Mock Collectible #2", image_url: "/tokens/USDC.png", collection: { name: "Demo" } },
  ]);

  return {
    async getUserByWallet(wallet) {
      return users.find((u) => u.walletAddress === wallet) ?? null;
    },
    async ensureUser(wallet) {
      const existing = users.find((u) => u.walletAddress === wallet);
      if (existing) return existing;
      const nu: UserSelect = { ...mockUser, id: `user-${Date.now()}`, walletAddress: wallet };
      users.push(nu);
      // Seed balances for all tokens for the new user
      seedAllTokenBalancesFor(nu.id, "10");
      // Seed some collectibles for the new user
      nftsByUser.set(nu.id, [
        {
          id: `nft-${nu.id}-1`,
          name: "Mock Collectible A",
          image_url: "/tokens/WIF.png",
          collection: { name: "Demo" },
        },
        {
          id: `nft-${nu.id}-2`,
          name: "Mock Collectible B",
          image_url: "/tokens/BONK.png",
          collection: { name: "Demo" },
        },
      ]);
      return nu;
    },
    async getUserBalances(userId) {
      return balances
        .filter((b) => b.userId === userId)
        .map((b) => ({ ...b, token: tokens.find((t) => t.address === b.tokenAddress)! }));
    },
    async getAllTokens() {
      // Return a copy to avoid accidental mutation
      return [...tokens];
    },
    async getTokenBySymbol(symbol) {
      return tokens.find((t) => t.symbol === symbol) ?? null;
    },
    async getTokenByAddress(address) {
      return tokens.find((t) => t.address === address) ?? null;
    },
    async getTokenPrices(addresses) {
      const addrs = addresses && addresses.length > 0 ? addresses : tokens.map((t) => t.address);
      return addrs.map((addr) => {
        const token = tokens.find((t) => t.address === addr)!;
        return {
          token,
          tokenAddress: addr,
          priceUsd: mockTokenPrices.get(addr) ?? "0",
          lastUpdated: new Date(),
        };
      });
    },
    async getProposals(userId, now) {
      const base = proposals.filter((p) => p.expiresAt > now);
      // Rebind proposals to the requesting user to ensure data is returned for any session user
      return base.map((p) => ({ ...p, userId })).sort((a, b) => a.expiresAt.getTime() - b.expiresAt.getTime());
    },
    async createProposal(input) {
      proposals.push({ ...input, id: `prop-${Date.now()}`, createdAt: new Date(), updatedAt: new Date() });
    },
    async getTransactions(userId) {
      return transactions
        .filter((t) => t.userId === userId)
        .sort((a, b) => (b.createdAt ? b.createdAt.getTime() : 0) - (a.createdAt ? a.createdAt.getTime() : 0));
    },
    async getTransactionById(id) {
      return transactions.find((t) => t.id === id) ?? null;
    },
    async createTransaction(tx) {
      const created: TransactionSelect = {
        id: `tx-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...tx,
      } as TransactionSelect;
      transactions.push(created);
      return created;
    },
    async updateUserBalance(userId, tokenAddress, newBalance) {
      const b = balances.find((b) => b.userId === userId && b.tokenAddress === tokenAddress);
      if (b) {
        b.balance = newBalance;
        b.updatedAt = new Date();
      }
    },
    async upsertBalance(userId, tokenAddress, balance) {
      const existing = balances.find((b) => b.userId === userId && b.tokenAddress === tokenAddress);
      if (existing) {
        existing.balance = balance;
        existing.updatedAt = new Date();
        return;
      }
      balances.push({
        id: `bal-${Date.now()}`,
        userId,
        tokenAddress,
        balance,
        updatedAt: new Date(),
      } as UserBalanceSelect);
    },
    async updateUserPartial(userId, partial) {
      const u = users.find((u) => u.id === userId);
      if (!u) return null;
      Object.assign(u, partial);
      // No updatedAt on users schema type; skip touching it
      return u;
    },
    async listThreads(userId) {
      return threads
        .filter((t) => t.userId === userId)
        .map((t) => ({ id: t.id, title: t.title, createdAt: t.createdAt, updatedAt: t.updatedAt }))
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    },
    async getThread(userId, threadId) {
      const t = threads.find((t) => t.id === threadId && t.userId === userId);
      return t ?? null;
    },
    async createThread(userId, title) {
      const t: ChatThread = {
        id: `thread-${Date.now()}`,
        userId,
        title,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      threads.push(t);
      return t;
    },
    async updateThread(userId, threadId, title) {
      const t = threads.find((t) => t.id === threadId && t.userId === userId);
      if (!t) return null;
      t.title = title;
      t.updatedAt = new Date();
      return t;
    },
    async listMessages(threadId, limit) {
      return messages
        .filter((m) => m.threadId === threadId)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        .slice(0, limit);
    },
    async createMessage(msg) {
      messages.push({ ...msg, createdAt: new Date() });
      return msg;
    },
    async getNfts(userId) {
      return nftsByUser.get(userId) ?? [];
    },
  };
}

export const mockRepo = createMockRepo();
