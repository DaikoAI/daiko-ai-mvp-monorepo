import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import {
  perpPositionsTable,
  portfolioSnapshots,
  tokenPricesTable,
  userBalancesTable,
  usersTable,
} from "@daiko-ai/shared";
import { tokenPriceHistory, type NeonHttpDatabase } from "@daiko-ai/shared";
import BigNumber from "bignumber.js";
import { and, desc, eq, gte, inArray, lte } from "drizzle-orm";

import { z } from "zod";

// Define a type for the token price data (adjust based on your actual schema)
type TokenPrice = {
  tokenAddress: string;
  priceUsd: string; // Based on usage below
  // Include other relevant fields from your tokenPricesTable schema
  timestamp?: Date; // Example: if you need timestamp
};

// 24時間前の価格を取得する関数
async function get24hPriceHistory(db: NeonHttpDatabase, tokenAddresses: string[]): Promise<Map<string, string>> {
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // サブクエリで各トークンの24時間前に最も近い価格を取得
  const priceHistory = await db
    .select({
      token_address: tokenPriceHistory.token_address,
      price_usd: tokenPriceHistory.price_usd,
      timestamp: tokenPriceHistory.timestamp,
    })
    .from(tokenPriceHistory)
    .where(
      and(
        inArray(tokenPriceHistory.token_address, tokenAddresses),
        lte(tokenPriceHistory.timestamp, twentyFourHoursAgo),
      ),
    )
    .orderBy((fields) => [desc(fields.timestamp)]);

  // 各トークンの最初の（24時間前に最も近い）価格のみを使用
  const priceMap = new Map<string, string>();
  const seenTokens = new Set<string>();

  for (const record of priceHistory) {
    if (!seenTokens.has(record.token_address)) {
      priceMap.set(record.token_address, record.price_usd);
      seenTokens.add(record.token_address);
    }
  }

  return priceMap;
}

// 価格変動率を計算する関数
function calculatePriceChange(currentPrice: string, oldPrice: string): string {
  const current = parseFloat(currentPrice);
  const old = parseFloat(oldPrice);

  if (old === 0 || isNaN(old) || isNaN(current)) {
    return "0";
  }

  const changePercent = ((current - old) / old) * 100;
  return changePercent.toFixed(2);
}

