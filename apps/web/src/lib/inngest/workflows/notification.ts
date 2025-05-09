import { db, inngest } from "@daiko-ai/shared";
import { sendWebPush } from "@/lib/notify";
import { eq } from "drizzle-orm";
import { proposalTable } from "@daiko-ai/shared";
import { Logger, LogLevel } from "@daiko-ai/shared";

const logger = new Logger({ level: LogLevel.INFO });

export const notifyUser = inngest.createFunction(
  { id: "notification-proposal", name: "Notification Workflow" },
  { event: "notification/proposal.created" },
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
