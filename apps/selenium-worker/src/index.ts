import { Logger, LogLevel } from "@daiko-ai/shared";
import { XScraper } from "@daiko-ai/x-scraper";
import { inngest } from "@daiko-ai/shared";

const logger = new Logger({ level: LogLevel.INFO });

async function runWorker() {
  logger.info("SeleniumWorker", "Starting worker process...");

  const xUsername = process.env.X_USERNAME;
  const xPassword = process.env.X_PASSWORD;
  const xEmail = process.env.X_EMAIL; // Assuming email is also needed

  if (!xUsername || !xPassword || !xEmail) {
    logger.error("SeleniumWorker", "Missing X credentials in environment variables (X_USERNAME, X_PASSWORD, X_EMAIL)");
    process.exit(1);
  }

  // Ensure OpenAI API key is set if XScraper uses it internally
  if (!process.env.OPENAI_API_KEY) {
    logger.warn("SeleniumWorker", "OPENAI_API_KEY environment variable is not set.");
    // Decide if this is critical - process.exit(1) or just continue?
    process.exit(1);
  }

  // Ensure Database URL is set if needed by db functions in x-scraper/shared
  if (!process.env.DATABASE_URL) {
    logger.error("SeleniumWorker", "DATABASE_URL environment variable is not set.");
    process.exit(1);
  }

  const scraper = new XScraper({
    username: xUsername,
    password: xPassword,
    email: xEmail,
  });

  try {
    logger.info("SeleniumWorker", "Running checkXAccounts...");
    // Get the list of updated account IDs (assuming returns string[])
    const updatedAccountIds: string[] = await scraper.checkXAccounts();
    logger.info("SeleniumWorker", `checkXAccounts finished. Found ${updatedAccountIds.length} updated accounts.`);

    // Send a single Inngest event if there are updated accounts
    if (updatedAccountIds.length > 0) {
      logger.info(
        "SeleniumWorker",
        `Sending single batch event for ${updatedAccountIds.length} updated accounts to Inngest...`,
      );
      try {
        // Send the new batch event
        const eventResult = await inngest.send({
          name: "data/tweet.updated", // Use the new event name
          data: {
            updatedAccountIds: updatedAccountIds, // Pass the array of IDs
          },
        });
        logger.info("SeleniumWorker", "Successfully sent batch accounts checked event to Inngest.", {
          eventId: eventResult.ids,
        });
      } catch (error) {
        logger.error("SeleniumWorker", "Failed to send batch accounts checked event to Inngest.", { error });
        // Consider if this failure should cause process.exit(1)
      }
    }
  } catch (error) {
    logger.error("SeleniumWorker", "Error during scraping process:", error);
  } finally {
    logger.info("SeleniumWorker", "Closing WebDriver...");
    await scraper.closeDriver();
    logger.info("SeleniumWorker", "WebDriver closed. Exiting.");
    process.exit(0); // Ensure the process exits after completion
  }
}

runWorker().catch((error) => {
  logger.error("SeleniumWorker", "Unhandled error in worker:", error);
  process.exit(1);
});
