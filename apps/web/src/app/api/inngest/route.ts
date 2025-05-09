import { serve } from "inngest/next";
import { inngest } from "@daiko-ai/shared";
import { notifyUser } from "@/lib/inngest/workflows/notification";
import { generateUserProposal } from "@/lib/inngest/workflows/generate-user-proposal";
import { proposalDispatcher } from "@/lib/inngest/workflows/proposal-dispatcher";

export const maxDuration = 300; // 5mins (Pro plan limit = 300 seconds)

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [generateUserProposal, proposalDispatcher, notifyUser],
});
