import { db, inngest, Logger, LogLevel, signalsTable, userBalancesTable } from "@daiko-ai/shared";
import { eq } from "drizzle-orm";

const logger = new Logger({ level: LogLevel.INFO });

export const proposalDispatcher = inngest.createFunction(
  {
    id: "proposal-dispatcher",
    name: "Signal Proposal Dispatcher",
    // Concurrency, rate limits, idempotency can be configured here
  },
  { event: "processing/signal.detected" }, // Triggered by this event
  async ({ event, step }) => {
    const { signalId } = event.data;
    logger.info("dispatch-start", `Proposal dispatcher started for signalId: ${signalId}`);

    const tokenAddress = await fetchTokenAddress(step, signalId);
    if (!tokenAddress) {
      return {
        message: "Signal has no tokenAddress, no holders to dispatch to.",
        signalId,
      };
    }

    const holders = await findHolders(tokenAddress);
    if (holders.length === 0) {
      return {
        message: "No holders found for the token.",
        signalId,
        tokenAddress,
      };
    }

    await dispatchProposalEvents(signalId, holders);

    return {
      message: `Dispatched proposal generation tasks for ${holders.length} holders.`,
      signalId,
      dispatchedCount: holders.length,
    };
  },
);

// Helpers for readability and single responsibility
async function fetchTokenAddress(step: any, signalId: string): Promise<string | null> {
  const signal = await step.run("get-signal-details-for-dispatch", async () => {
    return db.query.signalsTable.findFirst({
      where: eq(signalsTable.id, signalId),
      columns: { tokenAddress: true },
    });
  });
  if (!signal) {
    logger.error("fetchTokenAddress", `Signal not found: ${signalId}`);
    throw new Error(`Signal not found: ${signalId}`);
  }
  return signal.tokenAddress ?? null;
}

async function findHolders(tokenAddress: string): Promise<Array<{ userId: string }>> {
  try {
    return await db
      .selectDistinct({ userId: userBalancesTable.userId })
      .from(userBalancesTable)
      .where(eq(userBalancesTable.tokenAddress, tokenAddress));
  } catch (error) {
    logger.error("findHolders", `Error fetching holders for token ${tokenAddress}`, { error });
    throw error;
  }
}

async function dispatchProposalEvents(signalId: string, holders: Array<{ userId: string }>): Promise<void> {
  for (const { userId } of holders) {
    await inngest.send({ name: "proposal/dispatched", data: { signalId, userId } });
  }
  logger.info("dispatchProposalEvents", `Dispatched ${holders.length} proposal events for signal ${signalId}`);
}
