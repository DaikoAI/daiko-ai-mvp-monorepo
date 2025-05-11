import { sendWebPush } from "@/lib/notify";
import { db, inngest, Logger, LogLevel, proposalTable } from "@daiko-ai/shared";
import { eq } from "drizzle-orm";

const logger = new Logger({ level: process.env.NODE_ENV === "production" ? LogLevel.INFO : LogLevel.DEBUG });

export const notifyUser = inngest.createFunction(
  { id: "notification-proposal", name: "Notification Workflow" },
  { event: "proposal/generated" },
  async ({ event, step }) => {
    const { proposalId } = event.data;

    const proposal = await db.query.proposalTable.findFirst({
      where: eq(proposalTable.id, proposalId),
    });

    if (!proposal) {
      throw new Error(`Proposal not found: ${proposalId}`);
    }

    if (!proposal.userId) {
      throw new Error("User ID is required for notification");
    }

    await sendWebPush(proposal.userId, {
      title: proposal.title,
      body: proposal.summary,
      data: {
        url: "/proposals",
      },
    });

    logger.info(
      "notification-proposal",
      `Notification workflow completed for proposal ${proposal.id}, user ${proposal.userId}`,
    );

    return { success: true };
  },
);
