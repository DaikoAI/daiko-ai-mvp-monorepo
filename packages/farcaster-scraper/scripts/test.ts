import { NeynarAdapter } from "../src/adapters/neynar";
import { SearchcasterAdapter } from "../src/adapters/searchcaster";
import { FarcasterRepository } from "../src/repositories/farcaster";
import { FarcasterScraper } from "../src/services/scraper";

async function main() {
  const repository = new FarcasterRepository();
  const neynar = new NeynarAdapter();
  const scraper = new FarcasterScraper(repository, neynar);

  const result = await scraper.scrapeActiveKeywordsWithSearchcaster(new SearchcasterAdapter());

  console.log(result);
}

main();
