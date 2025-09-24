import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc";
import { tokensTable, transactionsTable, userBalancesTable, usersTable } from "@daiko-ai/shared";
import { TRPCError } from "@trpc/server";
import BigNumber from "bignumber.js";
import { type SQL, and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export const transactionsRouter = createTRPCRouter({
  /**
   * Get transactions by wallet address
   * GET /api/transactions/:wallet_address
   */
  getTransactionsByWallet: publicProcedure
    .input(
      z.object({
        walletAddress: z.string(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        transactionType: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Get user by wallet address
      const user =
        ctx.useMockDb && ctx.mock
          ? await ctx.mock.getUserByWallet(input.walletAddress)
          : await ctx.db.query.usersTable.findFirst({ where: eq(usersTable.walletAddress, input.walletAddress) });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Build query conditions
      let conditions = eq(transactionsTable.userId, user.id);

      if (input.startDate && input.endDate) {
        conditions = and(
          conditions,
          gte(transactionsTable.createdAt, input.startDate),
          lte(transactionsTable.createdAt, input.endDate),
        ) as SQL<unknown>;
      }

      if (input.transactionType) {
        conditions = and(conditions, eq(transactionsTable.transactionType, input.transactionType)) as SQL<unknown>;
      }

      // Get transactions
      const transactions =
        ctx.useMockDb && ctx.mock
          ? (await ctx.mock.getTransactions(user.id)).slice(input.offset, input.offset + input.limit)
          : await ctx.db.query.transactionsTable.findMany({
              where: conditions,
              limit: input.limit,
              offset: input.offset,
              orderBy: [desc(transactionsTable.createdAt)],
              with: {
                user: true,
                fromToken: true,
                toToken: true,
              },
            });

      // Count total transactions for pagination
      const totalCount =
        ctx.useMockDb && ctx.mock
          ? (await ctx.mock.getTransactions(user.id)).length
          : await ctx.db
              .select({ count: sql`count(*)` })
              .from(transactionsTable)
              .where(conditions)
              .then((result) => Number(result[0]?.count || 0));

      return {
        transactions,
        pagination: {
          total: totalCount,
          limit: input.limit,
          offset: input.offset,
          hasMore: totalCount > input.offset + input.limit,
        },
      };
    }),

  /**
   * Get transaction by ID
   * GET /api/transactions/id/:id
   */
  getTransactionById: publicProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const transaction =
      ctx.useMockDb && ctx.mock
        ? await ctx.mock.getTransactionById(input.id)
        : await ctx.db.query.transactionsTable.findFirst({
            where: eq(transactionsTable.id, input.id),
            with: {
              user: true,
              fromToken: true,
              toToken: true,
            },
          });

    if (!transaction) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Transaction not found",
      });
    }

    return transaction;
  }),

  /**
   * Create a new transaction (swap, transfer, etc.)
   * POST /api/transactions
   */
  createTransaction: protectedProcedure
    .input(
      z.object({
        transactionType: z.string(),
        fromTokenAddress: z.string().optional(),
        toTokenAddress: z.string().optional(),
        amountFrom: z.string().optional(),
        amountTo: z.string().optional(),
        fee: z.string().optional(),
        details: z.record(z.any()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Validate transaction based on type
      if (input.transactionType === "swap") {
        if (!input.fromTokenAddress || !input.toTokenAddress || !input.amountFrom || !input.amountTo) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Swap transactions require fromToken, toToken, amountFrom, and amountTo",
          });
        }
      }

      // Check if tokens exist
      if (input.fromTokenAddress) {
        const fromToken = await ctx.db.query.tokensTable.findFirst({
          where: eq(tokensTable.address, input.fromTokenAddress),
        });

        if (!fromToken) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "From token not found",
          });
        }
      }

      if (input.toTokenAddress) {
        const toToken = await ctx.db.query.tokensTable.findFirst({
          where: eq(tokensTable.address, input.toTokenAddress),
        });

        if (!toToken) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "To token not found",
          });
        }
      }

      // Create transaction
      const transaction =
        ctx.useMockDb && ctx.mock
          ? await ctx.mock.createTransaction({
              userId,
              transactionType: input.transactionType,
              fromTokenAddress: input.fromTokenAddress!,
              toTokenAddress: input.toTokenAddress!,
              amountFrom: input.amountFrom!,
              amountTo: input.amountTo!,
              fee: input.fee ?? null,
              details: input.details || {},
            })
          : (
              await ctx.db
                .insert(transactionsTable)
                .values({
                  userId,
                  transactionType: input.transactionType,
                  fromTokenAddress: input.fromTokenAddress,
                  toTokenAddress: input.toTokenAddress,
                  amountFrom: input.amountFrom,
                  amountTo: input.amountTo,
                  fee: input.fee,
                  details: input.details || {},
                })
                .returning()
            )[0];

      // In a real implementation, we would also update user balances here
      // This is a simplified version
      if (input.transactionType === "swap" && input.fromTokenAddress && input.toTokenAddress) {
        // Update user's balance of fromToken (deduct)
        const fromBalance =
          ctx.useMockDb && ctx.mock
            ? (await ctx.mock.getUserBalances(userId)).find((b) => b.tokenAddress === input.fromTokenAddress)
            : await ctx.db.query.userBalancesTable.findFirst({
                where: and(
                  eq(userBalancesTable.userId, userId),
                  eq(userBalancesTable.tokenAddress, input.fromTokenAddress),
                ),
              });

        if (fromBalance && input.amountFrom) {
          const newBalance = new BigNumber(fromBalance.balance).minus(input.amountFrom).toString();

          // Update with new balance
          if (ctx.useMockDb && ctx.mock) {
            await ctx.mock.updateUserBalance(userId, input.fromTokenAddress, newBalance);
          } else {
            await ctx.db
              .update(userBalancesTable)
              .set({ balance: newBalance })
              .where(
                and(eq(userBalancesTable.userId, userId), eq(userBalancesTable.tokenAddress, input.fromTokenAddress)),
              );
          }
        }

        // Update user's balance of toToken (add)
        const toBalance =
          ctx.useMockDb && ctx.mock
            ? (await ctx.mock.getUserBalances(userId)).find((b) => b.tokenAddress === input.toTokenAddress)
            : await ctx.db.query.userBalancesTable.findFirst({
                where: and(
                  eq(userBalancesTable.userId, userId),
                  eq(userBalancesTable.tokenAddress, input.toTokenAddress),
                ),
              });

        if (toBalance && input.amountTo) {
          const newBalance = new BigNumber(toBalance.balance).plus(input.amountTo).toString();

          // Update with new balance
          if (ctx.useMockDb && ctx.mock) {
            await ctx.mock.updateUserBalance(userId, input.toTokenAddress, newBalance);
          } else {
            await ctx.db
              .update(userBalancesTable)
              .set({ balance: newBalance })
              .where(
                and(eq(userBalancesTable.userId, userId), eq(userBalancesTable.tokenAddress, input.toTokenAddress)),
              );
          }
        }
      }

      revalidatePath("/portfolio");
      revalidatePath("/proposals");

      return transaction;
    }),

  /**
   * Get transaction types
   * GET /api/transactions/types
   */
  getTransactionTypes: publicProcedure.query(async () => {
    // In a real implementation, this would query distinct types from the database
    return [
      { type: "swap", label: "Token Swap" },
      { type: "staking", label: "Staking" },
      { type: "liquid_staking", label: "Liquid Staking" },
      { type: "perp_trade", label: "Perpetual Trade" },
      { type: "perp_close", label: "Close Perpetual Position" },
      { type: "lending", label: "Lending" },
    ];
  }),
});
