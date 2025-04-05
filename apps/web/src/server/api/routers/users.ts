import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc";
import { usersTable } from "@daiko-ai/shared";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const usersRouter = createTRPCRouter({
  /**
   * Get user by wallet address
   * GET /api/users/:wallet_address
   */
  getUserByWallet: publicProcedure.input(z.object({ walletAddress: z.string() })).query(async ({ ctx, input }) => {
    const user = await ctx.db.query.usersTable.findFirst({
      where: eq(usersTable.walletAddress, input.walletAddress),
    });

    return user;
  }),

  /**
   * Create a new user
   * POST /api/users
   */
  createUser: publicProcedure
    .input(
      z.object({
        walletAddress: z.string(),
        username: z.string().optional(),
        email: z.string().email().optional(),
        tradeStyle: z.string().optional().default("default"),
        totalAssetUsd: z.number().optional().default(0),
        cryptoInvestmentUsd: z.number().optional().default(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user already exists
      const existingUser = await ctx.db.query.usersTable.findFirst({
        where: eq(usersTable.walletAddress, input.walletAddress),
      });

      if (existingUser) {
        return existingUser;
      }

      // Create new user
      const [newUser] = await ctx.db
        .insert(usersTable)
        .values({
          walletAddress: input.walletAddress,
          name: input.username || `User-${input.walletAddress.slice(0, 8)}`,
          email: input.email || `${input.walletAddress.slice(0, 8)}@example.com`,
          age: 0, // Default value
          tradeStyle: input.tradeStyle,
          totalAssetUsd: input.totalAssetUsd,
          cryptoInvestmentUsd: input.cryptoInvestmentUsd,
        })
        .returning();

      return newUser;
    }),

  /**
   * Get user settings for the authenticated user
   * GET /api/users/settings
   */
  getUserSettings: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.user?.walletAddress) {
      throw new Error("User not authenticated or wallet address not found");
    }

    const user = await ctx.db.query.usersTable.findFirst({
      where: eq(usersTable.walletAddress, ctx.session.user.walletAddress),
    });

    if (!user) {
      throw new Error("User not found");
    }

    // ユーザー設定を返す
    return {
      tradeStyle: user.tradeStyle || "swing",
      totalAssetUsd: user.totalAssetUsd?.toString() || "0",
      cryptoInvestmentUsd: user.cryptoInvestmentUsd?.toString() || "0",
      age: user.age?.toString() || "0",
    };
  }),

  /**
   * Update user settings for the authenticated user
   * PUT /api/users/settings
   */
  updateUserSettings: protectedProcedure
    .input(
      z.object({
        riskTolerance: z.enum(["low", "medium", "high"]).optional(),
        tradeStyle: z.enum(["day", "swing", "long"]).optional(),
        stakingEnabled: z.boolean().optional(),
        birthday: z.string().optional(),
        totalAssetUsd: z.string().optional(),
        cryptoInvestmentUsd: z.string().optional(),
        age: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.walletAddress) {
        throw new Error("User not authenticated or wallet address not found");
      }

      // ユーザーの存在確認
      const user = await ctx.db.query.usersTable.findFirst({
        where: eq(usersTable.walletAddress, ctx.session.user.walletAddress),
      });

      if (!user) {
        throw new Error("User not found");
      }

      // ユーザー設定を更新（新しいフィールドを含むため型アサーションが必要）
      const [updatedUser] = await ctx.db
        .update(usersTable)
        .set({
          riskTolerance: input.riskTolerance,
          tradeStyle: input.tradeStyle,
          stakingEnabled: input.stakingEnabled,
          birthday: input.birthday ? new Date(input.birthday) : undefined,
          totalAssetUsd: input.totalAssetUsd ? parseInt(input.totalAssetUsd, 10) : user.totalAssetUsd,
          cryptoInvestmentUsd: input.cryptoInvestmentUsd
            ? parseInt(input.cryptoInvestmentUsd, 10)
            : user.cryptoInvestmentUsd,
          age: input.age ? parseInt(input.age, 10) : user.age,
        } as any) // データベーススキーマの変更が反映されるまでの一時的な対処
        .where(eq(usersTable.id, user.id))
        .returning();

      return updatedUser;
    }),

  /**
   * Connect Twitter account
   * POST /api/users/twitter/connect
   */
  connectTwitter: protectedProcedure
    .input(
      z.object({
        twitterUsername: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.walletAddress) {
        throw new Error("User not authenticated or wallet address not found");
      }

      // ユーザーの存在確認
      const user = await ctx.db.query.usersTable.findFirst({
        where: eq(usersTable.walletAddress, ctx.session.user.walletAddress),
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Twitterアカウント連携（実際の認証処理は省略）
      const [updatedUser] = await ctx.db
        .update(usersTable)
        .set({
          twitterConnected: true,
          twitterUsername: input.twitterUsername,
        } as any) // データベーススキーマの変更が反映されるまでの一時的な対処
        .where(eq(usersTable.id, user.id))
        .returning();

      return updatedUser;
    }),
});