export const portfolioRouter = createTRPCRouter({
  /**
   * Get user portfolio data
   * GET /api/portfolio/:wallet_address
   */
  getUserPortfolio: publicProcedure
    .input(
      z.object({
        walletAddress: z.string(),
        forceRefresh: z.boolean().optional().default(false),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Get user by wallet address
      const user = await ctx.db.query.usersTable.findFirst({
        where: eq(usersTable.walletAddress, input.walletAddress),
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Get user's token balances
      const balances = await ctx.db.query.userBalancesTable.findMany({
        where: eq(userBalancesTable.userId, user.id),
        with: {
          token: true,
        },
      });

      // Get token prices
      const tokenAddresses = balances.map((balance) => balance.tokenAddress);

      // TODO: If forceRefresh is true, update token prices from external API

      let prices: TokenPrice[] = [];
      if (tokenAddresses.length > 0) {
        // Fetch prices for all relevant token addresses in a single query
        prices = await ctx.db.query.tokenPricesTable.findMany({
          where: inArray(tokenPricesTable.tokenAddress, tokenAddresses),
          // Optional: Add orderBy if you need the latest price for each token
          // orderBy: (table, { desc }) => [desc(table.timestamp)],
        });
      }

      // Create a price map for easy lookup
      const priceMap = prices.reduce(
        (map, price) => {
          map[price.tokenAddress] = price.priceUsd;
          return map;
        },
        {} as Record<string, string>,
      );

      // Calculate total value and build portfolio
      let totalValue = new BigNumber(0);
      const portfolio = await Promise.all(
        balances.map(async (balance) => {
          const tokenPrice = priceMap[balance.tokenAddress] || "0";
          const valueUsd = new BigNumber(balance.balance).multipliedBy(tokenPrice).toString();

          // Add to total
          totalValue = totalValue.plus(valueUsd);

          return {
            symbol: balance.token.symbol,
            tokenAddress: balance.tokenAddress,
            balance: balance.balance,
            priceUsd: tokenPrice,
            valueUsd: valueUsd,
            priceChange24h: "0",
            iconUrl: balance.token.iconUrl,
          };
        }),
      );

      // 24時間の価格変動を計算
      const oldPrices = await get24hPriceHistory(ctx.db, tokenAddresses);

      const tokensWithPriceChange = await Promise.all(
        portfolio.map(async (token) => {
          const oldPrice = oldPrices.get(token.tokenAddress);
          const priceChange = oldPrice ? calculatePriceChange(token.priceUsd, oldPrice) : "0";
          return {
            ...token,
            priceChange24h: priceChange,
          };
        }),
      );

      // Get open perp positions
      const perpPositions = await ctx.db.query.perpPositionsTable.findMany({
        where: and(eq(perpPositionsTable.userId, user.id), eq(perpPositionsTable.status, "open")),
        with: {
          token: true,
        },
      });

      // Process perp positions and calculate their values
      const perpPositionsData = perpPositions.map((position) => {
        const currentPrice = priceMap[position.tokenAddress] || "0";
        // Basic calculation of position value (simplified)
        const positionValue = new BigNumber(position.positionSize).multipliedBy(currentPrice);

        return {
          id: position.id,
          symbol: position.token.symbol,
          tokenAddress: position.tokenAddress,
          direction: position.positionDirection,
          leverage: position.leverage,
          entryPrice: position.entryPrice,
          currentPrice: currentPrice,
          positionSize: position.positionSize,
          collateralAmount: position.collateralAmount,
          liquidationPrice: position.liquidationPrice,
          valueUsd: positionValue.toString(),
        };
      });

      return {
        wallet_address: input.walletAddress,
        total_value_usd: totalValue.toString(),
        tokens: tokensWithPriceChange.sort((a, b) => new BigNumber(b.valueUsd).minus(a.valueUsd).toNumber()),
        perp_positions: perpPositionsData,
        last_updated: new Date(),
      };
    }),

  /**
   * Get user PnL time series data
   * GET /api/pnl/:wallet_address?period=7d
   */
  getUserPnl: publicProcedure
    .input(
      z.object({
        walletAddress: z.string(),
        period: z.enum(["1d", "7d", "30d", "90d", "1y"]).default("1d"),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Get user by wallet address
      const user = await ctx.db.query.usersTable.findFirst({
        where: eq(usersTable.walletAddress, input.walletAddress),
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Calculate start date based on period
      const now = new Date();
      let startDate = new Date();

      switch (input.period) {
        case "1d":
          startDate.setDate(now.getDate() - 1);
          break;
        case "7d":
          startDate.setDate(now.getDate() - 7);
          break;
        case "30d":
          startDate.setDate(now.getDate() - 30);
          break;
        case "90d":
          startDate.setDate(now.getDate() - 90);
          break;
        case "1y":
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      // Get snapshots for the period
      const snapshots = await ctx.db.query.portfolioSnapshots.findMany({
        where: and(
          eq(portfolioSnapshots.userId, user.id),
          gte(portfolioSnapshots.timestamp, startDate),
          lte(portfolioSnapshots.timestamp, now),
        ),
        orderBy: [portfolioSnapshots.timestamp],
      });

      // If no snapshots, return current portfolio value
      if (snapshots.length === 0) {
        // Get current portfolio value (simplified)
        const currentValue = "0"; // This should be calculated or fetched

        return {
          wallet_address: input.walletAddress,
          period: input.period,
          data_points: 1,
          pnl_data: [
            {
              timestamp: now,
              value: currentValue,
              pnl_absolute: "0",
              pnl_percentage: "0",
            },
          ],
        };
      }

      // Process snapshots to create PnL data
      const initialValue = snapshots[0]?.totalValueUsd || new BigNumber(0);

      const pnlData = snapshots.map((snapshot) => {
        const value = snapshot.totalValueUsd.toString();
        const pnlAbsolute = new BigNumber(value).minus(initialValue.toString()).toString();
        const pnlPercentage =
          initialValue.toString() !== "0"
            ? new BigNumber(pnlAbsolute).dividedBy(initialValue.toString()).multipliedBy(100).toString()
            : "0";

        return {
          timestamp: snapshot.timestamp,
          value,
          pnl_absolute: pnlAbsolute,
          pnl_percentage: pnlPercentage,
        };
      });

      const lastItem = pnlData[pnlData.length - 1];

      return {
        wallet_address: input.walletAddress,
        period: input.period,
        data_points: pnlData.length,
        pnl_data: pnlData,
        summary: {
          initial_value: initialValue.toString(),
          current_value: lastItem ? lastItem.value : "0",
          pnl_absolute: lastItem ? lastItem.pnl_absolute : "0",
          pnl_percentage: lastItem ? lastItem.pnl_percentage : "0",
        },
      };
    }),

  getUserNfts: publicProcedure.input(z.object({ walletAddress: z.string() })).query(async ({ ctx, input }) => {
    const user = await ctx.db.query.usersTable.findFirst({
      where: eq(usersTable.walletAddress, input.walletAddress),
    });

    if (!user) {
      throw new Error("User not found");
    }

    // const nfts = await ctx.db.query.nftsTable.findMany({
    //   where: eq(nftsTable.userId, user.id),
    // });

    return [] as {
      id: string;
      name: string;
      image_url: string;
      collection: {
        name: string;
      };
    }[];
  }),
});
