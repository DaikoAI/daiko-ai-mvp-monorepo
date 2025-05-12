import type {
  SignalInsert,
  TweetSelect, // This type should align with the structure returned by db.select().from(tweetTable)
} from "@daiko-ai/shared";
import { db, inngest, Logger, LogLevel, signalsTable, tokensTable, tweetTable } from "@daiko-ai/shared";
import { and, desc, inArray } from "drizzle-orm";

import { filterRelevantTweets, formatTweetsForLlm, type FormattedTweetForLlm } from "@daiko-ai/shared"; // Path to your tweet processor
import { detectSignalWithLlm, type KnownTokenType, type LlmSignalResponseType } from "@daiko-ai/signal-detector"; // Path to your signal detector, added KnownTokenType

const logger = new Logger({ level: process.env.NODE_ENV === "production" ? LogLevel.INFO : LogLevel.DEBUG });

/**
 * Inngest function to process batch tweet updates and detect market signals.
 */
export const processSignalDetection = inngest.createFunction(
  {
    id: "process-signal-detection",
    name: "Process Signal Detection",
    // Optional: Configure concurrency, retries, etc.
  },
  {
    event: "data/tweet.updated", // This event should contain { updatedAccountIds: string[] }
  },
  async ({ event, step }) => {
    const { updatedAccountIds } = event.data;
    const eventId = event.id;
    if (!eventId) {
      logger.error("processSignalDetection", "Missing event ID");
      return { success: false, message: "Missing event ID" };
    }
    logger.info("processSignalDetection", `Received batch update for ${updatedAccountIds.length} accounts.`);

    if (!updatedAccountIds || updatedAccountIds.length === 0) {
      logger.warn("processSignalDetection", "No account IDs provided in the event data.");
      return { success: false, message: "No account IDs received." };
    }

    // 1. Fetch tweets
    const gatheredTweets = await fetchTweets(updatedAccountIds);
    if (gatheredTweets.length === 0) {
      logger.info("processSignalDetection", "No new raw tweets to process after fetching.");
      return { success: true, message: "No new raw tweets to process" };
    }
    logger.debug("processSignalDetection", `Fetched ${gatheredTweets.length} raw tweets.`);

    // 2. Filter relevant tweets
    const relevantTweets = filterRelevantTweets(gatheredTweets);
    if (relevantTweets.length === 0) {
      logger.info("processSignalDetection", "No relevant tweets after filtering.");
      return { success: true, message: "No relevant tweets after filtering" };
    }
    logger.debug("processSignalDetection", `Filtered down to ${relevantTweets.length} relevant tweets.`);

    // 3. Format tweets for LLM
    const formattedTweets: FormattedTweetForLlm[] = formatTweetsForLlm(relevantTweets);
    logger.debug("processSignalDetection", `Formatted ${formattedTweets.length} tweets for LLM.`);

    // 4. Fetch Known Tokens
    let knownTokens: KnownTokenType[] = [];
    try {
      knownTokens = await db
        .select({
          address: tokensTable.address,
          symbol: tokensTable.symbol,
          name: tokensTable.name,
        })
        .from(tokensTable);
      logger.debug("processSignalDetection", `Fetched ${knownTokens.length} known tokens.`);
    } catch (error) {
      logger.warn("processSignalDetection", "Failed to fetch known tokens from DB. Proceeding without them.", {
        error,
      });
      // Proceed without known tokens if DB fetch fails, LLM will handle it based on prompt
    }

    // 5. Detect signal using the new service
    const llmResult = await detectSignalWithLlm({ formattedTweets, knownTokens });

    if (!llmResult) {
      logger.error("processSignalDetection", "LLM processing failed or returned null");
      return { success: false, message: "LLM processing error" }; // Indicates an error in the LLM call itself
    }

    logger.info(
      "processSignalDetection",
      `LLM Result: signalDetected: ${llmResult.signalDetected}, reasonInvalid: ${llmResult.reasonInvalid || "N/A"}`,
    );
    // console.log("llmResult from workflow", JSON.stringify(llmResult, null, 2)); // Keep for debugging if needed

    if (!llmResult.signalDetected) {
      return {
        success: true,
        signalDetected: false,
        reason: llmResult.reasoning,
        reasonInvalid: llmResult.reasonInvalid,
      };
    }

    // 6. Insert signal if detected
    // Ensure llmResult aligns with SignalInsert requirements if LlmSignalResponseType has diverged.
    // Currently, it seems compatible for the fields used in insertSignal.
    const insertedSignal = await insertSignal(llmResult);
    if (!insertedSignal?.id) {
      // This implies an issue with DB insertion rather than signal detection itself.
      logger.error("processSignalDetection", "Signal detected but failed to insert into DB");
      return { success: false, message: "Failed to save signal to DB", signalDetected: true };
    }

    // 7. Send event for detected signal
    await sendSignalEvent(insertedSignal.id);
    return { success: true, signalId: insertedSignal.id, signalDetected: true };
  },
);

