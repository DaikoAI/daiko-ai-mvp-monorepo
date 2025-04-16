import { db, farcasterKeywordsTable } from "@daiko-ai/shared";

const keywords = [
  "SOL",
  "USDC",
  "TRUMP",
  "JUP",
  "WIF",
  "BONK",
  "JTO",
  "RAY",
  "PYTH",
  "HNT",
  "W",
  "MEW",
  "POPCAT",
  "ORCA",
  "ZEUS",
  "KMNO",
  "WBTC",
  "jupSOL",
  "jitoSOL",
  "INF",
  "BIO",
  "LAYER",
  "AIXBT",
  "ACT",
  "Fartcoin",
];

async function seed() {
  await db.insert(farcasterKeywordsTable).values(keywords.map((keyword) => ({ keyword })));

  console.log("Seed completed");
}

seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => process.exit(0));
