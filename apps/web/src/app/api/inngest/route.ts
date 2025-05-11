import { generateUserProposal } from "@/lib/inngest/workflows/generate-user-proposal";
import { notifyUser } from "@/lib/inngest/workflows/notification";
import { proposalDispatcher } from "@/lib/inngest/workflows/proposal-dispatcher";
import { processSignalDetection } from "@/lib/inngest/workflows/signal-processing";
import { inngest } from "@daiko-ai/shared";
import { serve } from "inngest/next";
export const maxDuration = 300; // 5mins (Pro plan limit = 300 seconds)

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [processSignalDetection, generateUserProposal, proposalDispatcher, notifyUser],
});
