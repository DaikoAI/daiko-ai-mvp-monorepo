import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { tokenPricesTable, tokensTable } from "@daiko-ai/shared";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

export const tokensRouter = createTRPCRouter({
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
});
