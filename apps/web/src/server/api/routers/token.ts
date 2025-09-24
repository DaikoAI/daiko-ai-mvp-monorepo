// "use server"; // This directive is likely causing the error and should be removed for TRPC router files.

import {
  investmentsTable,
  tokenPricesTable,
  tokensTable,
  transactionsTable,
  userBalancesTable,
  usersTable,
} from "@daiko-ai/shared";
import { TRPCError } from "@trpc/server";
import BigNumber from "bignumber.js";
import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

// カスタムエラークラスの定義
class TokenError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number = 400,
  ) {
    super(message);
    this.name = "TokenError";
  }
}

// エラーコードの定義
const ErrorCodes = {
  USER_NOT_FOUND: "USER_NOT_FOUND",
  TOKEN_NOT_FOUND: "TOKEN_NOT_FOUND",
  INVALID_AMOUNT: "INVALID_AMOUNT",
  INSUFFICIENT_BALANCE: "INSUFFICIENT_BALANCE",
  TRANSACTION_FAILED: "TRANSACTION_FAILED",
  BALANCE_NOT_FOUND: "BALANCE_NOT_FOUND",
} as const;

// BigNumberの設定
BigNumber.config({
  DECIMAL_PLACES: 18,
  ROUNDING_MODE: BigNumber.ROUND_DOWN,
});

