import { Logger, LogLevel, eventSchemas } from "@daiko-ai/shared";
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
    // Get the list of updated account IDs
    const updatedAccountIds = await scraper.checkXAccounts();
    logger.info("SeleniumWorker", `checkXAccounts finished. Found ${updatedAccountIds.length} updated accounts.`);

    // Send Inngest event for each updated account
    if (updatedAccountIds.length > 0) {
      logger.info("SeleniumWorker", "Sending events to Inngest...");
      const sendPromises = updatedAccountIds.map((xId) => {
        return inngest.send({
          name: "data/tweet.updated", // Use the defined event name
          data: {
            xId: xId,
            // latestTweetId is not readily available here, signal processing
            // will need to fetch the latest based on xId.
          },
        });
      });
      // Wait for all events to be sent
      const results = await Promise.allSettled(sendPromises);
      const successfulSends = results.filter((r) => r.status === "fulfilled").length;
      const failedSends = results.length - successfulSends;
      logger.info(
        "SeleniumWorker",
        `Finished sending Inngest events. Successful: ${successfulSends}, Failed: ${failedSends}`,
      );
      if (failedSends > 0) {
        logger.error("SeleniumWorker", "Some Inngest events failed to send.", { results });
        // Optionally, handle failures (e.g., retry logic or specific error logging)
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
