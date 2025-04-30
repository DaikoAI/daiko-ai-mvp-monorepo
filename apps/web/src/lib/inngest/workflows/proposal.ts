import { inngest } from "../client";
import { events } from "../events";
import { initProposalAgentGraph } from "@daiko-ai/proposal-agent";
import { db, proposalTable } from "@daiko-ai/shared";

export const generateProposal = inngest.createFunction(
  { id: "generate-proposal" },
  { event: events.signalDetected },
  async ({ event, step }) => {
    const { userId } = event.data;
    // Initialize agent graph
    const init = await step.run<{ agent: any; config: any }>("init-agent", () => initProposalAgentGraph(userId));
    const { agent, config } = init;
    // Execute agent to generate proposal
    const runResult = await step.run<{ proposal: any }>("run-agent", () => agent.run(event.data, config));
    const proposal = runResult.proposal;
    if (!proposal) {
      throw new Error("No proposal generated");
    }
    // Persist proposal to DB
    await step.run("save-proposal", async () => {
      await db.insert(proposalTable).values({
        ...proposal,
        userId,
        triggerEventId: event.id,
      });
    });
    // Emit proposal.created event
    await inngest.send({
      name: events.proposalCreated,
      data: { proposalId: proposal.id, userId },
    });
    return { success: true };
  },
);