export const tokenRouter = createTRPCRouter({
  /**
   * Get all tokens
   * GET /api/tokens
   */
  getAllTokens: publicProcedure.query(async ({ ctx }) => {
    if (ctx.useMockDb && ctx.mock) {
      const tokens = await ctx.mock.getAllTokens();
      return tokens.sort((a, b) => a.symbol.localeCompare(b.symbol));
    }
    const tokens = await ctx.db.query.tokensTable.findMany({
      orderBy: [tokensTable.symbol],
    });
    return tokens;
  }),

  /**
   * Get token by symbol
   * GET /api/tokens/:symbol
   */
  getTokenBySymbol: publicProcedure.input(z.object({ symbol: z.string() })).query(async ({ ctx, input }) => {
    if (ctx.useMockDb && ctx.mock) {
      return await ctx.mock.getTokenBySymbol(input.symbol);
    }
    const token = await ctx.db.query.tokensTable.findFirst({
      where: eq(tokensTable.symbol, input.symbol),
    });
    return token;
  }),

  /**
   * Get token by address
   * GET /api/tokens/address/:address
   */
  getTokenByAddress: publicProcedure.input(z.object({ address: z.string() })).query(async ({ ctx, input }) => {
    if (ctx.useMockDb && ctx.mock) {
      return await ctx.mock.getTokenByAddress(input.address);
    }
    const token = await ctx.db.query.tokensTable.findFirst({
      where: eq(tokensTable.address, input.address),
    });
    return token;
  }),

  /**
   * Get token prices
   * GET /api/tokens/prices
   */
  getTokenPrices: publicProcedure
    .input(
      z.object({
        tokenAddresses: z.array(z.string()).optional(),
        limit: z.number().min(1).max(100).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (ctx.useMockDb && ctx.mock) {
        const rows = await ctx.mock.getTokenPrices(input.tokenAddresses);
        // Mimic shape of drizzle with token relation
        return rows.slice(0, input.limit).map((r) => ({
          tokenAddress: r.tokenAddress,
          priceUsd: r.priceUsd,
          lastUpdated: r.lastUpdated,
          token: r.token,
        }));
      }
      // If tokenAddresses is provided, get prices for specific tokens
      if (input.tokenAddresses && input.tokenAddresses.length > 0) {
        const prices = await ctx.db.query.tokenPricesTable.findMany({
          where: inArray(tokenPricesTable.tokenAddress, input.tokenAddresses),
          with: {
            token: true,
          },
          // Optional: Add orderBy if you need the latest price for each token
          // orderBy: [desc(tokenPricesTable.lastUpdated)],
        });
        return prices;
      }
      // Otherwise, get prices for all tokens with limit
      const prices = await ctx.db.query.tokenPricesTable.findMany({
        limit: input.limit,
        orderBy: [desc(tokenPricesTable.lastUpdated)],
        with: {
          token: true,
        },
      });
      return prices;
    }),

  /**
   * Get token types
   * GET /api/tokens/types
   */
  getTokenTypes: publicProcedure.query(async () => {
    // In a real implementation, this would query distinct types from the database
    // For simplicity, we'll return the predefined types
    return [
      { type: "normal", label: "Standard Token" },
      { type: "lending", label: "Lending Token" },
      { type: "perp", label: "Perpetual Futures" },
      { type: "staking", label: "Staking Token" },
    ];
  }),

  /**
   * Get tokens by type
   * GET /api/tokens/by-type/:type
   */
  getTokensByType: publicProcedure
    .input(
      z.object({
        type: z.string(),
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (ctx.useMockDb && ctx.mock) {
        const tokens = (await ctx.mock.getAllTokens()).filter((t) => t.type === input.type);
        return tokens.sort((a, b) => a.symbol.localeCompare(b.symbol)).slice(0, input.limit);
      }
      const tokens = await ctx.db.query.tokensTable.findMany({
        where: eq(tokensTable.type, input.type),
        limit: input.limit,
        orderBy: [tokensTable.symbol],
      });
      return tokens;
    }),
  transfer: publicProcedure
    .input(
      z.object({
        fromToken: z.string(),
        toToken: z.string(),
        fromAmount: z.string(),
        toAmount: z.string(),
        walletAddress: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { fromToken, toToken, fromAmount, toAmount, walletAddress } = input;
      if (ctx.useMockDb && ctx.mock) {
        const user = (await ctx.mock.getUserByWallet(walletAddress)) ?? (await ctx.mock.ensureUser(walletAddress));
        const fromInfo = await ctx.mock.getTokenBySymbol(fromToken);
        const toInfo = await ctx.mock.getTokenBySymbol(toToken);
        if (!fromInfo) throw new TokenError(`From token not found: ${fromToken}`, ErrorCodes.TOKEN_NOT_FOUND);
        if (!toInfo) throw new TokenError(`To token not found: ${toToken}`, ErrorCodes.TOKEN_NOT_FOUND);
        const fromAmountBN = new BigNumber(fromAmount || "0");
        const toAmountBN = new BigNumber(toAmount || "0");
        if (
          fromAmountBN.isNaN() ||
          toAmountBN.isNaN() ||
          fromAmountBN.isLessThanOrEqualTo(0) ||
          toAmountBN.isLessThanOrEqualTo(0)
        ) {
          throw new TokenError("Invalid amount", ErrorCodes.INVALID_AMOUNT);
        }
        const balances = await ctx.mock.getUserBalances(user.id);
        const fromBal = balances.find((b) => b.tokenAddress === fromInfo.address);
        if (!fromBal || new BigNumber(fromBal.balance).isLessThan(fromAmountBN)) {
          throw new TokenError("Insufficient balance for fromToken", ErrorCodes.INSUFFICIENT_BALANCE);
        }
        const newFrom = new BigNumber(fromBal.balance).minus(fromAmountBN).toString();
        await ctx.mock.updateUserBalance(user.id, fromInfo.address, newFrom);
        const toBal = balances.find((b) => b.tokenAddress === toInfo.address);
        const newTo = (toBal ? new BigNumber(toBal.balance) : new BigNumber(0)).plus(toAmountBN).toString();
        await ctx.mock.upsertBalance(user.id, toInfo.address, newTo);
        await ctx.mock.createTransaction({
          userId: user.id,
          transactionType: "swap",
          fromTokenAddress: fromInfo.address,
          toTokenAddress: toInfo.address,
          amountFrom: fromAmountBN.toString(),
          amountTo: toAmountBN.toString(),
          fee: "0",
          details: {},
        });
        return {
          success: true,
          message: "Transfer successful",
          txHash: `sim-tx-${Date.now()}`,
          transaction: {
            fromToken: fromInfo.symbol,
            toToken: toInfo.symbol,
            fromAmount: fromAmountBN.toString(),
            toAmount: toAmountBN.toString(),
          },
          balances: {
            fromTokenBalance: newFrom,
            toTokenBalance: newTo,
          },
        };
      }
      return ctx.db
        .transaction(async (tx) => {
          const user = await tx.query.usersTable.findFirst({
            where: eq(usersTable.walletAddress, walletAddress),
          });
          if (!user) {
            throw new TokenError("User not found", ErrorCodes.USER_NOT_FOUND);
          }
          const [fromTokenInfo, toTokenInfo] = await Promise.all([
            tx.query.tokensTable.findFirst({ where: eq(tokensTable.symbol, fromToken) }),
            tx.query.tokensTable.findFirst({ where: eq(tokensTable.symbol, toToken) }),
          ]);
          if (!fromTokenInfo) {
            throw new TokenError(`From token not found: ${fromToken}`, ErrorCodes.TOKEN_NOT_FOUND);
          }
          if (!toTokenInfo) {
            throw new TokenError(`To token not found: ${toToken}`, ErrorCodes.TOKEN_NOT_FOUND);
          }
          const fromAmountBN = new BigNumber(fromAmount || "0");
          const toAmountBN = new BigNumber(toAmount || "0");
          if (
            fromAmountBN.isNaN() ||
            toAmountBN.isNaN() ||
            fromAmountBN.isLessThanOrEqualTo(0) ||
            toAmountBN.isLessThanOrEqualTo(0)
          ) {
            throw new TokenError("Invalid amount", ErrorCodes.INVALID_AMOUNT);
          }
          const fromBalance = await tx.query.userBalancesTable.findFirst({
            where: and(
              eq(userBalancesTable.userId, user.id),
              eq(userBalancesTable.tokenAddress, fromTokenInfo.address),
            ),
          });
          if (!fromBalance || new BigNumber(fromBalance.balance).isLessThan(fromAmountBN)) {
            throw new TokenError("Insufficient balance for fromToken", ErrorCodes.INSUFFICIENT_BALANCE);
          }
          await tx.insert(transactionsTable).values({
            userId: user.id,
            fromTokenAddress: fromTokenInfo.address,
            toTokenAddress: toTokenInfo.address,
            amountFrom: fromAmountBN.toString(),
            amountTo: toAmountBN.toString(),
            transactionType: "swap",
          });
          const newFromBalance = new BigNumber(fromBalance.balance).minus(fromAmountBN);
          await tx
            .update(userBalancesTable)
            .set({ balance: newFromBalance.toString() })
            .where(eq(userBalancesTable.id, fromBalance.id));
          let toBalance = await tx.query.userBalancesTable.findFirst({
            where: and(eq(userBalancesTable.userId, user.id), eq(userBalancesTable.tokenAddress, toTokenInfo.address)),
          });
          let finalToTokenBalance;
          if (toBalance) {
            const newToBalance = new BigNumber(toBalance.balance).plus(toAmountBN);
            await tx
              .update(userBalancesTable)
              .set({ balance: newToBalance.toString() })
              .where(eq(userBalancesTable.id, toBalance.id));
            finalToTokenBalance = newToBalance.toString();
          } else {
            await tx.insert(userBalancesTable).values({
              userId: user.id,
              tokenAddress: toTokenInfo.address,
              balance: toAmountBN.toString(),
            });
            finalToTokenBalance = toAmountBN.toString();
          }
          return {
            success: true,
            message: "Transfer successful",
            txHash: `sim-tx-${Date.now()}`,
            transaction: {
              fromToken: fromTokenInfo.symbol,
              toToken: toTokenInfo.symbol,
              fromAmount: fromAmountBN.toString(),
              toAmount: toAmountBN.toString(),
            },
            balances: {
              fromTokenBalance: newFromBalance.toString(),
              toTokenBalance: finalToTokenBalance,
            },
          };
        })
        .catch((error) => {
          console.error("Transfer failed within transaction:", error);
          if (error instanceof TokenError) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: error.message,
              cause: error,
            });
          }
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "An unexpected error occurred during the transfer.",
          });
        });
    }),

  stake: publicProcedure
    .input(
      z.object({
        fromToken: z.string(),
        toToken: z.string(),
        amount: z.string(),
        walletAddress: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { fromToken: baseTokenSymbol, toToken: lstTokenSymbol, amount, walletAddress } = input;
      if (ctx.useMockDb && ctx.mock) {
        const user = (await ctx.mock.getUserByWallet(walletAddress)) ?? (await ctx.mock.ensureUser(walletAddress));
        const baseToken = await ctx.mock.getTokenBySymbol(baseTokenSymbol);
        const lstToken = await ctx.mock.getTokenBySymbol(lstTokenSymbol);
        if (!baseToken) throw new Error(`Base token ${baseTokenSymbol} not found`);
        if (!lstToken || lstToken.type !== "liquid_staking") throw new Error(`LST token ${lstTokenSymbol} not found`);
        const amountBN = new BigNumber(amount || "0");
        if (amountBN.isNaN()) throw new Error("Invalid amount format");
        if (amountBN.isLessThanOrEqualTo(0)) throw new Error("Amount must be greater than 0");
        const balances = await ctx.mock.getUserBalances(user.id);
        const baseBal = balances.find((b) => b.tokenAddress === baseToken.address);
        const currentBase = new BigNumber(baseBal?.balance || "0");
        if (currentBase.isLessThan(amountBN)) throw new Error(`Insufficient balance for ${baseTokenSymbol}`);
        await ctx.mock.updateUserBalance(user.id, baseToken.address, currentBase.minus(amountBN).toString());
        const lstBal = balances.find((b) => b.tokenAddress === lstToken.address);
        const newLst = (lstBal ? new BigNumber(lstBal.balance) : new BigNumber(0)).plus(amountBN).toString();
        await ctx.mock.upsertBalance(user.id, lstToken.address, newLst);
        await ctx.mock.createTransaction({
          userId: user.id,
          transactionType: "stake",
          fromTokenAddress: baseToken.address,
          toTokenAddress: lstToken.address,
          amountFrom: amountBN.toString(),
          amountTo: amountBN.toString(),
          fee: "0",
          details: { ...input, status: "completed" },
        });
        return { success: true, txHash: `sim-tx-${Date.now()}` };
      }

      const user = await ctx.db.query.usersTable.findFirst({
        where: eq(usersTable.walletAddress, walletAddress),
      });
      if (!user) {
        throw new TokenError("User not found for staking", ErrorCodes.USER_NOT_FOUND);
      }
      const baseToken = await ctx.db.query.tokensTable.findFirst({
        where: eq(tokensTable.symbol, baseTokenSymbol),
      });
      if (!baseToken) {
        throw new Error(`Base token ${baseTokenSymbol} not found`);
      }
      const lstToken = await ctx.db.query.tokensTable.findFirst({
        where: and(eq(tokensTable.symbol, lstTokenSymbol), eq(tokensTable.type, "liquid_staking")),
      });
      if (!lstToken) {
        throw new Error(`LST token ${lstTokenSymbol} not found`);
      }
      const interestRate = "5.0";
      const amountBN = new BigNumber(amount || "0");
      if (amountBN.isNaN()) {
        throw new Error("Invalid amount format");
      }
      if (amountBN.isLessThanOrEqualTo(0)) {
        throw new Error("Amount must be greater than 0");
      }
      try {
        const baseBalanceRecord = await ctx.db.query.userBalancesTable.findFirst({
          where: and(eq(userBalancesTable.userId, user.id), eq(userBalancesTable.tokenAddress, baseToken.address)),
        });
        if (!baseBalanceRecord) {
          throw new Error(`No balance record found for ${baseTokenSymbol}`);
        }
        const currentBaseBalance = new BigNumber(baseBalanceRecord.balance || "0");
        if (currentBaseBalance.isLessThan(amountBN)) {
          throw new Error(`Insufficient balance for ${baseTokenSymbol}`);
        }
        const transaction = (
          await ctx.db
            .insert(transactionsTable)
            .values({
              userId: user.id,
              transactionType: "stake",
              fromTokenAddress: baseToken.address,
              toTokenAddress: lstToken.address,
              amountFrom: amountBN.toString(),
              amountTo: amountBN.toString(), // 1:1の交換レート
              details: {
                ...input,
                status: "pending",
              },
              createdAt: new Date(),
            })
            .returning()
        )[0];
        if (!transaction) {
          throw new Error("Failed to create transaction record");
        }
        try {
          const newBaseBalance = currentBaseBalance.minus(amountBN).toString();
          await ctx.db
            .update(userBalancesTable)
            .set({ balance: newBaseBalance, updatedAt: new Date() })
            .where(eq(userBalancesTable.id, baseBalanceRecord.id));
          let lstBalanceRecord = await ctx.db.query.userBalancesTable.findFirst({
            where: and(eq(userBalancesTable.userId, user.id), eq(userBalancesTable.tokenAddress, lstToken.address)),
          });
          if (lstBalanceRecord) {
            const currentLstBalance = new BigNumber(lstBalanceRecord.balance || "0");
            const newLstBalance = currentLstBalance.plus(amountBN).toString();
            await ctx.db
              .update(userBalancesTable)
              .set({ balance: newLstBalance, updatedAt: new Date() })
              .where(eq(userBalancesTable.id, lstBalanceRecord.id));
          } else {
            await ctx.db.insert(userBalancesTable).values({
              userId: user.id,
              tokenAddress: lstToken.address,
              balance: amountBN.toString(),
              updatedAt: new Date(),
            });
          }
          await ctx.db.insert(investmentsTable).values({
            userId: user.id,
            tokenAddress: baseToken.address,
            actionType: "staking",
            principal: amountBN.toString(),
            accruedInterest: "0",
            startDate: new Date(),
            lastUpdate: new Date(),
            interestRate: parseFloat(interestRate),
            status: "active",
          });
          await ctx.db
            .update(transactionsTable)
            .set({
              details: {
                ...input,
                status: "completed",
              },
            })
            .where(eq(transactionsTable.id, transaction.id));
          return {
            success: true,
            txHash: `sim-tx-${Date.now()}`,
          };
        } catch (error) {
          await ctx.db
            .update(transactionsTable)
            .set({
              details: {
                ...input,
                status: "failed",
                error: error instanceof Error ? error.message : "Unknown error",
              },
            })
            .where(eq(transactionsTable.id, transaction.id));
          throw error;
        }
      } catch (error) {
        console.error("Staking failed:", error);
        throw new Error(error instanceof Error ? error.message : "Staking failed");
      }
    }),
});
