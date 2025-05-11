import { openai } from "@ai-sdk/openai";
import type {
  SignalInsert,
  TweetSelect, // This type should align with the structure returned by db.select().from(tweetTable)
} from "@daiko-ai/shared";
import { db, inngest, Logger, LogLevel, signalsTable, tweetTable } from "@daiko-ai/shared";
import { generateObject } from "ai";
import { and, desc, inArray } from "drizzle-orm";
import { z } from "zod";

const logger = new Logger({ level: LogLevel.INFO });

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

    const gatheredTweets = await fetchTweets(updatedAccountIds);
    if (gatheredTweets.length === 0) {
      return { success: true, message: "No new data to process" };
    }

    const llmResult = await detectSignal(gatheredTweets);
    console.log("llmResult", llmResult);
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
    // const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    // const fetchSince = fiveMinutesAgo;
    // logger.debug(
    //   "processSignalDetection",
    //   `Gathering data for ${updatedAccountIds.length} accounts since ${fetchSince.toISOString()} (last 5 mins).`,
    // );
    const tweets = await db
      .select()
      .from(tweetTable)
      .where(and(inArray(tweetTable.authorId, updatedAccountIds)))
      .orderBy(desc(tweetTable.tweetTime))
      .limit(500);
    logger.debug("processSignalDetection", `Finished gathering data. Found ${tweets.length} new tweets.`);
    return tweets;
  } catch (error) {
    logger.error("fetchTweets", "Error fetching tweets", { error });
    throw error;
  }
}

async function detectSignal(tweets: TweetSelect[]): Promise<z.infer<typeof LlmSignalResponseSchema> | null> {
  logger.debug("processSignalDetection", "Performing signal detection with LLM on combined batch data...");
  const promptData = {
    tweets: tweets.map((t) => ({
      id: t.id,
      text: t.content,
      author: t.authorId,
      time: String(t.tweetTime),
      url: t.url,
    })),
  };
  const promptInputText = JSON.stringify(promptData, null, 2);
  const prompt = `
Analyze the following recent tweets related to crypto projects. Each tweet object in the JSON array includes an 'id' (tweet's unique identifier), 'text' (tweet's content), 'author' (the X account ID of the tweeter), 'time' (tweet's timestamp), and a direct 'url' to the tweet itself:
\`\`\`json
${promptInputText}
\`\`\`
Based *only* on the information contained within the provided tweets, generate a single JSON object adhering to the schema below. Do not include any explanatory text before or after the JSON object.

The JSON object must have the following fields:
- "signalDetected": boolean (True if a clear market signal is detected from the provided tweets, false otherwise)
- "tokenAddress": string (The token contract address relevant to the signal. If signalDetected is false or no specific token is identified, use an empty string "")
- "sources": array of objects, where each object has "url" (string) and "label" (string). This array must list the primary sources that informed your signal detection.
    - If signalDetected is true, for each tweet from the input data that directly contributes to the signal:
        - "url": Use the 'url' field from the corresponding input tweet object.
        - "label": Construct a label like "Tweet from account [author_value] (Tweet ID: [tweet_id_value])". Replace [author_value] with the tweet's 'author' (account ID) and [tweet_id_value] with the tweet's 'id'.
    - If signalDetected is true, and a tweet's content explicitly mentions or provides a URL to an external source (e.g., a news article, a blog post) AND the information from this external source (as described or implied in the tweet's text) is crucial for the signal:
        - "url": The URL of the external source as mentioned in the tweet.
        - "label": A descriptive label for the external source (e.g., "News article linked in tweet [tweet_id_value]").
    - If signalDetected is false, this array should be empty.
- "sentimentScore": number (A score from -1.0 (very negative) to 1.0 (very positive) representing the overall sentiment towards the token/project based on the analyzed tweets. If signalDetected is false, use 0.0)
- "suggestionType": string (Must be one of: "buy", "sell", "close_position", "stake". If signalDetected is false, use "buy" as a default placeholder as the schema requires one of these values.)
- "strength": integer (A score from 1 to 100 indicating the strength of the detected signal. If signalDetected is false, provide 1 as it's the minimum allowed by the schema.)
- "confidence": number or null (A score from 0.0 to 1.0 indicating your confidence in the detected signal and its parameters. If signalDetected is false, provide null.)
- "reasoning": string (A concise explanation. If signalDetected is true, explain why the signal was detected, detailing the key information from the tweets that led to this conclusion, and justifying the sentiment, suggestion, strength, and confidence scores. If signalDetected is false, explain why no clear signal was identified from the tweets.)
- "relatedTweetIds": array of strings (An array containing the 'id' values of all tweets from the input data that were analyzed for this signal, regardless of whether a signal was detected or not. If no tweets were analyzed (e.g., empty input), this can be an empty array.)

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
  logger.debug("processSignalDetection", "Inserting detected signal into DB...");
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
      logger.info("processSignalDetection", `Signal ${first.id} saved to DB.`);
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
  logger.debug("processSignalDetection", `Sending processing/signal.detected event for signal ${signalId}`);
  try {
    await inngest.send({
      name: "processing/signal.detected",
      data: { signalId },
    });
    logger.info("processSignalDetection", `Sent 'processing/signal.detected' event for signal ${signalId}`);
  } catch (error) {
    logger.error("sendSignalEvent", `Failed to send 'processing/signal.detected' event for signal ${signalId}`, {
      error,
    });
  }
}
