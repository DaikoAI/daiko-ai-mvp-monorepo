import { NewsScraperDB } from "@daiko-ai/news-scraper";
import type { Tweet } from "@daiko-ai/shared";
import { getAllXAccounts } from "@daiko-ai/x-scraper";

import { type proposalAgentState } from "../utils/state";

export const firebaseNode = async (state: typeof proposalAgentState.State) => {
  try {
    // Fetch Twitter data from Firebase
    const xAccounts = await getAllXAccounts();
    const tweets = xAccounts
      .filter((xAccount) => xAccount.lastContent !== undefined)
      .map((xAccount) => xAccount.lastContent as unknown as Tweet);

    console.log(tweets);

    // Fetch News data from Firebase
    const newsScraperDB = new NewsScraperDB();
    const newsSites = await newsScraperDB.getNewsSites();

    console.log(newsSites);

    state.newsSites = newsSites;
    state.tweets = tweets;
  } catch (error) {
    console.error("Error fetching data from Firebase:", error);
  }

  return state;
};
