import dotenv from "dotenv";
import { XScraper } from "../src/scraper";

dotenv.config();

const credentials = {
  email: process.env.X_EMAIL!,
  password: process.env.X_PASSWORD!,
  username: process.env.X_USERNAME!,
};

const scraper = new XScraper(credentials);

async function main() {
  await scraper.login();
  await scraper.checkXAccounts();
  await scraper.closeDriver();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => process.exit(0));
