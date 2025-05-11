import { XScraper } from "../src/scraper";

const credentials = {
  email: process.env.X_EMAIL!,
  password: process.env.X_PASSWORD!,
  username: process.env.X_USERNAME!,
};

const scraper = new XScraper(credentials);

async function main() {
  const start = performance.now();
  await scraper.checkXAccounts(1);
  const end = performance.now();
  console.log(`Time taken: ${(end - start) / 1000}s`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => process.exit(0));
