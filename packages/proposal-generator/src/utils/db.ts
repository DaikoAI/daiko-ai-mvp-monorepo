import { db, signalsTable, tokenPricesTable, tweetTable, userBalancesTable, usersTable } from "@daiko-ai/shared";
import { desc, eq, gte } from "drizzle-orm";

export const fetchUser = async (userId: string) => {
  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.id, userId),
  });
  return user;
};

export const fetchSignal = async (signalId: string) => {
  const signal = await db.query.signalsTable.findFirst({ where: eq(signalsTable.id, signalId) });
  return signal;
};

export const fetchTokenPrices = async (since: Date) => {
  const tokenPrices = await db.query.tokenPricesTable.findMany({
    where: gte(tokenPricesTable.lastUpdated, since),
    orderBy: [desc(tokenPricesTable.lastUpdated)],
    limit: 10,
  });
  return tokenPrices;
};

export const fetchTweets = async (since: Date) => {
  const tweets = await db.query.tweetTable.findMany({
    where: gte(tweetTable.tweetTime, since),
    orderBy: [desc(tweetTable.tweetTime)],
    limit: 20,
  });
  return tweets;
};

export const fetchUserBalances = async (userId: string) => {
  const userBalances = await db.query.userBalancesTable.findMany({
    where: eq(userBalancesTable.userId, userId),
  });
  return userBalances;
};
