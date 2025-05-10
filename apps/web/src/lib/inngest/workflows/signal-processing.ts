import { inngest } from "@daiko-ai/shared";
import { Logger, LogLevel } from "@daiko-ai/shared";
import { z } from "zod";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import {
  db,
  tweetTable,
  signalsTable, // Assuming signalsTable is exported for inserting signals
} from "@daiko-ai/shared";
import { inArray, gt, desc, and } from "drizzle-orm";
import type {
  TweetSelect, // This type should align with the structure returned by db.select().from(tweetTable)
  SignalInsert, // Assuming SignalInsert is the insert type for signalsTable
} from "@daiko-ai/shared";

const logger = new Logger({ level: LogLevel.INFO });

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

/**
 * Fetches tweets for a batch of updated accounts and performs signal detection on the combined data.
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
    // `step` object is kept for potential future use (e.g. step.send, or if logic changes)
    const { updatedAccountIds } = event.data;
    logger.info("processBatchTweetUpdate", `Received batch update for ${updatedAccountIds.length} accounts.`);

    if (!updatedAccountIds || updatedAccountIds.length === 0) {
      logger.warn("processBatchTweetUpdate", "No account IDs provided in the event data.");
      return { success: false, message: "No account IDs received." };
    }

    // Declare gatheredTweets here.
    // TODO: The shared 'Tweet' type definition needs to be updated to match the actual DB schema
    // (e.g., { id: string; xAccountId: string; content: string; tweetTime: Date; ... })
    // Using any[] temporarily to resolve linter errors in this file.
    let gatheredTweets: TweetSelect[] = [];

    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const fetchSince = fiveMinutesAgo;

      logger.debug(
        "processBatchTweetUpdate",
        `Gathering data for ${updatedAccountIds.length} accounts since ${fetchSince.toISOString()} (last 5 mins).`,
      );

      // Assuming tweetTable has columns: id, xAccountId, content, tweetTime, etc.
      // And updatedAccountIds correspond to xAccountId
      gatheredTweets = await db
        .select()
        .from(tweetTable)
        .where(
          and(
            // Corrected: Use actual column name from tweetTable, e.g., xAccountId
            inArray(tweetTable.xAccountId, updatedAccountIds),
            // Corrected: Use actual column name from tweetTable, e.g., tweetTime
            gt(tweetTable.tweetTime, fetchSince),
          ),
        )
        // Corrected: Use actual column name from tweetTable, e.g., tweetTime
        .orderBy(desc(tweetTable.tweetTime))
        .limit(500);

      if (!gatheredTweets || gatheredTweets.length === 0) {
        logger.info("processBatchTweetUpdate", `No new tweets found for the batch since ${fetchSince.toISOString()}.`);
        return { success: true, message: "No new data to process" };
      }

      logger.debug("processBatchTweetUpdate", `Finished gathering data. Found ${gatheredTweets.length} new tweets.`);
    } catch (dbError) {
      logger.error("gather-batch-data", "Error fetching tweets from DB", { error: dbError });
      throw dbError; // Propagate error to make Inngest handle function failure
    }

    // Declare detectedSignalResult here
    let detectedSignalResult: (SignalInsert & { id: string }) | null = null;

    try {
      logger.debug("processBatchTweetUpdate", "Performing signal detection with LLM on combined batch data...");

      const promptData = {
        // Corrected: Map to actual properties of the tweet objects returned from DB
        // Based on linter error: { id: string; xAccountId: string; content: string; tweetTime: Date; ... }
        tweets: gatheredTweets.map((t) => ({
          id: t.id, // Assuming 'id' exists on the tweet object
          text: t.content, // Assuming 'content' is the tweet text
          author: t.xAccountId, // Assuming 'xAccountId' is the author identifier
          time: String(t.tweetTime), // Assuming 'tweetTime' is the creation timestamp
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
Return only the JSON object, for example:
\`\`\`json
{
  "signalDetected": true,
  "tokenAddress": "SOL",
  "sources": [{ "url": "https://twitter.com/.../123", "label": "Tweet by @foo" }],
  "sentimentScore": 0.75,
  "suggestionType": "buy",
  "strength": 80,
  "confidence": 0.9,
  "rationaleSummary": "Strong positive sentiment around SOL after announcement.",
  "relatedTweetIds": ["12345", "67890"]
}
\`\`\`
`;

      let llmResponse: { object: z.infer<typeof LlmSignalResponseSchema> } | null = null;
      try {
        llmResponse = await generateObject({
          model: openai("gpt-4o-mini"),
          schema: LlmSignalResponseSchema,
          prompt: prompt,
          maxTokens: 250,
          temperature: 0.2,
        });
      } catch (llmError) {
        logger.error("detect-signal-from-batch-llm", "Error calling LLM with generateObject", { error: llmError });
        llmResponse = null;
      }

      if (llmResponse?.object?.signalDetected) {
        const llmResult = llmResponse.object;
        logger.info("processBatchTweetUpdate", "Signal detected by LLM", llmResult);

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
            eventId: event.id,
            processedAccountIds: updatedAccountIds,
            relatedTweetIds: llmResult.relatedTweetIds,
          },
        };

        const insertedSignalQuery = await db.insert(signalsTable).values(signalToInsert).returning();

        // Check if returning() gives an array and the first element exists
        const firstInsertedSignal = Array.isArray(insertedSignalQuery) ? insertedSignalQuery[0] : insertedSignalQuery;

        if (firstInsertedSignal && firstInsertedSignal.id) {
          // Assuming firstInsertedSignal contains the full signal including id
          detectedSignalResult = { ...signalToInsert, id: firstInsertedSignal.id };
          logger.info("processBatchTweetUpdate", `Signal ${detectedSignalResult.id} saved to DB.`);
        } else {
          logger.error("processBatchTweetUpdate", "Failed to save signal to DB or retrieve ID.", {
            signalData: signalToInsert,
            dbResult: insertedSignalQuery,
          });
          detectedSignalResult = null;
        }
      } else {
        logger.info("processBatchTweetUpdate", "No significant signal detected by LLM.", {
          reasoning: llmResponse?.object?.reasoning,
        });
        detectedSignalResult = null;
      }
    } catch (processingError) {
      logger.error("detect-signal-from-batch-llm", "Error in signal detection logic", { error: processingError });
      detectedSignalResult = null;
    }

    // --- Step 3: Send event if signal was detected ---
    if (detectedSignalResult && detectedSignalResult.id) {
      try {
        await inngest.send({
          name: "processing/signal.detected",
          data: {
            signalId: detectedSignalResult.id,
          },
        });
        logger.info(
          "processBatchTweetUpdate",
          `Sent 'processing/signal.detected' event for signal ${detectedSignalResult.id}`,
        );
      } catch (inngestError) {
        logger.error(
          "processBatchTweetUpdate",
          `Failed to send 'processing/signal.detected' event for signal ${detectedSignalResult.id}`,
          {
            error: inngestError instanceof Error ? inngestError.message : String(inngestError),
          },
        );
      }
      return { success: true, signalId: detectedSignalResult.id };
    } else {
      return { success: true, signalDetected: false };
    }
    // Timestamp management TODOs removed as per current logic
  },
);
