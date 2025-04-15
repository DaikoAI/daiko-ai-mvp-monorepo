import { portfolioSnapshots, tokenPricesTable, userBalancesTable } from "@daiko-ai/shared";
import { db } from "@daiko-ai/shared/src/db";
import BigNumber from "bignumber.js";
import { asc, desc, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Cron job to capture portfolio snapshots for all users
 * Runs every hour
 */
export async function GET() {
  try {
    console.log("Starting portfolio snapshot capture at", new Date());

    // Get all users
    const users = await db.query.usersTable.findMany();

    for (const user of users) {
      try {
        // Get user's token balances
        const balances = await db.query.userBalancesTable.findMany({
          where: eq(userBalancesTable.userId, user.id),
          with: {
            token: true,
          },
        });

        // Get token prices
        const tokenAddresses = balances.map((balance) => balance.tokenAddress);
        let prices: { tokenAddress: string; priceUsd: string }[] = [];

        if (tokenAddresses.length > 0) {
          prices = await db.query.tokenPricesTable.findMany({
            where: inArray(tokenPricesTable.tokenAddress, tokenAddresses),
          });
        }

        // Create price map for easy lookup
        const priceMap = prices.reduce(
          (map, price) => {
            map[price.tokenAddress] = price.priceUsd;
            return map;
          },
          {} as Record<string, string>,
        );

        // Calculate total portfolio value
        let totalValue = new BigNumber(0);
        const portfolioTokens = balances.map((balance) => {
          const tokenPrice = priceMap[balance.tokenAddress] || "0";
          const valueUsd = new BigNumber(balance.balance).multipliedBy(tokenPrice);
          totalValue = totalValue.plus(valueUsd);

          return {
            symbol: balance.token.symbol,
            tokenAddress: balance.tokenAddress,
            balance: balance.balance,
            priceUsd: tokenPrice,
            valueUsd: valueUsd.toString(),
          };
        });

        // Get previous snapshot for PnL calculation
        const previousSnapshot = await db.query.portfolioSnapshots.findFirst({
          where: eq(portfolioSnapshots.userId, user.id),
          orderBy: (portfolioSnapshots) => [desc(portfolioSnapshots.timestamp)],
        });

        // Get initial snapshot for total PnL calculation
        const initialSnapshot = await db.query.portfolioSnapshots.findFirst({
          where: eq(portfolioSnapshots.userId, user.id),
          orderBy: (portfolioSnapshots) => [asc(portfolioSnapshots.timestamp)],
        });

        // Calculate PnL
        const pnlFromPrevious = previousSnapshot
          ? new BigNumber(totalValue).minus(previousSnapshot.totalValueUsd).toString()
          : "0";

        const pnlFromStart = initialSnapshot
          ? new BigNumber(totalValue).minus(initialSnapshot.totalValueUsd).toString()
          : "0";

        // Create new snapshot
        await db.insert(portfolioSnapshots).values({
          userId: user.id,
          timestamp: new Date(),
          totalValueUsd: totalValue.toString(),
          pnlFromPrevious,
          pnlFromStart,
          snapshotDetails: {
            tokens: portfolioTokens,
          },
        });
      } catch (error) {
        console.error(`Error capturing snapshot for user ${user.id}:`, error);
      }
    }

    console.log("Completed portfolio snapshot capture at", new Date());
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in portfolio snapshot cron:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
