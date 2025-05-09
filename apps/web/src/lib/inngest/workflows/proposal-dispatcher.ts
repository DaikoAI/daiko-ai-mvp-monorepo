import { db, inngest, signalsTable, userBalancesTable } from "@daiko-ai/shared";
import { eq } from "drizzle-orm";
import { Logger, LogLevel } from "@daiko-ai/shared";

const logger = new Logger({ level: LogLevel.INFO });

export const proposalDispatcher = inngest.createFunction(
  {
    id: "proposal-dispatcher",
    name: "Signal Proposal Dispatcher",
    // Concurrency, rate limits, idempotency can be configured here
  },
  { event: "processing/signal.detected" }, // Triggered by this event
  async ({ event, step }) => {
    const { signalId } = event.data; // User removed type assertion, Inngest should infer if types are correct

    logger.info("dispatch-start", `Proposal dispatcher started for signalId: ${signalId}`);

    // 1. Get the signal details to find the tokenAddress
    const signal = await step.run("get-signal-details-for-dispatch", async () => {
      return db.query.signalsTable.findFirst({
        where: eq(signalsTable.id, signalId),
        columns: {
          tokenAddress: true, // Only fetch necessary columns
        },
      });
    });

    if (!signal) {
      logger.error("get-signal-failed", `Signal not found: ${signalId}. Dispatcher terminating.`);
      throw new Error(`Signal not found: ${signalId}`);
    }

    if (!signal.tokenAddress) {
      logger.warn("no-token-address", `Signal ${signalId} has no tokenAddress. No proposals will be dispatched.`);
      return {
        message: "Signal has no tokenAddress, no holders to dispatch to.",
        signalId,
      };
    }

    logger.info("signal-details-fetched", `Signal ${signalId} affects token: ${signal.tokenAddress}`);

    // 2. Get all unique holders of the asset (token) affected by the signal
    // This is a direct DB query, not wrapped in step.run, as its failure means the dispatcher cannot proceed.
    // If it were part of a larger workflow that could continue, step.run might be appropriate.
    let holders: Array<{ userId: string }> = [];
    try {
      holders = await db
        .selectDistinct({ userId: userBalancesTable.userId })
        .from(userBalancesTable)
        .where(eq(userBalancesTable.tokenAddress, signal.tokenAddress));
    } catch (dbError) {
      logger.error(
        "fetch-holders-failed",
        `Database error fetching holders for token ${signal.tokenAddress}: ${dbError instanceof Error ? dbError.message : String(dbError)}`,
      );
      throw dbError; // Rethrow to let Inngest handle retry/failure
    }

    if (holders.length === 0) {
      logger.info(
        "no-holders-found",
        `No holders found for token ${signal.tokenAddress} (signal ${signalId}). No proposals dispatched.`,
      );
      return {
        message: "No holders found for the token.",
        signalId,
        tokenAddress: signal.tokenAddress,
      };
    }

    logger.info(
      "holders-fetched",
      `Found ${holders.length} unique holders for token ${signal.tokenAddress}. Sending events.`,
    );

    holders.forEach(async (holder) => {
      await inngest.send({
        name: "proposal/dispatched",
        data: {
          signalId: signalId,
          userId: holder.userId,
        },
      });
    });

    logger.info(
      "dispatch-events-sent",
      `Successfully sent ${holders.length} proposal generation events for signal ${signalId}.`,
    );

    return {
      message: `Dispatched proposal generation tasks for ${holders.length} holders.`,
      signalId,
      dispatchedCount: holders.length,
    };
  },
);
