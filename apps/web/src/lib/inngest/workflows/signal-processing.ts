import { openai } from "@ai-sdk/openai";
import type {
  SignalInsert,
  TweetSelect, // This type should align with the structure returned by db.select().from(tweetTable)
} from "@daiko-ai/shared";
import { db, inngest, Logger, LogLevel, signalsTable, tweetTable } from "@daiko-ai/shared";
import { generateObject } from "ai";
import { and, desc, gt, inArray } from "drizzle-orm";
import { z } from "zod";

const logger = new Logger({ level: LogLevel.INFO });

/**
 * Inngest function to process batch tweet updates and detect market signals.
 */
export const processBatchTweetUpdate = inngest.createFunction(
  {
    id: "process-batch-tweet-update",
    name: "Process Batch Tweet Update for Signal Detection",
    // Optional: Configure concurrency, retries, etc.
  },
  {
    event: "data/tweet.updated", // This event should contain { updatedAccountIds: string[] }
  },
  async ({ event, step }) => {
    const { updatedAccountIds = [] } = event.data;
    const eventId = event.id;
    if (!eventId) {
      logger.error("processBatchTweetUpdate", "Missing event ID");
      return { success: false, message: "Missing event ID" };
    }
    logger.info("processBatchTweetUpdate", `Received batch update for ${updatedAccountIds.length} accounts.`);

    if (!updatedAccountIds || updatedAccountIds.length === 0) {
      logger.warn("processBatchTweetUpdate", "No account IDs provided in the event data.");
      return { success: false, message: "No account IDs received." };
    }

    const gatheredTweets = await fetchTweets(updatedAccountIds);
    if (gatheredTweets.length === 0) {
      return { success: true, message: "No new data to process" };
    }

    const llmResult = await detectSignal(gatheredTweets);
    if (!llmResult?.signalDetected) {
      return { success: true, signalDetected: false };
    }

    const insertedSignal = await insertSignal(llmResult, eventId, updatedAccountIds);
    if (!insertedSignal?.id) {
      return { success: true, signalDetected: false };
    }

    await sendSignalEvent(insertedSignal.id);
    return { success: true, signalId: insertedSignal.id };
  },
);

// Define Zod schema for the expected LLM response
const LlmSignalResponseSchema = z.object({
  signalDetected: z.boolean(),
  tokenAddress: z.string(),
  sources: z.array(z.object({ url: z.string(), label: z.string() })),
  sentimentScore: z.number(),
  suggestionType: z.enum(["buy", "sell", "close_position", "stake"]),
  strength: z.number().min(1).max(100),
  confidence: z.number().nullable(),
  reasoning: z.string(),
  relatedTweetIds: z.array(z.string()),
});

// Helpers for processBatchTweetUpdate
async function fetchTweets(updatedAccountIds: string[]): Promise<TweetSelect[]> {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const fetchSince = fiveMinutesAgo;
    logger.debug(
      "processBatchTweetUpdate",
      `Gathering data for ${updatedAccountIds.length} accounts since ${fetchSince.toISOString()} (last 5 mins).`,
    );
    const tweets = await db
      .select()
      .from(tweetTable)
      .where(and(inArray(tweetTable.xAccountId, updatedAccountIds), gt(tweetTable.tweetTime, fetchSince)))
      .orderBy(desc(tweetTable.tweetTime))
      .limit(500);
    logger.debug("processBatchTweetUpdate", `Finished gathering data. Found ${tweets.length} new tweets.`);
    return tweets;
  } catch (error) {
    logger.error("fetchTweets", "Error fetching tweets", { error });
    throw error;
  }
}

async function detectSignal(tweets: TweetSelect[]): Promise<z.infer<typeof LlmSignalResponseSchema> | null> {
  logger.debug("processBatchTweetUpdate", "Performing signal detection with LLM on combined batch data...");
  const promptData = {
    tweets: tweets.map((t) => ({
      id: t.id,
      text: t.content,
      author: t.xAccountId,
      time: String(t.tweetTime),
    })),
  };
  const promptInputText = JSON.stringify(promptData, null, 2);
  const prompt = `
Analyze the following recent tweets related to crypto projects:
\`\`\`json
${promptInputText}
\`\`\`
Based *only* on the tweets provided, generate a market sentiment signal JSON object with the following fields:
- signalDetected: boolean
- tokenAddress: string
- sources: array of { url: string, label: string }
- sentimentScore: number (-1.0 to 1.0)
- suggestionType: one of "buy", "sell", "close_position", "stake"
- strength: integer (1 to 100)
- confidence: number (0.0 to 1.0)
- rationaleSummary: string
- relatedTweetIds: string[]
Return only the JSON object.`;
  try {
    const response = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: LlmSignalResponseSchema,
      prompt,
      maxTokens: 250,
      temperature: 0.2,
    });
    return response.object;
  } catch (error) {
    logger.error("detectSignal", "Error calling LLM", { error });
    return null;
  }
}

async function insertSignal(
  llmResult: z.infer<typeof LlmSignalResponseSchema>,
  eventId: string,
  processedAccountIds: string[],
): Promise<(SignalInsert & { id: string }) | null> {
  logger.debug("processBatchTweetUpdate", "Inserting detected signal into DB...");
  const signalToInsert: SignalInsert = {
    tokenAddress: llmResult.tokenAddress,
    sources: llmResult.sources,
    sentimentScore: llmResult.sentimentScore,
    suggestionType: llmResult.suggestionType,
    strength: Math.round(llmResult.strength),
    confidence: llmResult.confidence ?? 0,
    rationaleSummary: llmResult.reasoning,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    metadata: {
      eventId,
      processedAccountIds,
      relatedTweetIds: llmResult.relatedTweetIds,
    },
  };
  try {
    const result = await db.insert(signalsTable).values(signalToInsert).returning();
    const first = Array.isArray(result) ? result[0] : result;
    if (first && first.id) {
      logger.info("processBatchTweetUpdate", `Signal ${first.id} saved to DB.`);
      return { ...signalToInsert, id: first.id };
    } else {
      logger.error("insertSignal", "Failed to save signal to DB or retrieve ID.", { signalToInsert, dbResult: result });
      return null;
    }
  } catch (error) {
    logger.error("insertSignal", "Error inserting signal into DB", { error });
    return null;
  }
}

async function sendSignalEvent(signalId: string): Promise<void> {
  logger.debug("processBatchTweetUpdate", `Sending processing/signal.detected event for signal ${signalId}`);
  try {
    await inngest.send({
      name: "processing/signal.detected",
      data: { signalId },
    });
    logger.info("processBatchTweetUpdate", `Sent 'processing/signal.detected' event for signal ${signalId}`);
  } catch (error) {
    logger.error("sendSignalEvent", `Failed to send 'processing/signal.detected' event for signal ${signalId}`, {
      error,
    });
  }
}
