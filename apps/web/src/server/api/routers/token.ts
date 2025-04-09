import { db } from "@daiko-ai/shared";
import * as schema from "@daiko-ai/shared/src/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

// Removed the destructuring of schema
// Access schemas directly via schema.tableName
// Removed DbTransaction type definition

export const tokenRouter = createTRPCRouter({
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
        // Use db.query.usersTable
        where: eq(schema.usersTable.walletAddress, walletAddress), // Use schema.users
      });

      if (!user) {
        throw new Error("User not found");
      }

      const fromTokenInfo = await db.query.tokensTable.findFirst({
        // Use db.query.tokensTable
        where: eq(schema.tokensTable.symbol, fromToken), // Use schema.tokens
      });
      const toTokenInfo = await db.query.tokensTable.findFirst({
        // Use db.query.tokensTable
        where: eq(schema.tokensTable.symbol, toToken), // Use schema.tokens
      });

      if (!fromTokenInfo || !toTokenInfo) {
        throw new Error("Token not found");
      }

      const fromAmountBigInt = BigInt(fromAmount || "0");
      const toAmountBigInt = BigInt(toAmount || "0");

      try {
        await db.transaction(async (tx) => {
          // 1. Get current balance for the fromToken
          const fromBalanceRecord = await tx.query.userBalancesTable.findFirst({
            // Use tx.query.userBalancesTable
            where: and(
              eq(schema.userBalancesTable.userId, user.id),
              eq(schema.userBalancesTable.tokenAddress, fromTokenInfo.address),
            ), // Use schema.userBalances
          });

          const currentFromBalance = BigInt(fromBalanceRecord?.balance || "0");

          // 2. Validate balance
          if (currentFromBalance < fromAmountBigInt) {
            throw new Error(`Insufficient balance for ${fromToken}`);
          }

          // 3. Decrement fromToken balance
          const newFromBalance = (currentFromBalance - fromAmountBigInt).toString();
          if (fromBalanceRecord) {
            await tx
              .update(schema.userBalancesTable) // Use schema.userBalances
              .set({ balance: newFromBalance, updatedAt: new Date() })
              .where(eq(schema.userBalancesTable.id, fromBalanceRecord.id));
          } else {
            throw new Error("From balance record not found unexpectedly.");
          }

          // 4. Increment toToken balance (Upsert)
          const toBalanceRecord = await tx.query.userBalancesTable.findFirst({
            // Use tx.query.userBalancesTable
            where: and(
              eq(schema.userBalancesTable.userId, user.id),
              eq(schema.userBalancesTable.tokenAddress, toTokenInfo.address),
            ),
          });

          if (toBalanceRecord) {
            const currentToBalance = BigInt(toBalanceRecord.balance || "0");
            const newToBalance = (currentToBalance + toAmountBigInt).toString();
            await tx
              .update(schema.userBalancesTable) // Use schema.userBalances
              .set({ balance: newToBalance, updatedAt: new Date() })
              .where(eq(schema.userBalancesTable.id, toBalanceRecord.id));
          } else {
            await tx.insert(schema.userBalancesTable).values({
              // Use schema.userBalances
              userId: user.id,
              tokenAddress: toTokenInfo.address,
              balance: toAmountBigInt.toString(),
              updatedAt: new Date(),
            });
          }

          // 5. Record transaction
          await tx.insert(schema.transactionsTable).values({
            // Use schema.transactions
            userId: user.id,
            transactionType: "swap",
            fromTokenAddress: fromTokenInfo.address,
            toTokenAddress: toTokenInfo.address,
            amountFrom: fromAmount,
            amountTo: toAmount,
            details: input,
            createdAt: new Date(),
          });
        });

        return {
          success: true,
          txHash: `sim-tx-${Date.now()}`,
        };
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
        // Use db.query.usersTable
        where: eq(schema.usersTable.walletAddress, walletAddress),
      });

      if (!user) {
        throw new Error("User not found");
      }

      const tokenInfo = await db.query.tokensTable.findFirst({
        // Use db.query.tokensTable
        where: eq(schema.tokensTable.symbol, tokenSymbol),
      });

      if (!tokenInfo) {
        throw new Error("Token not found");
      }

      const interestRate = "5.0";
      const amountBigInt = BigInt(amount || "0");

      try {
        await db.transaction(async (tx) => {
          // 1. Get current balance
          const balanceRecord = await tx.query.userBalancesTable.findFirst({
            // Use tx.query.userBalancesTable
            where: and(
              eq(schema.userBalancesTable.userId, user.id),
              eq(schema.userBalancesTable.tokenAddress, tokenInfo.address),
            ),
          });

          const currentBalance = BigInt(balanceRecord?.balance || "0");

          // 2. Validate balance
          if (currentBalance < amountBigInt) {
            throw new Error(`Insufficient balance for ${tokenSymbol}`);
          }

          // 3. Decrement balance
          const newBalance = (currentBalance - amountBigInt).toString();
          if (balanceRecord) {
            await tx
              .update(schema.userBalancesTable) // Use schema.userBalances
              .set({ balance: newBalance, updatedAt: new Date() })
              .where(eq(schema.userBalancesTable.id, balanceRecord.id));
          } else {
            throw new Error("Balance record not found unexpectedly.");
          }

          // 4. Create investment record
          await tx.insert(schema.investmentsTable).values({
            userId: user.id,
            tokenAddress: tokenInfo.address,
            actionType: "staking",
            principal: amount,
            accruedInterest: "0",
            startDate: new Date(),
            lastUpdate: new Date(),
            interestRate: parseFloat(interestRate),
            status: "active",
          });

          // 5. Record transaction
          await tx.insert(schema.transactionsTable).values({
            // Use schema.transactions
            userId: user.id,
            transactionType: "stake",
            fromTokenAddress: tokenInfo.address,
            amountFrom: amount,
            details: input,
            createdAt: new Date(),
          });
        });

        return {
          success: true,
          txHash: `sim-tx-${Date.now()}`,
        };
      } catch (error) {
        console.error("Staking failed:", error);
        throw new Error(error instanceof Error ? error.message : "Staking failed");
      }
    }),
});
