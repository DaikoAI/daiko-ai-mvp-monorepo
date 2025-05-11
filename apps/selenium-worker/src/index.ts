import { inngest, Logger, LogLevel } from "@daiko-ai/shared";
import { XScraper } from "@daiko-ai/x-scraper";

const logger = new Logger({ level: LogLevel.INFO });

async function main() {
  logger.info("SeleniumWorker", "Starting worker process...");
  const env = getValidatedEnvVars();

  const scraper = new XScraper({
    username: env.X_USERNAME,
    password: env.X_PASSWORD,
    email: env.X_EMAIL,
  });

  try {
    const updatedAccountIds = await runScraping(scraper);
    await sendBatchEvent(updatedAccountIds);
  } catch (error) {
    // Error is already logged in runScraping, main catch for cleanup
    logger.error("SeleniumWorker", "Unhandled error in main execution:", error);
  } finally {
    logger.info("SeleniumWorker", "Closing WebDriver...");
    try {
      await scraper.closeDriver();
      logger.info("SeleniumWorker", "WebDriver closed.");
    } catch (closeError) {
      logger.error("SeleniumWorker", "Error closing WebDriver:", closeError);
    }
    logger.info("SeleniumWorker", "Exiting worker process.");
    // process.exit(0) will be called implicitly if no unhandled promise rejections
    // or can be explicit based on whether the above try/catch had an error.
    // For now, let's assume successful exit unless an error in EnvValidation or unhandled in main.
  }
}

main().catch((error) => {
  // This catch is for truly unhandled exceptions from main or its async operations
  // if they weren't caught internally or from process.exit(1) in env validation.
  logger.error("SeleniumWorker:Global", "Unhandled exception in worker execution:", error);
  process.exit(1);
});

interface EnvironmentVariables {
  X_USERNAME: string;
  X_PASSWORD: string;
  X_EMAIL: string;
  OPENAI_API_KEY: string;
  DATABASE_URL: string;
}

function getValidatedEnvVars(): EnvironmentVariables {
  const xUsername = process.env.X_USERNAME;
  const xPassword = process.env.X_PASSWORD;
  const xEmail = process.env.X_EMAIL;
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const databaseUrl = process.env.DATABASE_URL;

  if (!xUsername || !xPassword || !xEmail) {
    logger.error("SeleniumWorker:EnvValidation", "Missing X credentials (X_USERNAME, X_PASSWORD, X_EMAIL)");
    process.exit(1);
  }

  if (!openaiApiKey) {
    logger.error("SeleniumWorker:EnvValidation", "OPENAI_API_KEY is not set.");
    process.exit(1);
  }

  if (!databaseUrl) {
    logger.error("SeleniumWorker:EnvValidation", "DATABASE_URL is not set.");
    process.exit(1);
  }

  return {
    X_USERNAME: xUsername,
    X_PASSWORD: xPassword,
    X_EMAIL: xEmail,
    OPENAI_API_KEY: openaiApiKey,
    DATABASE_URL: databaseUrl,
  };
}

async function runScraping(scraper: XScraper): Promise<string[]> {
  logger.info("SeleniumWorker:Scraping", "Running checkXAccounts...");
  try {
    const updatedAccountIds = await scraper.checkXAccounts();
    logger.info(
      "SeleniumWorker:Scraping",
      `checkXAccounts finished. Found ${updatedAccountIds.length} updated accounts.`,
    );
    return updatedAccountIds;
  } catch (error) {
    logger.error("SeleniumWorker:Scraping", "Error during checkXAccounts:", error);
    throw error; // Re-throw to be caught by main try-catch
  }
}

async function sendBatchEvent(updatedAccountIds: string[]): Promise<void> {
  if (updatedAccountIds.length === 0) {
    logger.info("SeleniumWorker:Inngest", "No updated accounts to send.");
    return;
  }

  logger.info("SeleniumWorker:Inngest", `Sending batch event for ${updatedAccountIds.length} updated accounts...`);
  try {
    const eventResult = await inngest.send({
      name: "data/tweet.updated",
      data: {
        updatedAccountIds: updatedAccountIds,
      },
    });
    logger.info("SeleniumWorker:Inngest", "Successfully sent batch event to Inngest.", {
      eventId: eventResult.ids,
    });
  } catch (error) {
    logger.error("SeleniumWorker:Inngest", "Failed to send batch event to Inngest.", { error });
    // Decide if this should be a critical failure, for now, we just log
  }
}
