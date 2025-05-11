import { initProposalGeneratorGraph } from "@daiko-ai/proposal-generator";
import { db, inngest, Logger, LogLevel, proposalTable, signalsTable } from "@daiko-ai/shared";
import { eq } from "drizzle-orm";

const logger = new Logger({ level: process.env.NODE_ENV === "production" ? LogLevel.INFO : LogLevel.DEBUG });

export const generateUserProposal = inngest.createFunction(
  {
    id: "generate-user-proposal",
    name: "Generate User Proposal",
  },
  { event: "proposal/dispatched" },
  async ({ event, step }) => {
    const { signalId, userId } = event.data;

    // 1. Get the signal details to find the tokenAddress
    const signal = await db.query.signalsTable.findFirst({
      where: eq(signalsTable.id, signalId),
      columns: {
        tokenAddress: true,
      },
    });

    if (!signal) {
      logger.error("signal-not-found", `Signal not found: ${signalId}`);
      throw new Error(`Signal not found: ${signalId}`);
    }

    const { graph, config } = await initProposalGeneratorGraph(signalId, userId);

    const result = await graph.invoke({}, config);

    if (!result.proposal) {
      logger.error("proposal-not-found", `Proposal not found for signal ${signalId}`);
      throw new Error("Proposal not found");
    }

    const [proposal] = await db
      .insert(proposalTable)
      .values({
        userId,
        triggerEventId: signalId,
        title: result.proposal.title,
        summary: result.proposal.summary,
        reason: result.proposal.reason,
        sources: result.proposal.sources,
        type: result.proposal.type,
        proposedBy: "Daiko AI",
        financialImpact: result.proposal.financialImpact,
        expiresAt: result.proposal.expiresAt,
        contractCall: result.proposal.contractCall,
        status: "active",
      })
      .returning();

    if (!proposal) {
      logger.error("proposal-creation-failed", `Failed to create proposal for signal ${signalId}`);
      throw new Error("Failed to create proposal");
    }

    await inngest.send({
      name: "proposal/generated",
      data: {
        proposalId: proposal.id,
      },
    });
  },
);
