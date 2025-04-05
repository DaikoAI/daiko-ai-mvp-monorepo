import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import {
  perpPositionsTable,
  portfolioSnapshots,
  tokenPricesTable,
  userBalancesTable,
  usersTable,
} from "@daiko-ai/shared";
import { and, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";
// Import BigNumber from local installation
import BigNumber from "bignumber.js";

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

      let prices: any[] = [];
      if (tokenAddresses.length > 0) {
        // Get price for the first token as an example
        prices = await ctx.db.query.tokenPricesTable.findMany({
          where: eq(tokenPricesTable.tokenAddress, tokenAddresses[0] ?? ""),
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
      const portfolio = balances.map((balance) => {
        const tokenPrice = priceMap[balance.tokenAddress] || "0";
        const valueUsd = new BigNumber(balance.balance).multipliedBy(tokenPrice).toString();

        // Add to total
        totalValue = totalValue.plus(valueUsd);

        return {
          token: balance.token.symbol,
          token_address: balance.tokenAddress,
          balance: balance.balance,
          price_usd: tokenPrice,
          value_usd: valueUsd,
          icon_url: balance.token.iconUrl,
        };
      });

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
          token: position.token.symbol,
          token_address: position.tokenAddress,
          direction: position.positionDirection,
          leverage: position.leverage,
          entry_price: position.entryPrice,
          current_price: currentPrice,
          position_size: position.positionSize,
          collateral_amount: position.collateralAmount,
          liquidation_price: position.liquidationPrice,
          value_usd: positionValue.toString(),
          // PnL calculation (simplified)
          pnl: new BigNumber(currentPrice)
            .minus(position.entryPrice)
            .multipliedBy(position.positionDirection === "long" ? 1 : -1)
            .multipliedBy(position.positionSize)
            .toString(),
        };
      });

      return {
        wallet_address: input.walletAddress,
        total_value_usd: totalValue.toString(),
        tokens: portfolio,
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
});