// fetchTweets remains the same
async function fetchTweets(updatedAccountIds: string[]): Promise<TweetSelect[]> {
  try {
    const tweets = await db
      .select()
      .from(tweetTable)
      .where(and(inArray(tweetTable.authorId, updatedAccountIds)))
      .orderBy(desc(tweetTable.tweetTime))
      .limit(500); // Consider if this limit is appropriate for all cases
    logger.debug(
      "fetchTweets",
      `Finished gathering data. Found ${tweets.length} tweets for accounts: ${updatedAccountIds.join(", ")}.`,
    );
    return tweets;
  } catch (error) {
    logger.error("fetchTweets", "Error fetching tweets", { error });
    throw error; // Re-throw to be caught by Inngest
  }
}

// insertSignal needs to accept LlmSignalResponseType now
async function insertSignal(
  llmResult: LlmSignalResponseType, // Changed from z.infer<typeof LlmSignalResponseSchema>
): Promise<(SignalInsert & { id: string }) | null> {
  logger.debug("insertSignal", "Attempting to insert detected signal into DB...");

  // Convert sentimentScore (number) to sentimentType (enum)
  let sentimentTypeValue: "positive" | "negative" | "neutral";
  if (llmResult.sentimentScore > 0) {
    sentimentTypeValue = "positive";
  } else if (llmResult.sentimentScore < 0) {
    sentimentTypeValue = "negative";
  } else {
    sentimentTypeValue = "neutral";
  }

  const signalToInsert: SignalInsert = {
    tokenAddress: llmResult.tokenAddress,
    sources: llmResult.sources, // Reverted to use llmResult.sources directly for jsonb field
    sentimentType: sentimentTypeValue, // Use the converted enum value
    suggestionType: llmResult.suggestionType,
    confidence: llmResult.confidence ?? 0, // Default confidence to 0 if null
    rationaleSummary: llmResult.reasoning,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours expiry
  };
  try {
    const result = await db.insert(signalsTable).values(signalToInsert).returning();
    const first = Array.isArray(result) ? result[0] : result;
    if (first && first.id) {
      logger.info("insertSignal", `Signal ${first.id} saved to DB.`);
      return { ...signalToInsert, id: first.id } as SignalInsert & { id: string };
    } else {
      logger.error("insertSignal", "Failed to save signal to DB or retrieve ID.", { signalToInsert, dbResult: result });
      return null;
    }
  } catch (error) {
    logger.error("insertSignal", "Error inserting signal into DB", { error, signalDetails: signalToInsert });
    return null;
  }
}

// sendSignalEvent remains the same
async function sendSignalEvent(signalId: string): Promise<void> {
  logger.debug("sendSignalEvent", `Sending processing/signal.detected event for signal ${signalId}`);
  try {
    await inngest.send({
      name: "processing/signal.detected",
      data: { signalId },
    });
    logger.info("sendSignalEvent", `Sent 'processing/signal.detected' event for signal ${signalId}`);
  } catch (error) {
    logger.error("sendSignalEvent", `Failed to send 'processing/signal.detected' event for signal ${signalId}`, {
      error,
    });
    // Do not re-throw here, as the main flow might have already succeeded in saving the signal
  }
}
