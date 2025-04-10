import { db, tokenPricesTable, tokensTable } from "@daiko-ai/shared";
import * as schema from "@daiko-ai/shared/src/db/schema";
import BigNumber from "bignumber.js";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

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
      // If tokenAddresses is provided, get prices for specific tokens
      if (input.tokenAddresses && input.tokenAddresses.length > 0) {
        const prices = [];
        // We need to fetch prices one by one since "in" operator might not be directly supported
        for (const address of input.tokenAddresses) {
          const price = await ctx.db.query.tokenPricesTable.findFirst({
            where: eq(tokenPricesTable.tokenAddress, address),
            with: {
              token: true,
            },
          });
          if (price) prices.push(price);
        }
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
  getTokenTypes: publicProcedure.query(async ({ ctx }) => {
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

      const user = await db.query.usersTable.findFirst({
        where: eq(schema.usersTable.walletAddress, walletAddress),
      });

      if (!user) {
        throw new Error("User not found");
      }

      const fromTokenInfo = await db.query.tokensTable.findFirst({
        where: eq(schema.tokensTable.symbol, fromToken),
      });
      const toTokenInfo = await db.query.tokensTable.findFirst({
        where: eq(schema.tokensTable.symbol, toToken),
      });

      if (!fromTokenInfo || !toTokenInfo) {
        throw new Error("Token not found");
      }

      // 数値の検証
      const fromAmountBN = new BigNumber(fromAmount || "0");
      const toAmountBN = new BigNumber(toAmount || "0");

      if (fromAmountBN.isNaN() || toAmountBN.isNaN()) {
        throw new Error("Invalid amount format");
      }

      if (fromAmountBN.isLessThanOrEqualTo(0) || toAmountBN.isLessThanOrEqualTo(0)) {
        throw new Error("Amount must be greater than 0");
      }

      try {
        // 1. Get current balance for the fromToken
        const fromBalanceRecord = await db.query.userBalancesTable.findFirst({
          where: and(
            eq(schema.userBalancesTable.userId, user.id),
            eq(schema.userBalancesTable.tokenAddress, fromTokenInfo.address),
          ),
        });

        if (!fromBalanceRecord) {
          throw new Error("From balance record not found");
        }

        const currentFromBalance = new BigNumber(fromBalanceRecord.balance || "0");

        // 2. Validate balance
        if (currentFromBalance.isLessThan(fromAmountBN)) {
          throw new Error(`Insufficient balance for ${fromToken}`);
        }

        // 3. Decrement fromToken balance
        const newFromBalance = currentFromBalance.minus(fromAmountBN).toString();
        await db
          .update(schema.userBalancesTable)
          .set({ balance: newFromBalance, updatedAt: new Date() })
          .where(eq(schema.userBalancesTable.id, fromBalanceRecord.id));

        // 4. Record transaction
        const transaction = (
          await db
            .insert(schema.transactionsTable)
            .values({
              userId: user.id,
              transactionType: "swap",
              fromTokenAddress: fromTokenInfo.address,
              toTokenAddress: toTokenInfo.address,
              amountFrom: fromAmountBN.toString(),
              amountTo: toAmountBN.toString(),
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
          // 5. Increment toToken balance (Upsert)
          const toBalanceRecord = await db.query.userBalancesTable.findFirst({
            where: and(
              eq(schema.userBalancesTable.userId, user.id),
              eq(schema.userBalancesTable.tokenAddress, toTokenInfo.address),
            ),
          });

          if (toBalanceRecord) {
            const currentToBalance = new BigNumber(toBalanceRecord.balance || "0");
            const newToBalance = currentToBalance.plus(toAmountBN).toString();
            await db
              .update(schema.userBalancesTable)
              .set({ balance: newToBalance, updatedAt: new Date() })
              .where(eq(schema.userBalancesTable.id, toBalanceRecord.id));
          } else {
            await db.insert(schema.userBalancesTable).values({
              userId: user.id,
              tokenAddress: toTokenInfo.address,
              balance: toAmountBN.toString(),
              updatedAt: new Date(),
            });
          }

          // 6. Update transaction status
          await db
            .update(schema.transactionsTable)
            .set({
              details: {
                ...input,
                status: "completed",
              },
            })
            .where(eq(schema.transactionsTable.id, transaction.id));

          return {
            success: true,
            txHash: `sim-tx-${Date.now()}`,
          };
        } catch (error) {
          // Compensating transaction: Revert fromToken balance
          await db
            .update(schema.userBalancesTable)
            .set({ balance: currentFromBalance.toString(), updatedAt: new Date() })
            .where(eq(schema.userBalancesTable.id, fromBalanceRecord.id));

          // Update transaction status
          await db
            .update(schema.transactionsTable)
            .set({
              details: {
                ...input,
                status: "failed",
                error: error instanceof Error ? error.message : "Unknown error",
              },
            })
            .where(eq(schema.transactionsTable.id, transaction.id));

          throw error;
        }
      } catch (error) {
        console.error("Transfer failed:", error);
        throw new Error(error instanceof Error ? error.message : "Transfer failed");
      }
    }),

  stake: publicProcedure
    .input(
      z.object({
        token: z.string(),
        amount: z.string(),
        walletAddress: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { token: tokenSymbol, amount, walletAddress } = input;

      const user = await db.query.usersTable.findFirst({
        where: eq(schema.usersTable.walletAddress, walletAddress),
      });

      if (!user) {
        throw new Error("User not found");
      }

      const tokenInfo = await db.query.tokensTable.findFirst({
        where: eq(schema.tokensTable.symbol, tokenSymbol),
      });

      if (!tokenInfo) {
        throw new Error("Token not found");
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
        // 1. Get current balance
        const balanceRecord = await db.query.userBalancesTable.findFirst({
          where: and(
            eq(schema.userBalancesTable.userId, user.id),
            eq(schema.userBalancesTable.tokenAddress, tokenInfo.address),
          ),
        });

        if (!balanceRecord) {
          throw new Error("Balance record not found");
        }

        const currentBalance = new BigNumber(balanceRecord.balance || "0");

        // 2. Validate balance
        if (currentBalance.isLessThan(amountBN)) {
          throw new Error(`Insufficient balance for ${tokenSymbol}`);
        }

        // 3. Record transaction first
        const transaction = (
          await db
            .insert(schema.transactionsTable)
            .values({
              userId: user.id,
              transactionType: "stake",
              fromTokenAddress: tokenInfo.address,
              amountFrom: amountBN.toString(),
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
          // 4. Decrement balance
          const newBalance = currentBalance.minus(amountBN).toString();
          await db
            .update(schema.userBalancesTable)
            .set({ balance: newBalance, updatedAt: new Date() })
            .where(eq(schema.userBalancesTable.id, balanceRecord.id));

          // 5. Create investment record
          await db.insert(schema.investmentsTable).values({
            userId: user.id,
            tokenAddress: tokenInfo.address,
            actionType: "staking",
            principal: amountBN.toString(),
            accruedInterest: "0",
            startDate: new Date(),
            lastUpdate: new Date(),
            interestRate: parseFloat(interestRate),
            status: "active",
          });

          // 6. Update transaction status
          await db
            .update(schema.transactionsTable)
            .set({
              details: {
                ...input,
                status: "completed",
              },
            })
            .where(eq(schema.transactionsTable.id, transaction.id));

          return {
            success: true,
            txHash: `sim-tx-${Date.now()}`,
          };
        } catch (error) {
          // Update transaction status
          await db
            .update(schema.transactionsTable)
            .set({
              details: {
                ...input,
                status: "failed",
                error: error instanceof Error ? error.message : "Unknown error",
              },
            })
            .where(eq(schema.transactionsTable.id, transaction.id));

          throw error;
        }
      } catch (error) {
        console.error("Staking failed:", error);
        throw new Error(error instanceof Error ? error.message : "Staking failed");
      }
    }),
});
